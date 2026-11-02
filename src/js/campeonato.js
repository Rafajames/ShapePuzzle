/* ======================= Campeonatos ======================= */
const NUVEM_PADRAO = 'https://shapepuzzle-76162-default-rtdb.firebaseio.com';   // banco oficial do jogo (o endereço e a chave abaixo são públicos; quem protege os dados são as regras)
const NUVEM_CHAVE = 'AIzaSyBkKDk5wqXbPr_hPNW4g14Qite7IpUS-DA';
let cpNome = store.get('cpnome', '');
let cpMeus = store.get('cpmeus', []);
let cpDb = dbValido(store.get('cpdb', '')) || dbValido(NUVEM_PADRAO);
let cpChave = String(store.get('cpchave', '') || NUVEM_CHAVE);
let cpAuth = store.get('cpauth', null);   // {uid, key, refresh, token, exp}: o aparelho reconhecido
let cpPend = store.get('cppend', []);
const CP = {id: null, db: '', camp: null, jogs: {}, timer: 0, convite: null, fases: []};
const cpKey = () => normalizarNome(cpNome);
const erroNuvem = cod => Object.assign(new Error(cod), {cod});
const MSG_NUVEM = {negado: 'O banco de dados recusou o pedido (as regras de segurança foram publicadas?).', rede: 'Sem conexão com o banco de dados.', tempo: 'O banco de dados demorou demais para responder.', http: 'O banco de dados retornou um erro.'};
const msgNuvem = e => e && e.cod === 'auth' ? msgAuth(e.auth) : MSG_NUVEM[e && e.cod] || 'Algo deu errado. Tente de novo.';
async function nuvem(db, metodo, caminho, corpo, token){
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 9000);
  try{
    const r = await fetch(db + '/' + caminho + '.json' + (token ? '?auth=' + encodeURIComponent(token) : ''), {method: metodo, body: corpo === undefined ? undefined : JSON.stringify(corpo), signal: ctl.signal, cache: 'no-store'});
    if (r.status === 401 || r.status === 403) throw erroNuvem('negado');
    if (!r.ok) throw erroNuvem('http');
    return await r.json();
  }catch(e){ throw e && e.cod ? e : erroNuvem(e && e.name === 'AbortError' ? 'tempo' : 'rede'); }
  finally{ clearTimeout(to); }
}
function aviso(sel, msg, tipo){ const e = $(sel); e.textContent = tr(msg || ''); e.className = 'aviso' + (tipo ? ' ' + tipo : ''); }
function lembrarCamp(id, db, nome, org){
  cpMeus = cpMeus.filter(c => c.id !== id); cpMeus.unshift({id, db, nome, org: !!org}); cpMeus = cpMeus.slice(0, 30); store.set('cpmeus', cpMeus);
}
const urlConvite = (id, db) => urlBase() + '#c=' + id + '&db=' + encodeURIComponent(db);
function lerConvite(){
  const c = lerConviteHash(location.hash, cpDb);
  if (c) history.replaceState(null, '', location.pathname + location.search);
  return c;
}
CP.convite = lerConvite();
window.addEventListener('hashchange', () => { const c = lerConvite(); if (c){ document.querySelectorAll('.ov.on').forEach(o => { if (o.id !== 'ov-splash') o.classList.remove('on'); }); abrirLobby(c.id, c.db); } });

/* ---- login do organizador: nome + senha (Firebase Auth, sem e-mail de verdade) ---- */
async function authChamar(url, corpo){
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 9000);
  try{
    const r = await fetch(url, {method: 'POST', body: JSON.stringify(corpo), signal: ctl.signal, headers: {'Content-Type': 'application/json'}});
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error('auth'), {cod: 'auth', auth: (j.error && j.error.message) || 'ERRO'});
    return j;
  }catch(e){ throw e && e.cod ? e : erroNuvem(e && e.name === 'AbortError' ? 'tempo' : 'rede'); }
  finally{ clearTimeout(to); }
}
function guardarAuth(j, key, nome){
  cpAuth = {uid: j.localId, key, nome, refresh: j.refreshToken, token: j.idToken, exp: Date.now() + (parseInt(j.expiresIn, 10) || 3600) * 1000};
  store.set('cpauth', cpAuth);
}
async function authEntrar(nome, senha, criar){
  const key = normalizarNome(nome);
  const j = await authChamar(`https://identitytoolkit.googleapis.com/v1/accounts:${criar ? 'signUp' : 'signInWithPassword'}?key=${encodeURIComponent(cpChave)}`,
    {email: emailOrganizador(nome), password: senha, returnSecureToken: true});
  guardarAuth(j, key, limparNome(nome)); return cpAuth;
}
/* token válido (renova sozinho enquanto o aparelho é reconhecido); null se precisa da senha de novo */
async function tokenOrganizador(){
  if (!cpAuth) return null;
  if (cpAuth.exp - Date.now() > 60000) return cpAuth.token;
  try{
    const j = await authChamar('https://securetoken.googleapis.com/v1/token?key=' + encodeURIComponent(cpChave), {grant_type: 'refresh_token', refresh_token: cpAuth.refresh});
    cpAuth.token = j.id_token; cpAuth.refresh = j.refresh_token || cpAuth.refresh; cpAuth.exp = Date.now() + (parseInt(j.expires_in, 10) || 3600) * 1000; store.set('cpauth', cpAuth);
    return cpAuth.token;
  }catch(e){
    if (e.cod === 'auth'){ cpAuth = null; store.set('cpauth', null); return null; }
    throw e;
  }
}
const souDono = () => !!(cpAuth && CP.camp && CP.camp.uid === cpAuth.uid);

/* resultados guardados quando não há internet */
async function cpEnviarUm(p){
  const cam = `p/${p.id}/${p.key}/f/${p.idx}`;
  const atual = await nuvem(p.db, 'GET', cam);
  if (atual && (p.modo === 'primeira' || atual.t <= p.t)) return 'mantido';
  await nuvem(p.db, 'PUT', cam, {t: p.t, j: p.j});
  return 'ok';
}
async function cpDescarregar(){
  if (!cpPend.length) return;
  const resto = [];
  for (const p of cpPend){
    try{ await cpEnviarUm(p); }
    catch(e){ if (e.cod === 'rede' || e.cod === 'tempo') resto.push(p); }
  }
  cpPend = resto; store.set('cppend', cpPend);
}
addEventListener('online', () => cpDescarregar());

/* ---- início ---- */
function renderCpLista(){
  const l = $('#cpLista'); l.innerHTML = '';
  if (!cpMeus.length){ l.innerHTML = '<p class="vazio2">' + tr('Você ainda não está em nenhum campeonato.') + '</p>'; return; }
  cpMeus.forEach(c => {
    const d = document.createElement('div'); d.className = 'cust';
    const sp = document.createElement('span'); sp.textContent = c.nome + (c.org ? ' · ' + tr('organizador') : ''); d.appendChild(sp);
    const ab = document.createElement('button'); ab.className = 'ib'; ab.innerHTML = ic('play'); ab.setAttribute('aria-label', tr('Abrir') + ': ' + c.nome); ab.onclick = () => { fechar('camps'); abrirLobby(c.id, c.db); }; d.appendChild(ab);
    const rm = document.createElement('button'); rm.className = 'ib'; rm.innerHTML = ic('trash'); rm.setAttribute('aria-label', tr('Tirar da lista') + ': ' + c.nome);
    rm.onclick = () => { cpMeus = cpMeus.filter(x => x.id !== c.id); store.set('cpmeus', cpMeus); renderCpLista(); }; d.appendChild(rm);
    l.appendChild(d);
  });
}
function renderOrg(){
  const logado = !!cpAuth;
  $('#cpOrg').hidden = logado; $('#cpOrgOk').hidden = !logado;
  if (logado){ $('#cpNome').value = cpAuth.nome; cpNome = cpAuth.nome; store.set('cpnome', cpNome); $('#cpOrgNome').textContent = tr('Organizador: {nome} ✓ (este aparelho é reconhecido)', {nome: cpAuth.nome}); }
  $('#cpNome').disabled = logado;
  $('#cpSenha').value = ''; $('#cpSenha2').value = ''; $('#cpSenha2').hidden = true;
}
function abrirCamps(){
  $('#cpNome').value = cpNome; $('#cpDb').value = cpDb; $('#cpChave').value = cpChave === NUVEM_CHAVE ? '' : cpChave; $('#cpCfg').open = !cpDb && !cpMeus.length;
  renderOrg(); aviso('#cpAviso', ''); renderCpLista(); cpDescarregar(); abrir('camps');
}
$('#cpSair').onclick = () => { cpAuth = null; store.set('cpauth', null); $('#cpNome').disabled = false; renderOrg(); aviso('#cpAviso', 'Saiu do modo organizador neste aparelho. Os campeonatos que você criou continuam no ar.', 'ok'); };
function exigirNome(sel, av){
  const n = limparNome($(sel).value);
  if (!nomeValido(n)){ aviso(av, 'Digite o seu nome (pelo menos 2 letras).', 'erro'); $(sel).focus(); return false; }
  cpNome = n; store.set('cpnome', n); return true;
}
$('#cpDbSalvar').onclick = () => {
  const v = dbValido($('#cpDb').value);
  if (!v){ aviso('#cpAviso', 'Endereço inválido. Ele deve começar com https:// e terminar em firebaseio.com ou firebasedatabase.app.', 'erro'); return; }
  const k = $('#cpChave').value.trim();
  if (k && !/^[A-Za-z0-9_-]{20,80}$/.test(k)){ aviso('#cpAviso', 'A chave da API parece errada.', 'erro'); return; }
  if (v !== cpDb || (k || NUVEM_CHAVE) !== cpChave){ cpAuth = null; store.set('cpauth', null); }
  cpDb = v; store.set('cpdb', v); cpChave = k || NUVEM_CHAVE; store.set('cpchave', k);
  $('#cpDb').value = v; renderOrg(); aviso('#cpAviso', 'Salvo.', 'ok');
};
/* primeira vez: cria a conta de organizador (nome + senha). Depois o aparelho é reconhecido sozinho. */
async function entrarOrganizador(){
  const senha = $('#cpSenha').value, confirmando = !$('#cpSenha2').hidden;
  if (senha.length < 6) throw {cod: 'auth', auth: 'WEAK_PASSWORD'};
  if (!confirmando){
    try{ await authEntrar(cpNome, senha, false); return; }
    catch(e){
      if (e.cod === 'auth' && /INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND|INVALID_PASSWORD/.test(e.auth)){
        $('#cpSenha2').hidden = false; $('#cpSenha2').focus();
        aviso('#cpAviso', 'Não achei essa conta. Se é a sua primeira vez, repita a senha no campo abaixo para criá-la. Se você já tem conta, confira o nome e a senha.', 'erro');
        throw {cod: 'tratado'};
      }
      throw e;
    }
  }
  if ($('#cpSenha2').value !== senha){ aviso('#cpAviso', 'As duas senhas precisam ser iguais.', 'erro'); throw {cod: 'tratado'}; }
  await authEntrar(cpNome, senha, true);
}
$('#cpCriar').onclick = async () => {
  if (!cpAuth && !exigirNome('#cpNome', '#cpAviso')) return;
  if (!cpDb || !cpChave){ $('#cpCfg').open = true; aviso('#cpAviso', 'Informe o endereço do banco e a chave da API (veja CAMPEONATOS.md).', 'erro'); return; }
  const btn = $('#cpCriar'); btn.disabled = true; aviso('#cpAviso', '');
  try{
    if (!(await tokenOrganizador())) await entrarOrganizador();
    renderOrg(); fechar('camps'); abrirCriar();
  }catch(e){ if (e.cod !== 'tratado') aviso('#cpAviso', msgNuvem(e), 'erro'); }
  btn.disabled = false;
};
$('#cpEntrar').onclick = () => {
  const id = $('#cpCodigo').value.trim().toUpperCase();
  if (!exigirNome('#cpNome', '#cpAviso')) return;
  if (!codigoValido(id)){ aviso('#cpAviso', 'O código tem 6 letras/números, como ABC234.', 'erro'); return; }
  if (!cpDb){ $('#cpCfg').open = true; aviso('#cpAviso', 'Sem o endereço do banco não dá para entrar por código. Peça o link do convite ao organizador.', 'erro'); return; }
  fechar('camps'); abrirLobby(id, cpDb);
};

