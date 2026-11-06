/* ======================= Ranking geral e campeonato da semana =======================
   Ranking geral: quem concluiu mais fases (lido do perfil público de cada conta Google).
   Campeonato da semana: salas de até 100 pessoas, as mesmas 5 fases novas para todo mundo da sala, uma sala nova por semana.
   Só o necessário é público: apelido, avatar, moldura e quantas fases a pessoa concluiu. */
const RK_TOP = 100, RK_BUSCA = 200;
const semanaAgora = () => semanaDe(new Date().toISOString().slice(0, 10));   /* semana em UTC, igual ao fim da sala */
const idSala = (sem, n) => idGeral(semanaIdx(segundaDe(sem)), n);
const contaPronta = () => !!conta && !conta.novo;
let rkPos = store.get('rkpos', null);       /* {ts, geral: {pos, n, de}, sala: {sem, id, pos, de, feitas}} */
let rkOcupado = false, rkAvisado = false;
const guardarPos = () => store.set('rkpos', rkPos);

/* ---------- sala da semana ---------- */
const NIVEIS_GERAL = ['facil', 'medio', 'medio', 'dificil', 'dificil'];
async function gerarFasesGeral(){
  const fases = [];
  for (const nivel of NIVEIS_GERAL){
    let f = null;
    for (let t = 0; t < 6 && !f; t++){
      const g = await Gerador.gerar(novaSeed(), NIVEIS_INF[nivel].o);
      if (g && g.unica && !BUILTIN.some(b => b.text === g.text) && !fases.some(x => x.text === g.text)) f = {nome: NOME_SORTEADA[nivel], text: g.text};
    }
    if (!f) return null;
    fases.push(f);
  }
  return fases;
}
async function criarSalaGeral(sem, sala, id, tk){
  const fases = await gerarFasesGeral(); if (!fases) throw erroNuvem('gerar');
  const camp = {nome: 'Campeonato da semana', org: 'Shape Puzzle', max: MAX_SALA_GERAL, modo: 'melhor', fim: fimDaSemana(sem), criado: Date.now(), uid: conta.uid, fases, geral: true, sem, sala};
  try{ await nuvem(cpDb, 'PUT', 'c/' + id, camp, tk); }
  catch(e){ if (!e || e.cod !== 'negado') throw e; }       /* outra pessoa criou a mesma sala no mesmo instante: vale a dela */
  const c = await nuvem(cpDb, 'GET', 'c/' + id);
  if (!c) throw erroNuvem('negado');
  return c;
}
/* a sala é confiável se tem as fases certas e termina no fim desta semana */
const salaDaSemana = (c, sem) => salaGeralValida(c) && c.sem === sem && c.fim === fimDaSemana(sem);
/* Acha a sua sala (ou entra na primeira com vaga, criando-a se preciso) e abre a classificação dela. */
async function entrarGeral(sel){
  if (rkOcupado) return;
  const av = (m, t) => aviso(sel, m, t);
  if (!contaPronta()){ av('Entre com a conta Google e escolha o seu apelido para disputar o campeonato da semana.', 'erro'); fechar('camps'); fechar('rank'); abrirConta(); return; }
  if (navigator.onLine === false){ av('Sem conexão com a internet. Confira e tente de novo.', 'erro'); return; }
  rkOcupado = true; document.querySelectorAll('[data-semana]').forEach(b => { b.disabled = true; });
  av('Procurando a sua sala…');
  try{
    const tk = await contaToken(); if (!tk) throw erroNuvem('sessao');
    const sem = semanaAgora(), chave = chaveGeral(conta.uid);
    let livre = null, minha = null;
    for (let s = 1; s <= SALAS_GERAL && !minha && !livre; s++){
      const id = idSala(sem, s);
      let c = await nuvem(cpDb, 'GET', 'c/' + id);
      if (!c){ av('Preparando as fases da semana…'); c = await criarSalaGeral(sem, s, id, tk); }
      if (!salaDaSemana(c, sem)) continue;
      if (await nuvem(cpDb, 'GET', `p/${id}/${chave}`)){ minha = id; break; }
      const quem = await nuvem(cpDb, 'GET', 'p/' + id, undefined, undefined, 'shallow=true') || {};
      if (Object.keys(quem).length < MAX_SALA_GERAL) livre = id;
    }
    if (!minha){
      if (!livre) throw erroNuvem('cheio');
      await nuvem(cpDb, 'PUT', `p/${livre}/${chave}`, {n: conta.nome, ts: Date.now(), av: conta.av, mold: conta.mold || ''}, tk);
      minha = livre;
    }
    av('');
    fechar('camps'); fechar('rank'); await abrirLobby(minha, cpDb);
  }catch(e){ av(msgNuvem(e), 'erro'); }
  rkOcupado = false; document.querySelectorAll('[data-semana]').forEach(b => { b.disabled = false; });
}

/* ---------- ranking geral ---------- */
async function buscarRanking(){
  const r = await nuvem(cpDb, 'GET', 'pub', undefined, undefined, 'orderBy=%22n%22&limitToLast=' + RK_BUSCA) || {};
  const lista = Object.keys(r).map(uid => { const x = r[uid] || {}; return {uid, n: +x.n || 0, ts: +x.ts || 0, nome: limparNome(String(x.nome || '')), av: x.av, mold: x.mold}; })
    .filter(x => x.nome && x.n > 0);
  return posicaoRanking(lista, conta ? conta.uid : '', RK_BUSCA);
}
function linhaRanking(r, euUid){
  const d = mk('div', 'rk' + (r.uid === euUid ? ' eu' : ''));
  d.append(mk('span', 'pos', r.pos <= 3 ? ['🥇', '🥈', '🥉'][r.pos - 1] : tr(r.pos + 'º')));
  d.appendChild(avatarEl({av: avValido(r.av), mold: moldValida(r.mold)}, 24));
  d.append(mk('span', 'nm', r.nome), mk('span', 'tm', qtd(r.n, ' fase', ' fases')));
  return d;
}
function renderRanking(res){
  const l = $('#rkLista'); l.innerHTML = '';
  const euUid = conta ? conta.uid : '';
  if (!res.lista.length) l.innerHTML = '<p class="vazio2">' + tr('Ninguém no ranking ainda. Entre com o Google e conclua fases para aparecer aqui.') + '</p>';
  res.lista.slice(0, RK_TOP).forEach(r => l.appendChild(linhaRanking(r, euUid)));
  const i = res.eu ? res.lista.indexOf(res.eu) : -1;
  if (i >= RK_TOP){ l.appendChild(mk('div', 'rkSep', '…')); l.appendChild(linhaRanking(res.eu, euUid)); }
  let msg = '';
  if (!conta) msg = 'Entre com o Google para aparecer no ranking.';
  else if (conta.novo) msg = 'Escolha o seu apelido na tela Sua conta para aparecer no ranking.';
  else if (!res.eu) msg = res.corte && fasesFeitas(dadosAtuais()) > 0 ? tr('Você ainda não está no top {n}. Conclua mais de {c} fases para entrar.', {n: RK_BUSCA, c: res.corte})
    : fasesFeitas(dadosAtuais()) > 0 ? 'Sua posição aparece depois da próxima sincronização.' : 'Conclua uma fase para entrar no ranking.';
  aviso('#rkAviso', msg);
}
async function carregarRanking(){
  aviso('#rkAviso', 'Carregando…'); $('#rkAtualizar').disabled = true;
  try{ const res = await buscarRanking(); renderRanking(res); guardarGeral(res); }
  catch(e){ aviso('#rkAviso', msgNuvem(e), 'erro'); }
  $('#rkAtualizar').disabled = false;
}
function abrirRanking(){
  $('#rkSub').textContent = tr('Quem concluiu mais fases. Só aparece quem entrou com a conta Google.');
  $('#rkLista').innerHTML = ''; abrir('rank'); carregarRanking();
}

/* ---------- posição guardada (mostrada na tela inicial) ---------- */
function guardarGeral(res){
  if (!contaPronta()) return;
  rkPos = Object.assign({}, rkPos, {ts: Date.now(), geral: res.eu ? {pos: res.eu.pos, n: res.eu.n, de: res.lista.length} : null}); guardarPos(); renderPosicao();
}
function guardarPosicaoSala(c, rk, key){
  const r = rk.find(x => x.key === key); if (!r || !c.sem) return;
  rkPos = Object.assign({}, rkPos, {sala: {sem: c.sem, id: CP.id, pos: r.pos, de: rk.length, feitas: r.feitas}}); guardarPos(); renderPosicao();
}
/* terminou as 5 fases da semana: ganha estrelas (uma vez por sala) */
function conferirBonusSala(c, eu){
  if (!eu || !eu.f) return;
  let feitas = 0; for (let i = 0; i < FASES_GERAL; i++) if (eu.f[i] && eu.f[i].t > 0) feitas++;
  const k = 'w:' + CP.id;
  if (feitas < FASES_GERAL || (cart.g || {})[k]) return;
  const nc = cartDe({cart}); nc.g[k] = BONUS_CAMP_SEMANA;
  guardarCart(nc); contaAgendar(2000); renderConta();
  toast(tr('Campeonato da semana completo! +{n} ★', {n: BONUS_CAMP_SEMANA}));
}
const salaAtual = () => rkPos && rkPos.sala && rkPos.sala.sem === semanaAgora() ? rkPos.sala : null;
function textoPosicao(){
  const g = rkPos && rkPos.geral, s = salaAtual();
  if (g && s) return tr('Você está em {a}º no ranking geral e em {b}º de {c} no campeonato da semana.', {a: g.pos, b: s.pos, c: s.de});
  if (g) return tr('Você está em {a}º no ranking geral. Entre no campeonato da semana!', {a: g.pos});
  if (s) return tr('Você está em {b}º de {c} no campeonato da semana.', {b: s.pos, c: s.de});
  return '';
}
function renderPosicao(){
  const b = $('#hPos'); if (!b) return;
  b.textContent = '';
  const g = contaPronta() && rkPos && rkPos.geral, s = contaPronta() && salaAtual();
  b.insertAdjacentHTML('afterbegin', ic('trophy'));
  const t = mk('span', 'cnN');
  if (g || s){
    t.textContent = tr('Ranking geral') + ': ' + (g ? g.pos + 'º' : '—') + (s ? ' · ' + tr('Semana') + ': ' + s.pos + 'º/' + s.de : '');
    b.setAttribute('aria-label', textoPosicao());
  } else { t.textContent = tr('Ranking geral'); b.setAttribute('aria-label', tr('Ranking geral')); }
  b.appendChild(t); b.appendChild(mk('small', '', tr(g || s ? 'ver' : 'abrir')));
}
/* Ao abrir o jogo: atualiza a posição e avisa onde a pessoa está. */
async function atualizarPosicao(avisar){
  if (!contaPronta() || navigator.onLine === false) return;
  let geral = null, sala = salaAtual();
  try{
    const res = await buscarRanking();
    if (res.eu) geral = {pos: res.eu.pos, n: res.eu.n, de: res.lista.length};
    if (sala){
      const jogs = await nuvem(cpDb, 'GET', 'p/' + sala.id) || {}, rk = rankear({fases: new Array(FASES_GERAL)}, jogs), eu = rk.find(x => x.key === chaveGeral(conta.uid));
      sala = eu ? {sem: sala.sem, id: sala.id, pos: eu.pos, de: rk.length, feitas: eu.feitas} : null;
    }
  }catch(e){ return; }
  rkPos = {ts: Date.now(), geral, sala}; guardarPos(); renderPosicao();
  const t = textoPosicao(); if (avisar && t) toast(t);
}

$('#hPos').onclick = abrirRanking;
$('#rkAtualizar').onclick = carregarRanking;
$('#cpRank').onclick = () => { fechar('camps'); abrirRanking(); };
$('#cpSemana').onclick = () => entrarGeral('#cpAviso');
$('#rkSemana').onclick = () => entrarGeral('#rkAviso');
renderPosicao();
if (contaPronta()) setTimeout(() => { if (!rkAvisado){ rkAvisado = true; atualizarPosicao(true); } }, 3500);
