/* ======================= Conta (login opcional com o Google) e área do usuário =======================
   O jogo inteiro funciona sem conta. Com ela: apelido, avatar e moldura, estrelas para gastar e o progresso guardado
   na nuvem (juntando o que já existe no aparelho com o que está na nuvem — nunca se perde nada).
   O Firebase só é baixado quando a pessoa usa a conta. As regras do saldo ficam em logica-conta.js. */
const FB_VERSAO = '10.14.1';
const FB_SCRIPTS = ['firebase-app-compat.js', 'firebase-auth-compat.js'].map(f => `https://www.gstatic.com/firebasejs/${FB_VERSAO}/${f}`);
const FB_CONFIG = {apiKey: NUVEM_CHAVE, authDomain: 'shapepuzzle-76162.firebaseapp.com', projectId: 'shapepuzzle-76162'};
const COD_FECHOU = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'], COD_DOMINIO = 'auth/unauthorized-domain';
const COD_BLOQUEOU = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'];
const N_AVATARES = 24, N_LIVRES = 6;
const PALETA_AV = ['#e5484d', '#f76b15', '#d9960b', '#46a758', '#12a594', '#3e63dd', '#8e4ec6', '#d6409f', '#6c5340', '#0090ff', '#30a46c', '#ad7f58'];
const MOLDURAS = ['', 'madeira', 'pixel', 'festa', 'ouro', 'gelo', 'fogo', 'arco'];
const NOME_MOLDURA = {'': 'Sem moldura', madeira: 'Madeira', pixel: 'Pixel', festa: 'Festa', ouro: 'Ouro', gelo: 'Gelo', fogo: 'Fogo', arco: 'Arco-íris'};
/* nome e texto de cada conquista (os números e os prêmios ficam em logica-conta.js) */
const NOME_CONQ = {fases5: 'Primeiros passos', fases10: 'Pegando o jeito', fases25: 'Mão na massa', fases50: 'Cinquentão', fases100: 'Centenário',
  estr30: 'Brilho inicial', estr100: 'Caçador de estrelas', estr300: 'Chuva de estrelas', seq3: 'Três dias seguidos', seq7: 'Semana perfeita', seq30: 'Mês de fogo',
  dia1: 'Desafio do dia', sem1: 'Desafio da semana', inf10: 'Sem fim'};
const DESC_CONQ = q => q.m === 'fases' ? tr('Conclua {n} fases', {n: q.n}) : q.m === 'estrelas' ? tr('Ganhe {n} estrelas nas fases', {n: q.n})
  : q.m === 'seq' ? tr('Jogue a fase do dia {n} dias seguidos', {n: q.n}) : q.m === 'dias' ? tr('Complete a fase do dia') : q.m === 'sem' ? tr('Complete o desafio da semana')
  : tr('Conclua {n} fases no modo infinito', {n: q.n});
let conta = store.get('conta', null);   // {uid, nome, av, mold, novo?, sujo?, ultima?, expirou?}
let fbAuth = null, contaOcupada = false, contaTimer = null;

/* ---------- avatar ---------- */
const hashTxt = t => { let h = 2166136261; for (let i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const avPadrao = uid => 'p' + (1 + hashTxt(String(uid)) % N_LIVRES);
const avValido = id => /^p\d{1,2}$/.test(id) && +id.slice(1) >= 1 && +id.slice(1) <= N_AVATARES ? id : 'p1';
const moldValida = id => MOLDURAS.includes(id) ? id : '';
function svgAvatar(id){
  const n = +String(id).slice(1) || 1;
  let h = (Math.imul(n, 2654435761) >>> 0) || 1;
  const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h; };
  for (let i = 0; i < 6; i++) rnd();
  const cor = PALETA_AV[(n - 1) % PALETA_AV.length], fundo = n > 12 ? '#2b2540' : '#fff6dc';
  let r = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++){
    if ((rnd() % 100) < (y === 0 || y === 7 ? 35 : 58)) r += `<rect x="${x}" y="${y}" width="1" height="1"/><rect x="${7 - x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><rect width="8" height="8" fill="${fundo}"/><g fill="${cor}">${r}</g></svg>`;
}
/* Monta o avatar de uma conta ({av, mold}) com a moldura, no tamanho `tam` (px). */
function avatarEl(c, tam){
  const e = mk('span', 'av' + (c && c.mold ? ' m-' + c.mold : ''));
  e.style.setProperty('--t', (tam || 40) + 'px');
  e.innerHTML = svgAvatar(c && c.av ? c.av : 'p1');
  return e;
}

/* ---------- estrelas e conquistas ---------- */
const saldoAtual = () => saldoConta(dadosAtuais());
function guardarCart(c){ cart = c; store.set('cart', cart); }
/* Resgata as conquistas que já foram cumpridas; avisa só quem está com conta (sem conta, elas ficam guardadas para o primeiro login). */
function verificarConquistas(avisar){
  const r = resgatarConquistas(dadosAtuais(), dataHoje());
  if (!r.novas.length) return;
  guardarCart(r.cart);
  if (avisar && conta){
    toast(r.novas.length === 1 ? tr('Conquista: {nome}! +{n} ★', {nome: tr(NOME_CONQ[r.novas[0].id]), n: r.estrelas}) : tr('{k} conquistas novas! +{n} ★', {k: r.novas.length, n: r.estrelas}));
  }
  renderConta();
}
/* Chamada a cada fase vencida. */
function aposVitoriaConta(){ verificarConquistas(true); contaAgendar(); }

/* ---------- páginas públicas (privacidade, termos, excluir conta) ---------- */
const urlLegal = nome => nome + '.html?l=' + lang;
function ligarLinksLegais(){ document.querySelectorAll('[data-lk]').forEach(a => { a.href = urlLegal(a.dataset.lk); }); }
function montarTermos(){
  const aceito = store.get('termos', 0) === 1;
  $('#cnTermosL').hidden = aceito;
  if (!aceito) $('#cnTermosT').innerHTML = tr('Li e aceito os {t} e a {p}.', {t: `<a href="${urlLegal('termos')}" target="_blank" rel="noopener">${tr('Termos de Uso')}</a>`, p: `<a href="${urlLegal('privacidade')}" target="_blank" rel="noopener">${tr('Política de Privacidade')}</a>`});
  $('#cnEntrar').disabled = !aceito && !$('#cnTermos').checked;
}

/* ---------- tela inicial e área do usuário ---------- */
function renderConta(){
  const b = $('#hConta'); if (!b) return;
  ligarLinksLegais();
  b.textContent = '';
  const s = saldoAtual();
  if (!conta){
    b.innerHTML = ic('user'); b.appendChild(mk('span', '', tr('Entrar com Google'))); b.appendChild(mk('small', '', s > 0 ? '★ ' + s : tr('opcional')));
    b.setAttribute('aria-label', tr('Entrar com Google'));
  } else {
    b.appendChild(avatarEl(conta, 30));
    const nm = mk('span', 'cnN', conta.nome); b.appendChild(nm);
    b.appendChild(mk('small', '', '★ ' + s)); b.setAttribute('aria-label', tr('Meu perfil') + ': ' + conta.nome + ', ' + s + ' ' + tr('estrelas'));
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
/* uma casinha de avatar ou moldura: marcada, comprável (com preço) ou só por conquista (cadeado) */
function celulaItem(chave, el, rotulo, marcado, d, donos){
  const it = ITENS[chave], tem = donos.has(chave);
  const b = mk('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', marcado ? 'true' : 'false'); b.dataset.item = chave;
  b.appendChild(el);
  if (!tem){
    const l = mk('small', 'cnPreco');
    if (it.preco) l.textContent = '★ ' + it.preco; else l.innerHTML = ic('lock');
    b.appendChild(l); b.classList.add('trava');
    b.setAttribute('aria-label', rotulo + ' — ' + (it.preco ? tr('custa {n} estrelas', {n: it.preco}) : tr('prêmio de conquista')));
  } else b.setAttribute('aria-label', rotulo);
  b.onclick = () => tocarItem(chave, rotulo);
  return b;
}
function donoDoItem(chave){ const q = CONQUISTAS.find(x => x.item === chave); return q ? tr(NOME_CONQ[q.id]) : ''; }
function tocarItem(chave, rotulo){
  const d = dadosAtuais(), campo = chave.startsWith('av:') ? 'av' : 'mold', id = chave.slice(campo === 'av' ? 3 : 5);
  if (itensDe(d).has(chave)){ mudarPerfil({[campo]: id}); return; }
  const it = ITENS[chave];
  if (!it.preco){ aviso('#cnAviso', tr('Este item é prêmio da conquista “{nome}”.', {nome: donoDoItem(chave)})); return; }
  const r = comprarItem(d, chave);
  if (r.erro === 'saldo'){ aviso('#cnAviso', tr('Faltam {n} ★ para este item. Jogue fases, a fase do dia e o desafio da semana para ganhar mais.', {n: r.falta}), 'erro'); return; }
  if (!r.cart) return;
  if (!confirm(tr('Liberar “{nome}” por {n} ★? Você tem {s} ★.', {nome: rotulo, n: it.preco, s: saldoConta(d)}))) return;
  guardarCart(r.cart); mudarPerfil({[campo]: id}); contaAgendar(2000);
  aviso('#cnAviso', tr('Liberado! Sobraram {n} ★.', {n: saldoAtual()}), 'ok');
}
function montarConta(){
  $('#cnFora').hidden = !!conta; $('#cnDentro').hidden = !conta;
  const s = saldoAtual();
  if (!conta){
    montarTermos();
    const t = $('#cnTeaser'); t.hidden = s <= 0; t.textContent = s > 0 ? tr('Você já tem {n} ★ esperando por você.', {n: s}) : ''; return;
  }
  const d = dadosAtuais(), donos = itensDe(d);
  $('#cnAvatar').textContent = ''; $('#cnAvatar').appendChild(avatarEl(conta, 64));
  $('#cnNomeTxt').textContent = conta.nome; $('#cnSaldo').textContent = s;
  if (document.activeElement !== $('#cnNome')) $('#cnNome').value = conta.nome;
  $('#cnBemvindo').hidden = !conta.novo;
  $('#cnNomeOk').textContent = tr(conta.novo ? 'Confirmar apelido' : 'Trocar por {n} ★', {n: NOME_CUSTO});
  $('#cnNomeDica').textContent = conta.novo ? tr('Grátis agora. Depois, cada troca custa {n} ★.', {n: NOME_CUSTO}) : tr('Cada troca de apelido custa {n} ★.', {n: NOME_CUSTO});
  estadoConta(textoUltima());
  const ga = $('#cnAvatares'); ga.textContent = '';
  for (let i = 1; i <= N_AVATARES; i++){ const id = 'p' + i; ga.appendChild(celulaItem('av:' + id, avatarEl({av: id}, 44), tr('Avatar {n}', {n: i}), conta.av === id, d, donos)); }
  const gm = $('#cnMolduras'); gm.textContent = '';
  MOLDURAS.forEach(id => gm.appendChild(celulaItem('mold:' + id, avatarEl({av: conta.av, mold: id}, 40), tr(NOME_MOLDURA[id]), conta.mold === id, d, donos)));
  const nAv = [...donos].filter(k => k.startsWith('av:')).length, nMo = [...donos].filter(k => k.startsWith('mold:')).length;
  $('#cnTitAv').textContent = tr('Avatares') + ' ' + nAv + '/' + N_AVATARES; $('#cnTitMold').textContent = tr('Molduras') + ' ' + nMo + '/' + MOLDURAS.length;
  const med = medidasConta(d, dataHoje()), lc = $('#cnConq'); lc.textContent = '';
  const feitas = cart.v.length;
  $('#cnTitConq').textContent = tr('Conquistas') + ' ' + feitas + '/' + CONQUISTAS.length;
  CONQUISTAS.forEach(q => {
    const ok = cart.v.includes(q.id), v = Math.min(q.n, med[q.m]);
    const li = mk('li', ok ? 'ok' : '');
    const topo = mk('div', 'cnQt'), premio = mk('span', 'cnQp');
    topo.appendChild(mk('b', '', (ok ? '✓ ' : '') + tr(NOME_CONQ[q.id])));
    premio.textContent = '+' + q.est + ' ★' + (q.item ? ' · ' + tr(q.item.startsWith('av:') ? 'avatar' : 'moldura') : '');
    topo.appendChild(premio);
    li.appendChild(topo); li.appendChild(mk('small', '', DESC_CONQ(q)));
    const barra = mk('div', 'cnBarra'); const i = mk('i'); i.style.width = Math.round(100 * v / q.n) + '%'; barra.appendChild(i); li.appendChild(barra);
    li.appendChild(mk('small', 'cnQv', v + '/' + q.n)); lc.appendChild(li);
  });
  const o = origemEstrelas(d), lo = $('#cnOrigem'); lo.textContent = '';
  [['Estrelas das fases', o.fases], ['Fase do dia', o.dias], ['Desafio da semana', o.sem], ['Conquistas', o.conquistas], ['Outros ganhos', o.outros], ['Gastas', -o.gastas]]
    .forEach(([n, v]) => { if (v || n === 'Estrelas das fases'){ const li = mk('li'); li.appendChild(mk('span', '', tr(n))); li.appendChild(mk('b', '', (v > 0 && n !== 'Estrelas das fases' ? '+' : '') + v + ' ★')); lo.appendChild(li); } });
}
function abrirConta(){ aviso('#cnAviso', ''); verificarConquistas(false); montarConta(); abrir('conta'); }

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
async function contaUsuario(){
  const a = await firebaseAuth(), u = a.currentUser || await usuarioPronto(a);
  return !u || (conta && u.uid !== conta.uid) ? null : u;
}
async function contaToken(){ const u = await contaUsuario(); return u ? u.getIdToken() : null; }
const nv = (m, caminho, corpo, tk) => nuvem(cpDb, m, caminho, corpo, tk);
const aplicarNomeCamp = () => { if (conta && !cpAuth){ cpNome = conta.nome; store.set('cpnome', cpNome); } };
const salvarConta = () => { store.set('conta', conta); renderConta(); };

/* ---------- entrar / sair / apagar ---------- */
async function contaEntrar(){
  if (store.get('termos', 0) !== 1){ if (!$('#cnTermos').checked){ aviso('#cnAviso', 'Marque que você leu e aceita os termos para entrar.', 'erro'); return; } store.set('termos', 1); }
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
  } else {
    /* primeira vez: o apelido só vai para a nuvem depois que a pessoa o escolher (a primeira escolha é grátis) */
    let n = limparNome(String(user.displayName || '').split(' ')[0]); if (n.length < 2) n = 'Jogador';
    conta = {uid: user.uid, nome: n, av: avPadrao(user.uid), mold: '', novo: true};
  }
  aplicarNomeCamp(); salvarConta(); montarConta(); aviso('#cnAviso', '');
  await contaSync({aplicar: true});
}
async function contaSair(){
  try{ const a = await Promise.race([firebaseAuth(), new Promise((_, no) => setTimeout(() => no(), 4000))]); await a.signOut(); }catch(e){}
  conta = null; store.set('conta', null); renderConta(); montarConta(); aviso('#cnAviso', 'Você saiu. O progresso continua neste aparelho.', 'ok');
}
/* Apaga tudo da nuvem e a própria conta. Pede para confirmar com o Google antes (o Firebase exige um login recente para isso). */
async function contaApagar(){
  if (!conta || !confirm(tr('Apagar sua conta e os dados guardados na nuvem? O progresso e as estrelas deste aparelho continuam.'))) return;
  try{
    const u = await contaUsuario(); if (!u) throw new Error('sessao');
    try{ await u.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider()); }
    catch(e){ aviso('#cnAviso', COD_FECHOU.includes(e && e.code) ? 'Cancelado. Nada foi apagado.' : 'Não consegui confirmar com o Google. Nada foi apagado.', 'erro'); return; }
    const tk = await u.getIdToken();
    for (const c of ['pub', 'priv']) await nv('DELETE', c + '/' + conta.uid, undefined, tk);
    await u.delete();
  }catch(e){ aviso('#cnAviso', 'Não consegui apagar agora. Confira a internet e tente de novo.', 'erro'); return; }
  conta = null; store.set('conta', null); renderConta(); montarConta(); aviso('#cnAviso', 'Sua conta e seus dados foram apagados da nuvem.', 'ok');
}

/* ---------- sincronização ---------- */
const estavel = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, c) => (o[c] = x[c], o), {}) : x);
const semCfg = d => { const o = JSON.parse(JSON.stringify(d || {})); delete o.cfg; if (o.prog && o.prog.done) o.prog.done.sort((a, b) => a - b); return o; };
const fasesFeitas = d => Math.min(1000, d && d.prog ? d.prog.done.length : 0);
async function contaPublicar(tk, dados){
  if (conta.novo) return;   /* sem apelido escolhido ainda: nada público */
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
/* Sincroniza em segundo plano, com folga para não gastar rede à toa (30 s depois de uma fase; 2 s depois de gastar estrelas). */
function contaAgendar(ms){ if (!conta) return; clearTimeout(contaTimer); contaTimer = setTimeout(() => contaSync({aplicar: false}), ms || 30000); }
/* Envia só o perfil (apelido, avatar, moldura) depois de uma edição. */
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
function trocarApelido(){
  const n = limparNome($('#cnNome').value);
  if (!nomeValido(n)){ aviso('#cnAviso', 'Use de 2 a 20 letras ou números no apelido.', 'erro'); return; }
  if (apelidoProibido(n)){ aviso('#cnAviso', 'Esse apelido não é permitido. Escolha outro.', 'erro'); return; }
  if (conta.novo){
    conta.novo = false; mudarPerfil({nome: n}); aviso('#cnAviso', 'Apelido salvo. Bom jogo!', 'ok'); contaAgendar(1500); return;
  }
  if (n === conta.nome){ aviso('#cnAviso', 'Esse já é o seu apelido.'); return; }
  const d = dadosAtuais(), r = pagarApelido(d);
  if (r.erro){ aviso('#cnAviso', tr('Faltam {n} ★ para trocar o apelido. Jogue fases, a fase do dia e o desafio da semana para ganhar mais.', {n: r.falta}), 'erro'); return; }
  if (!confirm(tr('Trocar o apelido custa {n} ★ (você tem {s} ★). Trocar?', {n: NOME_CUSTO, s: saldoConta(d)}))) return;
  guardarCart(r.cart); mudarPerfil({nome: n}); contaAgendar(2000); aviso('#cnAviso', tr('Apelido trocado! Sobraram {n} ★.', {n: saldoAtual()}), 'ok');
}

$('#hConta').onclick = abrirConta;
$('#cnEntrar').onclick = contaEntrar;
$('#cnTermos').onchange = montarTermos;
$('#cnSair').onclick = contaSair;
$('#cnApagar').onclick = contaApagar;
$('#cnSync').onclick = async () => { aviso('#cnAviso', ''); await contaSync({aplicar: true}); };
$('#cnNomeOk').onclick = trocarApelido;
$('#cnNome').onkeydown = e => { if (e.key === 'Enter') $('#cnNomeOk').click(); };

verificarConquistas(false);
renderConta();
if (conta){
  setTimeout(() => { if (navigator.onLine !== false) contaSync({aplicar: $('#ov-splash').classList.contains('on')}); }, 2500);
}
if (store.get('contaredir')){
  store.set('contaredir', null);
  firebaseAuth().then(a => a.getRedirectResult()).then(r => { if (r && r.user){ abrirConta(); return contaPosLogin(r.user); } }).catch(() => {});
}
