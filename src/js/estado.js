/* ======================= Estado do jogo ======================= */
let custom = store.get('custom', []);
let prog = store.get('prog', {max: 0, done: []});
let Est = Object.assign({tempo: 0, vitorias: 0, jogadas: 0, dicas: 0, solucoes: 0, desde: 0}, store.get('stats', {}));
if (!Est.desde) Est.desde = Date.now();
let estSujo = true, restaurando = false;
function salvarEst(){ if (restaurando) return; store.set('stats', Est); estSujo = false; }
setInterval(() => { if (estSujo) salvarEst(); }, 15000);
document.addEventListener('visibilitychange', () => { if (document.hidden) salvarEst(); });
addEventListener('pagehide', salvarEst);
let inf = store.get('inf', null); if (!inf || typeof inf !== 'object') inf = {feitas: {}, porNivel: {}}; inf.feitas = inf.feitas || {}; inf.porNivel = inf.porNivel || {};
let recs = store.get('rec', {});
let dias = store.get('dias', {});
let humorPref = store.get('humor', 'auto');
/* nº de peças por vez escolhido pelo jogador: 'auto' (por dificuldade), 2..6 ou 99 (todas) */
let vibraOn = store.get('vibra', true) !== false;
const vibrar = p => { if (vibraOn && navigator.vibrate) try{ navigator.vibrate(p); }catch(e){} };
let estrelasFase = store.get('est', {});
/* 3 estrelas: sem dica e sem recolocar peças; 2: sem dica e até 50% de jogadas a mais; 1: concluiu */
function estrelasDe(j, total, dicas){ return dicas ? 1 : j <= total ? 3 : j <= Math.ceil(total * 1.5) ? 2 : 1; }
let pecasPref = store.get('pecas', 'auto');
if (pecasPref !== 'auto' && ![2, 3, 4, 5, 6, 99].includes(pecasPref)) pecasPref = 'auto';
const filaPadraoDe = cur => cur.k === 'x' ? FILA_PADRAO : pecasPref !== 'auto' ? pecasPref : cur.k === 'b' ? filaDaFase(cur.i) : cur.k === 'i' ? (NIVEIS_INF[cur.nivel].fila || FILA_PADRAO) : FILA_PADRAO;
function aplicarPecas(){
  const j = S.jogo; if (!j || j.filaFixa || S.cur.k === 'x') return;
  const f = filaPadraoDe(S.cur);
  j.filaAuto = j.total > f; j.fila = j.filaAuto ? f : 0;
  if (S.sel && !visiveis(j).includes(S.sel)) S.sel = null;
  S.ultFila = j.fila; limparGhost(); renderTudo(); ajustar(); atualizarTuto();
}
{ const md = prog.done.length ? Math.max(...prog.done) : -1; prog.max = Math.max(prog.max, Math.min(md + 1, BUILTIN.length - 1)); }
/* Modo de teste: libera todas as fases. A senha NÃO fica no código, só o "carimbo" (SHA-256) dela. Não é segurança forte: só impede que o botão seja usado por acaso. */
const TESTE_HASH = '59fe1f06564d1d56f8d7477fede7e4e2e7683a8a37aea5f1027c91816975c7e6';
let modoTeste = store.get('teste', false) === true;
async function hashSenha(t){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('shapepuzzle-teste:' + t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
const S = {cur: null, jogo: null, sel: null, drag: null, hover: null, ghost: [], venceu: false, cell: 64,
  n: TAM, ultFila: 0, jog: 0, dicas: 0, t: {acum: 0, ult: 0, ativo: false}, dicaCels: [], dicaTimer: 0, ultimaIdu: 0, hist: [], dicaNivel: 0, dicaSig: '', dicaConta: '', dicaPeca: 0, sol: null, solVista: false};

const cacheDia = {};
function faseDoDia(data){
  if (!cacheDia[data]){
    const f = gerarFase(parseInt(data.replace(/-/g, ''), 10), {minEstrelas: 7});
    cacheDia[data] = {nome: 'dia ' + data, text: f.text};
  }
  return cacheDia[data];
}
function faseDe(cur){
  if (cur.k === 'b') return BUILTIN[cur.i];
  if (cur.k === 'c') return custom[cur.i];
  if (cur.k === 'd') return faseDoDia(cur.data);
  return cur;
}
function chaveFase(cur){
  if (cur.k === 'b') return 'b:' + BUILTIN[cur.i].nome;
  if (cur.k === 'c') return 'c:' + custom[cur.i].nome;
  if (cur.k === 'd') return 'd:' + cur.data;
  return null;
}
function humorDaFase(cur){
  if (cur.k === 'i') return {facil: 'calma', medio: 'animada', dificil: 'noturna', mestre: 'noturna'}[cur.nivel] || 'calma';
  if (cur.k === 'b') return ['calma', 'animada', 'noturna'][Math.floor(cur.i / 10) % 3];
  if (cur.k === 'd' || cur.k === 'x') return 'animada';
  return 'calma';
}
function aplicarHumor(){ Som.aplicarHumor(humorPref === 'auto' ? humorDaFase(S.cur) : humorPref); }

function carregar(cur, manter){
  if (!faseDe(cur)) cur = {k: 'b', i: 0};
  const antes = manter ? {t: S.t, jog: S.jog} : null;
  S.cur = cur; S.jogo = novoJogo(faseDe(cur).text, filaPadraoDe(cur));
  if (S.n !== S.jogo.n){ S.n = S.jogo.n; montarBoard(); }
  $('#selo').hidden = true;
  S.sel = S.jogo.fila === 1 ? S.jogo.reserva[0] || null : null; S.drag = null; S.venceu = false; S.jog = 0; S.dicas = 0; S.ultimaIdu = 0; S.hist = []; S.dicaNivel = 0; S.dicaSig = ''; S.dicaConta = ''; S.dicaPeca = 0; S.solVista = false; if (S.sol) pararSolucao();
  S.t = {acum: 0, ult: performance.now(), ativo: cur.k === 'x'};
  if (antes){ S.t = antes.t; S.jog = antes.jog; }
  removerFlutuante(); limparGhost(); limparDica();
  $('#board').classList.remove('win');
  renderTudo(); ajustar(); atualizarTuto(); aplicarHumor(); avisoFila();
}
function avisoFila(){
  const f = S.jogo.fila;
  if (pecasPref !== 'auto' && S.jogo.filaAuto){ S.ultFila = f; return; }
  if (S.jogo.filaAuto){
    const ch = 'avFila' + f;
    if (!store.get(ch, false)){ store.set(ch, true); toast('Agora aparecem ' + f + ' peças por vez: ao encaixar uma, a próxima entra. Tirar uma peça do tabuleiro a coloca de volta na frente.'); }
    S.ultFila = f; return;
  }
  if (f && S.ultFila !== f) toast(f === 1 ? 'Uma peça por vez: você só vê a peça da vez. Tirar uma peça do tabuleiro a coloca de volta na frente.'
                                        : 'Peças em fila: só as próximas ' + f + ' aparecem. Tirar uma peça do tabuleiro a coloca de volta na frente.');
  S.ultFila = f;
}
const rotuloModo = j => (j.n > TAM ? j.n + '×' + j.n : '') + (j.fila && !j.filaAuto ? (j.n > TAM ? ' · ' : '') + tr(j.fila === 1 ? '1 por vez' : 'fila de ' + j.fila) : '');
function renderTudo(){ renderTitulo(); renderBoard(); renderReserva(); renderDica(); renderStats(); }

function renderTitulo(){
  const c = S.cur, t1 = $('#titulo .t1'), t2 = $('#titulo .t2');
  if (c.k === 'b'){ t1.textContent = tr('Fase ' + (c.i + 1)); t2.textContent = (modoTeste ? tr('teste') + ' · ' : '') + (rotuloModo(S.jogo) || tr('de ' + BUILTIN.length)); }
  else if (c.k === 'c'){ t1.textContent = custom[c.i].nome; t2.textContent = tr('fase personalizada'); }
  else if (c.k === 'd'){ t1.textContent = tr('Fase do dia'); t2.textContent = dataCurta(c.data); }
  else if (c.k === 'x'){ t1.textContent = c.campNome; t2.textContent = tr('Fase ' + (c.idx + 1) + ' de ' + c.total); }
  else if (c.k === 'i'){ t1.textContent = tr('Infinito {n}', {n: c.num + 1}); t2.textContent = tr(NIVEIS_INF[c.nivel].nome) + (S.jogo.n > TAM ? ' · ' + S.jogo.n + '×' + S.jogo.n : ''); }
  else if (c.shared){ t1.textContent = tr(c.nome); t2.textContent = tr('fase compartilhada'); }
  else { t1.textContent = tr('Teste'); t2.textContent = c.nome || tr('sua fase'); }
  $('#btnDica').disabled = c.k === 'x';
}

/* ---- relógio e estatísticas ---- */
const deveRodar = () => S.t.ativo && !S.venceu && (S.cur.k === 'x' || (!document.hidden && !document.querySelector('.ov.on')));
const tempoMs = () => S.t.acum;
function iniciaTempo(){ if (!S.t.ativo){ S.t.ativo = true; S.t.ult = performance.now(); } }
function tick(){
  const a = performance.now();
  if (deveRodar()){ const d = a - S.t.ult; S.t.acum += d; if (d > 0 && d < 5000){ Est.tempo += d; estSujo = true; } }
  S.t.ult = a;
  renderStats();
}
function renderStats(){
  $('#stTempo').textContent = fmtTempo(tempoMs());
  $('#stJog').textContent = fmtJog(S.jog);
  const k = S.cur && chaveFase(S.cur), r = k && recs[k];
  $('#pRec').hidden = !r; if (r) $('#stRec').textContent = fmtTempo(r.t) + ' · ' + r.j;
  $('#pDica').hidden = !S.dicas; $('#stDica').textContent = qtd(S.dicas, ' dica', ' dicas');
}
setInterval(tick, 250);

