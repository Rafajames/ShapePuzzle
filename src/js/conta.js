/* ======================= Conta (login opcional com o Google) e área do usuário =======================
   O jogo inteiro funciona sem conta. Com ela: apelido, avatar e moldura, estrelas para gastar e o progresso guardado
   na nuvem (juntando o que já existe no aparelho com o que está na nuvem — nunca se perde nada).
   O Firebase só é baixado quando a pessoa usa a conta. As regras do saldo ficam em logica-conta.js. */
const FB_VERSAO = '10.14.1';
const FB_SCRIPTS = ['firebase-app-compat.js', 'firebase-auth-compat.js'].map(f => `https://www.gstatic.com/firebasejs/${FB_VERSAO}/${f}`);
const FB_CONFIG = {apiKey: NUVEM_CHAVE, authDomain: 'shapepuzzle-76162.firebaseapp.com', projectId: 'shapepuzzle-76162'};
const COD_FECHOU = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'], COD_DOMINIO = 'auth/unauthorized-domain';
const COD_BLOQUEOU = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'];
const N_AVATARES = N_AV_P + N_AV_A, N_LIVRES = 6;
const MOLDURAS = Object.keys(ITENS).filter(k => k.startsWith('mold:')).map(k => k.slice(5));
const NOME_MOLDURA = {'': 'Sem moldura', madeira: 'Madeira', pixel: 'Pixel', festa: 'Festa', marmore: 'Mármore', metal: 'Metal', neon: 'Neon', cristal: 'Cristal', lava: 'Lava',
  galaxia: 'Galáxia', ouro: 'Ouro', gelo: 'Gelo', fogo: 'Fogo', arco: 'Arco-íris'};
const FUNDOS = Object.keys(ITENS).filter(k => k.startsWith('fun:')).map(k => k.slice(4));
const NOME_FUNDO = {'': 'Fundo padrão', listras: 'Listras', bolinhas: 'Bolinhas', xadrez: 'Xadrez', diagonal: 'Diagonal', ceu: 'Céu', estrelas: 'Noite estrelada', aurora: 'Aurora',
  oceano: 'Oceano', cosmos: 'Cosmos', dourado: 'Dourado'};
const NOME_CAT = {comum: 'Comum', raro: 'Raro', epico: 'Épico', lendario: 'Lendário'};
const nomeAvatar = id => tr((AVATARES[id] || {}).nome || id);
/* nome e texto de cada conquista (os números e os prêmios ficam em logica-conta.js) */
const NOME_CONQ = {fases5: 'Primeiros passos', fases10: 'Pegando o jeito', fases25: 'Mão na massa', fases50: 'Cinquentão', fases100: 'Centenário',
  estr30: 'Brilho inicial', estr100: 'Caçador de estrelas', estr300: 'Chuva de estrelas', seq3: 'Três dias seguidos', seq7: 'Semana perfeita', seq30: 'Mês de fogo',
  dia1: 'Desafio do dia', sem1: 'Desafio da semana', inf10: 'Sem fim'};
const DESC_CONQ = q => q.m === 'fases' ? tr('Conclua {n} fases', {n: q.n}) : q.m === 'estrelas' ? tr('Ganhe {n} estrelas nas fases', {n: q.n})
  : q.m === 'seq' ? tr('Jogue a fase do dia {n} dias seguidos', {n: q.n}) : q.m === 'dias' ? tr('Complete a fase do dia') : q.m === 'sem' ? tr('Complete o desafio da semana')
  : tr('Conclua {n} fases no modo infinito', {n: q.n});
let conta = store.get('conta', null);   // {uid, nome, av, mold, novo?, sujo?, ultima?, expirou?}
let fbAuth = null, contaOcupada = false, contaTimer = null;
/* Perfil deste aparelho: vale para quem joga sem conta (e serve de ponto de partida no primeiro login). */
let perfil = Object.assign({nome: '', av: 'p1', mold: '', fun: ''}, store.get('perfil', {}));
const eu = () => conta || {nome: perfil.nome || tr('Jogador'), av: avValido(perfil.av), mold: moldValida(perfil.mold), fun: fundoValido(perfil.fun)};
const guardarPerfil = () => store.set('perfil', perfil);

/* ---------- avatar ---------- */
const hashTxt = t => { let h = 2166136261; for (let i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const avPadrao = uid => 'p' + (1 + hashTxt(String(uid)) % N_LIVRES);
const avValido = id => ITENS['av:' + id] ? id : 'p1';
const moldValida = id => ITENS['mold:' + id] ? id : '';
const fundoValido = id => ITENS['fun:' + id] ? id : '';
/* visual que veio de outra pessoa (ranking, salas): só ids conhecidos */
const visualDe = x => ({av: avValido(x && x.av), mold: moldValida(x && x.mold), fun: fundoValido(x && x.fun)});
/* Monta o avatar de uma conta ({av, mold}) com a moldura, no tamanho `tam` (px). */
function avatarEl(c, tam){
  const fun = c && c.fun ? c.fun : '';
  const e = mk('span', 'av' + (c && c.mold ? ' m-' + c.mold : '') + (fun ? ' f-' + fun : ''));
  e.style.setProperty('--t', (tam || 40) + 'px');
  e.innerHTML = svgAvatar(c && c.av ? c.av : 'p1', !!fun);
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
  if (avisar){
    toast(r.novas.length === 1 ? tr('Conquista: {nome}! +{n} ★', {nome: tr(NOME_CONQ[r.novas[0].id]), n: r.estrelas}) : tr('{k} conquistas novas! +{n} ★', {k: r.novas.length, n: r.estrelas}));
  }
  renderConta();
}
/* Chamada a cada fase vencida. */
function aposVitoriaConta(){
  const w = $('#winBonus'); if (w){ w.hidden = true; w.textContent = ''; }
  if (S.cur && S.cur.k !== 'u' && !modoTeste){
    const r = bonusVitoria(dadosAtuais(), eu(), dataHoje());
    if (r.ganho){ guardarCart(r.cart); renderConta(); if (w){ w.textContent = tr('Bônus do visual: +{n} ★', {n: r.ganho}) + (r.teto ? ' · ' + tr('limite de hoje atingido') : ''); w.hidden = false; } }
  }
  verificarConquistas(true); contaAgendar();
}

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
  ligarLinksLegais();
  const c = eu(), s = saldoAtual(), b = $('#hConta');
  if (b){
    b.textContent = '';
    b.appendChild(avatarEl(c, 30)); b.appendChild(mk('span', 'cnN', c.nome)); b.appendChild(mk('small', '', '★ ' + s));
    b.setAttribute('aria-label', tr('Meu perfil') + ': ' + c.nome + ', ' + s + ' ' + tr('estrelas'));
  }
  const m = $('#btnPerfil');
  if (m){
    $('#mpAvatar').textContent = ''; $('#mpAvatar').appendChild(avatarEl(c, 44));
    $('#mpNome').textContent = c.nome;
    $('#mpSub').textContent = tr('Avatar, moldura, conquistas e estrelas');
    $('#mpTag').textContent = '★ ' + s;
    m.setAttribute('aria-label', tr('Meu perfil') + ': ' + c.nome + ', ' + s + ' ' + tr('estrelas'));
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
  b.appendChild(el); b.classList.add('cat-' + it.cat);
  const cat = tr(NOME_CAT[it.cat]) + (BONUS_CAT[it.cat] ? ' · +' + BONUS_CAT[it.cat] + ' ★' : '');
  b.title = rotulo + ' — ' + cat;
  if (!tem){
    const l = mk('small', 'cnPreco');
    if (it.preco) l.textContent = '★ ' + it.preco; else l.innerHTML = ic('lock');
    b.appendChild(l); b.classList.add('trava');
    b.setAttribute('aria-label', rotulo + ' — ' + cat + ' — ' + (it.preco ? tr('custa {n} estrelas', {n: it.preco}) : tr('prêmio de conquista')));
  } else b.setAttribute('aria-label', rotulo + ' — ' + cat);
  b.onclick = () => tocarItem(chave, rotulo);
  return b;
}
function donoDoItem(chave){ const q = CONQUISTAS.find(x => x.item === chave); return q ? tr(NOME_CONQ[q.id]) : ''; }
/* Tocar num item: se já é seu, usa na hora; se não, abre o provador (o avatar com o item, antes de comprar). */
function tocarItem(chave, rotulo){
  const d = dadosAtuais(), campo = chave.split(':')[0], id = chave.slice(campo.length + 1);
  if (itensDe(d).has(chave)){ mudarPerfil({[campo]: id}); return; }
  abrirProvador(chave, rotulo);
}
let Prova = null;
const visualDono = (c, donos) => ({av: donos.has('av:' + c.av) ? c.av : '', mold: donos.has('mold:' + c.mold) ? c.mold : '', fun: donos.has('fun:' + c.fun) ? c.fun : ''});
function abrirProvador(chave, rotulo){
  const d = dadosAtuais(), donos = itensDe(d), s = saldoConta(d), c = eu(), it = ITENS[chave];
  const campo = chave.split(':')[0], id = chave.slice(campo.length + 1);
  const agora = {av: c.av, mold: c.mold, fun: c.fun}, teste = Object.assign({}, agora, {[campo]: id});
  Prova = {chave, rotulo, campo, id};
  $('#pvAntes').textContent = ''; $('#pvAntes').appendChild(avatarEl(agora, 64));
  $('#pvDepois').textContent = ''; $('#pvDepois').appendChild(avatarEl(teste, 112));
  $('#pvNome').textContent = rotulo;
  const cat = $('#pvCat'); cat.className = 'pvCat cat-' + it.cat;
  cat.textContent = tr(NOME_CAT[it.cat]);
  const bAntes = bonusEquipado(visualDono(c, donos)), bDepois = bonusEquipado(Object.assign(visualDono(c, donos), {[campo]: id}));
  $('#pvBonus').textContent = bDepois ? tr('Com este visual: +{n} ★ a cada fase vencida.', {n: bDepois}) + (bAntes && bDepois > bAntes ? ' (' + tr('agora: +{n} ★', {n: bAntes}) + ')' : '') : tr('Item comum: não dá estrelas extras.');
  const btn = $('#pvComprar');
  if (it.preco){
    btn.hidden = false; btn.disabled = s < it.preco;
    btn.textContent = tr('Comprar por {n} ★', {n: it.preco});
    aviso('#pvInfo', s < it.preco ? tr('Faltam {n} ★ para este item. Jogue fases, a fase do dia e o desafio da semana para ganhar mais.', {n: it.preco - s}) : tr('Você tem {s} ★. Depois da compra sobram {r} ★.', {s, r: s - it.preco}), s < it.preco ? 'erro' : '');
  } else {
    btn.hidden = true;
    aviso('#pvInfo', tr('Este item é prêmio da conquista “{nome}”.', {nome: donoDoItem(chave)}));
  }
  abrir('provador');
}
const nomeItem = k => { const [t, id] = [k.split(':')[0], k.slice(k.indexOf(':') + 1)]; return t === 'av' ? nomeAvatar(id) : tr(t === 'mold' ? NOME_MOLDURA[id] : NOME_FUNDO[id]); };
const MSG_CUPOM = {invalido: 'Cupom não encontrado. Confira as letras e os números.', usado: 'Você já usou este cupom.', expirado: 'Este cupom já venceu.', cedo: 'Este cupom ainda não começou a valer.', vazio: 'Este cupom não tem prêmio para você.'};
let cupomOcupado = false;
async function usarCupom(){
  if (cupomOcupado) return;
  const cod = normalizarCupom($('#cnCupom').value), av = (m, t) => aviso('#cnCupomAviso', m, t);
  if (!cupomValido(cod)){ av('Digite o cupom (de 3 a 20 letras ou números).', 'erro'); return; }
  if (cart.g['c:' + cod] !== undefined){ av(MSG_CUPOM.usado, 'erro'); return; }
  cupomOcupado = true; $('#cnCupomOk').disabled = true; av('Conferindo o cupom…');
  try{
    const cupom = await nuvem(cpDb, 'GET', 'cupons/' + cod);
    const r = aplicarCupom(dadosAtuais(), cod, cupom, dataHoje());
    if (r.erro){ av(MSG_CUPOM[r.erro], 'erro'); return; }
    guardarCart(r.cart); contaAgendar(2000); renderConta(); montarConta(); $('#cnCupom').value = '';
    const partes = [];
    if (r.estrelas) partes.push('+' + r.estrelas + ' ★');
    if (r.itens.length) partes.push(r.itens.map(nomeItem).join(', '));
    av(tr('Cupom aplicado! Você ganhou: {p}.', {p: partes.join(' · ') || tr('nada novo (você já tinha os itens)')}), 'ok');
    toast(tr('Cupom aplicado!'));
  }catch(e){ av(msgNuvem(e), 'erro'); }
  finally{ cupomOcupado = false; $('#cnCupomOk').disabled = false; }
}
function comprarProvado(){
  if (!Prova) return;
  const r = comprarItem(dadosAtuais(), Prova.chave);
  if (!r.cart){ abrirProvador(Prova.chave, Prova.rotulo); return; }
  guardarCart(r.cart); mudarPerfil({[Prova.campo]: Prova.id}); contaAgendar(2000);
  fechar('provador'); Prova = null;
  aviso('#cnAviso', tr('Liberado! Sobraram {n} ★.', {n: saldoAtual()}), 'ok');
}
function montarConta(){
  const c = eu(), s = saldoAtual();
  $('#cnFora').hidden = !!conta; $('#cnSecNuvem').hidden = !conta;
  if (!conta) montarTermos();
  const t = $('#cnTeaser'); t.hidden = !!conta || s <= 0; t.textContent = !conta && s > 0 ? tr('Suas {n} ★ vão junto para a conta.', {n: s}) : '';
  const d = dadosAtuais(), donos = itensDe(d);
  $('#cnAvatar').textContent = ''; $('#cnAvatar').appendChild(avatarEl(c, 64));
  $('#cnNomeTxt').textContent = c.nome; $('#cnSaldo').textContent = s;
  if (document.activeElement !== $('#cnNome')) $('#cnNome').value = conta ? conta.nome : perfil.nome;
  $('#cnNome').placeholder = tr('Seu apelido');
  $('#cnBemvindo').hidden = !(conta && conta.novo);
  $('#cnNomeOk').textContent = tr(!conta ? 'Salvar' : conta.novo ? 'Confirmar apelido' : 'Trocar por {n} ★', {n: NOME_CUSTO});
  $('#cnNomeDica').textContent = !conta ? tr('Grátis neste aparelho. Ao entrar com o Google, ele vira o seu apelido público.')
    : conta.novo ? tr('Grátis agora. Depois, cada troca custa {n} ★.', {n: NOME_CUSTO}) : tr('Cada troca de apelido custa {n} ★.', {n: NOME_CUSTO});
  estadoConta(conta ? textoUltima() : 'Perfil deste aparelho');
  const ga = $('#cnAvatares'); ga.textContent = '';
  const ids = [...Array.from({length: N_AV_A}, (_, i) => 'a' + (i + 1)), ...Array.from({length: N_AV_P}, (_, i) => 'p' + (i + 1))];
  const grupo = t => { const g = mk('p'); g.className = 'cnGrupo'; g.textContent = t; ga.appendChild(g); };
  grupo(tr('Heróis estilo anime'));
  ids.forEach((id, k) => {
    if (k === N_AV_A) grupo(tr('Bichos e pessoas'));
    ga.appendChild(celulaItem('av:' + id, avatarEl({av: id, fun: c.fun}, 44), nomeAvatar(id), c.av === id, d, donos));
  });
  const gm = $('#cnMolduras'); gm.textContent = '';
  MOLDURAS.forEach(id => gm.appendChild(celulaItem('mold:' + id, avatarEl({av: c.av, mold: id, fun: c.fun}, 40), tr(NOME_MOLDURA[id]), c.mold === id, d, donos)));
  const gf = $('#cnFundos'); gf.textContent = '';
  FUNDOS.forEach(id => gf.appendChild(celulaItem('fun:' + id, avatarEl({av: c.av, fun: id}, 40), tr(NOME_FUNDO[id]), c.fun === id, d, donos)));
  const conta3 = p => [...donos].filter(k => k.startsWith(p)).length;
  $('#cnTitAv').textContent = tr('Avatares') + ' ' + conta3('av:') + '/' + N_AVATARES; $('#cnTitMold').textContent = tr('Molduras') + ' ' + conta3('mold:') + '/' + MOLDURAS.length;
  $('#cnTitFun').textContent = tr('Fundos') + ' ' + conta3('fun:') + '/' + FUNDOS.length;
  const bon = bonusEquipado({av: donos.has('av:' + c.av) ? c.av : '', mold: donos.has('mold:' + c.mold) ? c.mold : '', fun: donos.has('fun:' + c.fun) ? c.fun : ''});
  $('#cnBonus').textContent = bon ? tr('Seu visual dá +{n} ★ a cada fase vencida (até {m} ★ por dia).', {n: bon, m: BONUS_DIA_MAX}) : tr('Itens raros, épicos e lendários dão estrelas extras a cada fase vencida.');
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
  [['Estrelas das fases', o.fases], ['Fase do dia', o.dias], ['Desafio da semana', o.sem], ['Conquistas', o.conquistas], ['Bônus do visual', o.itens], ['Campeonato da semana', o.semana], ['Cupons', o.cupons], ['Outros ganhos', o.outros], ['Gastas', -o.gastas]]
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
    conta = Object.assign({uid: user.uid, nome: limparNome(pub.nome) || 'Jogador'}, visualDe(pub));
  } else {
    /* primeira vez: o apelido só vai para a nuvem depois que a pessoa o escolher (a primeira escolha é grátis) */
    let n = nomeValido(perfil.nome) ? perfil.nome : limparNome(String(user.displayName || '').split(' ')[0]); if (n.length < 2) n = 'Jogador';
    const temPerfil = !!store.get('perfil', null);
    conta = {uid: user.uid, nome: n, av: temPerfil ? avValido(perfil.av) : avPadrao(user.uid), mold: temPerfil ? moldValida(perfil.mold) : '', fun: temPerfil ? fundoValido(perfil.fun) : '', novo: true};
  }
  aplicarNomeCamp(); salvarConta(); montarConta(); aviso('#cnAviso', '');
  await contaSync({aplicar: true});
}
const guardarVisual = () => { if (conta){ perfil = {nome: conta.novo ? perfil.nome : conta.nome, av: conta.av, mold: conta.mold || '', fun: conta.fun || ''}; guardarPerfil(); } };
async function contaSair(){
  try{ const a = await Promise.race([firebaseAuth(), new Promise((_, no) => setTimeout(() => no(), 4000))]); await a.signOut(); }catch(e){}
  guardarVisual(); conta = null; store.set('conta', null); renderConta(); montarConta(); aviso('#cnAviso', 'Você saiu. O progresso continua neste aparelho.', 'ok');
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
  guardarVisual(); conta = null; store.set('conta', null); renderConta(); montarConta(); aviso('#cnAviso', 'Sua conta e seus dados foram apagados da nuvem.', 'ok');
}

/* ---------- sincronização ---------- */
const estavel = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, c) => (o[c] = x[c], o), {}) : x);
const semCfg = d => { const o = JSON.parse(JSON.stringify(d || {})); delete o.cfg; if (o.prog && o.prog.done) o.prog.done.sort((a, b) => a - b); return o; };
const fasesFeitas = d => Math.min(1000, d && d.prog ? d.prog.done.length : 0);
async function contaPublicar(tk, dados){
  if (conta.novo) return;   /* sem apelido escolhido ainda: nada público */
  await nv('PUT', 'pub/' + conta.uid, {nome: conta.nome, av: conta.av, mold: conta.mold || '', fun: conta.fun || '', n: fasesFeitas(dados), ts: Date.now()}, tk);
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
  if (!conta){
    for (const k of ['av', 'mold', 'fun', 'nome']) if (m[k] !== undefined) perfil[k] = m[k];
    if (m.nome !== undefined && !cpAuth){ cpNome = m.nome; store.set('cpnome', cpNome); }
    guardarPerfil(); renderConta(); montarConta(); return;
  }
  if (m.av !== undefined) conta.av = m.av;
  if (m.mold !== undefined) conta.mold = m.mold;
  if (m.fun !== undefined) conta.fun = m.fun;
  if (m.nome !== undefined){ conta.nome = m.nome; aplicarNomeCamp(); }
  conta.sujo = true; salvarConta(); montarConta(); contaPerfilRapido();
}
function trocarApelido(){
  const n = limparNome($('#cnNome').value);
  if (!nomeValido(n)){ aviso('#cnAviso', 'Use de 2 a 20 letras ou números no apelido.', 'erro'); return; }
  if (apelidoProibido(n)){ aviso('#cnAviso', 'Esse apelido não é permitido. Escolha outro.', 'erro'); return; }
  if (!conta){ mudarPerfil({nome: n}); aviso('#cnAviso', 'Apelido salvo neste aparelho.', 'ok'); return; }
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
$('#btnPerfil').onclick = () => { fechar('menu'); abrirConta(); };
$('#cnEntrar').onclick = contaEntrar;
$('#cnTermos').onchange = montarTermos;
$('#cnSair').onclick = contaSair;
$('#cnApagar').onclick = contaApagar;
$('#cnSync').onclick = async () => { aviso('#cnAviso', ''); await contaSync({aplicar: true}); };
$('#cnNomeOk').onclick = trocarApelido;
$('#pvComprar').onclick = comprarProvado;
$('#cnCupomOk').onclick = usarCupom;
$('#cnCupom').onkeydown = e => { if (e.key === 'Enter') usarCupom(); };
$('#pvVoltar').onclick = () => { fechar('provador'); Prova = null; };
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
