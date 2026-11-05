/* ======================= Conta (login opcional com o Google) =======================
   O jogo inteiro funciona sem conta. Com ela: nome, avatar e moldura, e o progresso guardado na nuvem
   (juntando o que já existe no aparelho com o que está na nuvem — nunca se perde nada).
   O Firebase só é baixado quando a pessoa usa a conta. */
const FB_VERSAO = '10.14.1';
const FB_SCRIPTS = ['firebase-app-compat.js', 'firebase-auth-compat.js'].map(f => `https://www.gstatic.com/firebasejs/${FB_VERSAO}/${f}`);
const FB_CONFIG = {apiKey: NUVEM_CHAVE, authDomain: 'shapepuzzle-76162.firebaseapp.com', projectId: 'shapepuzzle-76162'};
const N_AVATARES = 12;
const PALETA_AV = ['#e5484d', '#f76b15', '#d9960b', '#46a758', '#12a594', '#3e63dd', '#8e4ec6', '#d6409f', '#6c5340', '#0090ff', '#30a46c', '#ad7f58'];
/* Molduras: `livre` = qualquer um usa; as outras ficam com cadeado, prontas para serem liberadas depois (conquistas, loja, brindes). */
const MOLDURAS = [{id: '', nome: 'Sem moldura', livre: true}, {id: 'madeira', nome: 'Madeira', livre: true},
  {id: 'ouro', nome: 'Ouro', livre: false}, {id: 'pixel', nome: 'Pixel', livre: false}, {id: 'festa', nome: 'Festa', livre: false}];
let conta = store.get('conta', null);   // {uid, nome, av, mold, foto?, sujo?, fotoSuja?, ultima?, expirou?}
const COD_FECHOU = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'], COD_DOMINIO = 'auth/unauthorized-domain';
const COD_BLOQUEOU = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'];
let fbAuth = null, contaOcupada = false, contaTimer = null;

/* ---------- avatar ---------- */
const hashTxt = t => { let h = 2166136261; for (let i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const avPadrao = uid => 'p' + (1 + hashTxt(String(uid)) % N_AVATARES);
const avValido = id => id === 'foto' || (/^p\d{1,2}$/.test(id) && +id.slice(1) >= 1 && +id.slice(1) <= N_AVATARES) ? id : 'p1';
const moldValida = id => MOLDURAS.some(m => m.id === id && m.livre) ? id : '';
const ehFoto = f => typeof f === 'string' && f.length <= 12000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(f);
function svgAvatar(id){
  const n = +String(id).slice(1) || 1;
  let h = (Math.imul(n, 2654435761) >>> 0) || 1;
  const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h; };
  for (let i = 0; i < 6; i++) rnd();
  const cor = PALETA_AV[(n - 1) % PALETA_AV.length];
  let r = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++){
    if ((rnd() % 100) < (y === 0 || y === 7 ? 35 : 58)) r += `<rect x="${x}" y="${y}" width="1" height="1"/><rect x="${7 - x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><rect width="8" height="8" fill="#fff6dc"/><g fill="${cor}">${r}</g></svg>`;
}
/* Monta o avatar de uma conta ({av, foto, mold}) com a moldura, no tamanho `tam` (px). */
function avatarEl(c, tam){
  const e = mk('span', 'av' + (c && c.mold ? ' m-' + c.mold : ''));
  e.style.setProperty('--t', (tam || 40) + 'px');
  if (c && c.av === 'foto' && ehFoto(c.foto)){ const i = new Image(); i.alt = ''; i.src = c.foto; e.appendChild(i); }
  else e.innerHTML = svgAvatar(c && c.av && c.av !== 'foto' ? c.av : 'p1');
  return e;
}

/* ---------- tela inicial e tela da conta ---------- */
function renderConta(){
  const b = $('#hConta'); if (!b) return;
  b.textContent = '';
  if (!conta){ b.innerHTML = ic('user'); b.appendChild(mk('span', '', tr('Entrar com Google'))); b.appendChild(mk('small', '', tr('opcional'))); b.setAttribute('aria-label', tr('Entrar com Google')); }
  else {
    b.appendChild(avatarEl(conta, 30));
    const nm = mk('span', 'cnN', conta.nome); b.appendChild(nm);
    b.appendChild(mk('small', '', tr('Meu perfil'))); b.setAttribute('aria-label', tr('Meu perfil') + ': ' + conta.nome);
  }
  if ($('#ov-conta').classList.contains('on')) montarConta();
}
function estadoConta(txt){ const e = $('#cnEstado'); if (e) e.textContent = txt ? tr(txt) : ''; }
function textoUltima(){
  if (!conta) return '';
  if (conta.expirou) return 'Entre de novo para sincronizar.';
  if (conta.sujo) return 'Há mudanças para enviar à nuvem.';
  return conta.ultima ? tr('Sincronizado às {hora}', {hora: new Date(conta.ultima).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}) : 'Ainda não sincronizado.';
}
function montarConta(){
  $('#cnFora').hidden = !!conta; $('#cnDentro').hidden = !conta;
  if (!conta) return;
  $('#cnAvatar').textContent = ''; $('#cnAvatar').appendChild(avatarEl(conta, 64));
  $('#cnNomeTxt').textContent = conta.nome; if (document.activeElement !== $('#cnNome')) $('#cnNome').value = conta.nome;
  estadoConta(textoUltima());
  const ga = $('#cnAvatares'); ga.textContent = '';
  const ids = []; for (let i = 1; i <= N_AVATARES; i++) ids.push('p' + i);
  if (ehFoto(conta.foto)) ids.push('foto');
  ids.forEach((id, i) => {
    const b = mk('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', conta.av === id ? 'true' : 'false');
    b.setAttribute('aria-label', id === 'foto' ? tr('Minha foto') : tr('Avatar {n}', {n: i + 1})); b.dataset.av = id;
    b.appendChild(avatarEl({av: id, foto: conta.foto}, 44)); b.onclick = () => mudarPerfil({av: id}); ga.appendChild(b);
  });
  const gm = $('#cnMolduras'); gm.textContent = '';
  MOLDURAS.forEach(m => {
    const b = mk('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', conta.mold === m.id ? 'true' : 'false'); b.dataset.mold = m.id;
    b.setAttribute('aria-label', tr(m.nome) + (m.livre ? '' : ' — ' + tr('Em breve'))); b.disabled = !m.livre; b.title = m.livre ? tr(m.nome) : tr('Em breve');
    b.appendChild(avatarEl({av: conta.av, foto: conta.foto, mold: m.id}, 40));
    if (!m.livre){ const l = mk('i', 'cnLock'); l.innerHTML = ic('lock'); b.appendChild(l); }
    b.onclick = () => mudarPerfil({mold: m.id}); gm.appendChild(b);
  });
}
function abrirConta(){ aviso('#cnAviso', ''); montarConta(); abrir('conta'); }

/* ---------- Firebase (carregado só quando precisa) ---------- */
const carregarScript = src => new Promise((ok, no) => {
  const e = document.createElement('script'); const t = setTimeout(() => no(new Error('rede')), 20000);
  e.src = src; e.onload = () => { clearTimeout(t); ok(); }; e.onerror = () => { clearTimeout(t); no(new Error('rede')); }; document.head.appendChild(e);
});
function firebaseAuth(){
  if (fbAuth) return fbAuth;
  fbAuth = (async () => { for (const s of FB_SCRIPTS) await carregarScript(s); firebase.initializeApp(FB_CONFIG); return firebase.auth(); })();
  fbAuth.catch(() => { fbAuth = null; });
  return fbAuth;
}
const usuarioPronto = a => new Promise(ok => { let off = null, feito = false; off = a.onAuthStateChanged(u => { feito = true; if (off) off(); ok(u); }); if (feito && off) off(); });
async function contaToken(){
  const a = await firebaseAuth(), u = a.currentUser || await usuarioPronto(a);
  if (!u || (conta && u.uid !== conta.uid)) return null;
  return u.getIdToken();
}
const nv = (m, caminho, corpo, tk) => nuvem(cpDb, m, caminho, corpo, tk);
const aplicarNomeCamp = () => { if (conta && !cpAuth){ cpNome = conta.nome; store.set('cpnome', cpNome); } };
const salvarConta = () => { store.set('conta', conta); renderConta(); };

/* ---------- entrar / sair ---------- */
async function contaEntrar(){
  aviso('#cnAviso', 'Abrindo o login do Google…'); $('#cnEntrar').disabled = true;
  try{
    const a = await firebaseAuth(), prov = new firebase.auth.GoogleAuthProvider();
    let r;
    try{ r = await a.signInWithPopup(prov); }
    catch(e){
      const c = e && e.code;
      if (COD_FECHOU.includes(c)){ aviso('#cnAviso', 'Login cancelado.'); return; }
      if (COD_BLOQUEOU.includes(c)){ store.set('contaredir', 1); await a.signInWithRedirect(prov); return; }
      throw e;
    }
    aviso('#cnAviso', 'Conectando…');
    await contaPosLogin(r.user);
  }catch(e){
    const dominio = !!e && e.code === COD_DOMINIO;
    aviso('#cnAviso', dominio ? 'Este endereço ainda não foi liberado para o login. Avise o dono do jogo.' : 'Não consegui entrar agora. Confira a internet e tente de novo.', 'erro');
  }finally{ $('#cnEntrar').disabled = false; }
}
async function contaPosLogin(user){
  const tk = await user.getIdToken();
  const pub = await nv('GET', 'pub/' + user.uid, undefined, tk);
  if (pub && pub.nome){
    conta = {uid: user.uid, nome: limparNome(pub.nome) || 'Jogador', av: avValido(pub.av), mold: moldValida(pub.mold)};
    if (conta.av === 'foto'){
      let f = null; try{ f = await nv('GET', 'foto/' + user.uid, undefined, tk); }catch(e){}
      if (ehFoto(f)) conta.foto = f; else conta.av = avPadrao(user.uid);
    }
  } else {
    let n = limparNome(String(user.displayName || '').split(' ')[0]); if (n.length < 2) n = 'Jogador';
    conta = {uid: user.uid, nome: n, av: avPadrao(user.uid), mold: '', sujo: true};
  }
  aplicarNomeCamp(); salvarConta(); montarConta(); aviso('#cnAviso', '');
  await contaSync({aplicar: true});
}
async function contaSair(){
  try{ const a = await Promise.race([firebaseAuth(), new Promise((_, no) => setTimeout(() => no(), 4000))]); await a.signOut(); }catch(e){}
  conta = null; store.set('conta', null); renderConta(); montarConta(); aviso('#cnAviso', 'Você saiu. O progresso continua neste aparelho.', 'ok');
}
async function contaApagar(){
  if (!conta || !confirm(tr('Apagar da nuvem seu perfil e o progresso guardado? O progresso deste aparelho continua.'))) return;
  try{
    const tk = await contaToken(); if (!tk) throw new Error('sessao');
    for (const c of ['pub', 'priv', 'foto']) await nv('DELETE', c + '/' + conta.uid, undefined, tk);
  }catch(e){ aviso('#cnAviso', 'Não consegui apagar agora. Confira a internet e tente de novo.', 'erro'); return; }
  await contaSair(); aviso('#cnAviso', 'Seus dados foram apagados da nuvem.', 'ok');
}

/* ---------- sincronização ---------- */
const estavel = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, c) => (o[c] = x[c], o), {}) : x);
const semCfg = d => { const o = JSON.parse(JSON.stringify(d || {})); delete o.cfg; if (o.prog && o.prog.done) o.prog.done.sort((a, b) => a - b); return o; };
const fasesFeitas = d => Math.min(1000, d && d.prog ? d.prog.done.length : 0);
async function contaPublicar(tk, dados){
  if (conta.av === 'foto' && conta.fotoSuja && ehFoto(conta.foto)){ await nv('PUT', 'foto/' + conta.uid, conta.foto, tk); conta.fotoSuja = false; }
  await nv('PUT', 'pub/' + conta.uid, {nome: conta.nome, av: conta.av, mold: conta.mold || '', n: fasesFeitas(dados), ts: Date.now()}, tk);
}
async function contaSync(op){
  op = op || {};
  if (!conta || contaOcupada) return;
  contaOcupada = true; estadoConta('Sincronizando…');
  try{
    const tk = await contaToken();
    if (!tk){ conta.expirou = true; salvarConta(); return; }
    conta.expirou = false;
    let nuv = null;
    const priv = await nv('GET', 'priv/' + conta.uid, undefined, tk);
    if (priv && typeof priv.d === 'string'){ const r = await lerBackup(priv.d); if (!r.erro) nuv = r.dados; }
    const local = dadosLimpos(), junto = nuv ? juntarDados(local, nuv) : local;
    const mudou = !!nuv && estavel(semCfg(junto)) !== estavel(semCfg(local));
    const cod = await codigoBackup(junto);
    if (cod.length <= 250000) await nv('PUT', 'priv/' + conta.uid, {d: cod, ts: Date.now()}, tk);
    await contaPublicar(tk, junto);
    conta.sujo = false; conta.ultima = Date.now(); salvarConta();
    if (mudou){
      if (op.aplicar){ gravarBackup(junto, false, false, 'Progresso da nuvem recebido! Reiniciando o jogo…'); return; }
      estadoConta('Há progresso novo na nuvem. Toque em Sincronizar agora para recebê-lo.');
    }
  }catch(e){
    if (conta){ conta.sujo = true; store.set('conta', conta); }
    estadoConta(e && e.cod === 'negado' ? 'A nuvem recusou a gravação. Tente sair e entrar de novo.' : 'Sem conexão agora. Tentamos de novo mais tarde.');
  }finally{ contaOcupada = false; }
}
/* Chamada a cada fase vencida: sincroniza em segundo plano, com folga para não gastar rede à toa. */
function contaAgendar(){ if (!conta) return; clearTimeout(contaTimer); contaTimer = setTimeout(() => contaSync({aplicar: false}), 30000); }
/* Envia só o perfil (nome, avatar, moldura) depois de uma edição. */
async function contaPerfilRapido(){
  try{ const tk = await contaToken(); if (!tk) throw new Error('sessao'); await contaPublicar(tk, dadosLimpos()); conta.sujo = false; store.set('conta', conta); estadoConta(textoUltima()); }
  catch(e){ conta.sujo = true; store.set('conta', conta); estadoConta('Sem conexão agora. Tentamos de novo mais tarde.'); }
}
function mudarPerfil(m){
  if (!conta) return;
  if (m.av !== undefined) conta.av = m.av;
  if (m.mold !== undefined) conta.mold = m.mold;
  if (m.nome !== undefined){ conta.nome = m.nome; aplicarNomeCamp(); }
  conta.sujo = true; salvarConta(); montarConta(); contaPerfilRapido();
}
function reduzirFoto(file){
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), l = Math.min(im.width, im.height);
      x.drawImage(im, (im.width - l) / 2, (im.height - l) / 2, l, l, 0, 0, 64, 64); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.72));
    };
    im.onerror = () => { URL.revokeObjectURL(url); no(new Error('img')); }; im.src = url;
  });
}

$('#hConta').onclick = abrirConta;
$('#cnEntrar').onclick = contaEntrar;
$('#cnSair').onclick = contaSair;
$('#cnApagar').onclick = contaApagar;
$('#cnSync').onclick = async () => { aviso('#cnAviso', ''); await contaSync({aplicar: true}); };
$('#cnNomeOk').onclick = () => {
  const n = limparNome($('#cnNome').value);
  if (!nomeValido(n)){ aviso('#cnAviso', 'Use de 2 a 20 letras ou números no nome.', 'erro'); return; }
  mudarPerfil({nome: n}); aviso('#cnAviso', 'Nome salvo.', 'ok');
};
$('#cnNome').onkeydown = e => { if (e.key === 'Enter') $('#cnNomeOk').click(); };
$('#cnFoto').onclick = () => $('#cnArq').click();
$('#cnArq').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try{ const d = await reduzirFoto(f); if (!ehFoto(d)) throw new Error('img'); conta.foto = d; conta.fotoSuja = true; mudarPerfil({av: 'foto'}); aviso('#cnAviso', 'Foto salva.', 'ok'); }
  catch(e){ aviso('#cnAviso', 'Não consegui usar essa imagem. Tente outra.', 'erro'); }
};

renderConta();
if (conta){
  setTimeout(() => { if (navigator.onLine !== false) contaSync({aplicar: $('#ov-splash').classList.contains('on')}); }, 2500);
}
if (store.get('contaredir')){
  store.set('contaredir', null);
  firebaseAuth().then(a => a.getRedirectResult()).then(r => { if (r && r.user){ abrirConta(); return contaPosLogin(r.user); } }).catch(() => {});
}
