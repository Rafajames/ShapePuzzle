/* ======================= Desafios: da semana e contra o relógio ======================= */
const nomeSemana = ch => tr('Semana {n}', {n: +ch.slice(6)});

/* Desafio da semana: a mesma fase (6×6, 3 peças por vez) para todo mundo, escolhida pela semana. Fica guardada para não gerar de novo. */
async function faseDaSemana(ch){
  const c = store.get('semfase', null);
  if (c && c.sem === ch && typeof c.text === 'string' && faseValida(c.text)) return c.text;
  const base = (semanaIdx(segundaDe(ch)) * 7919) % 900000000 + 1;
  for (let t = 0; t < 12; t++){
    const f = await Gerador.gerar(base + t, NIVEIS_INF.dificil.o);
    if (f && f.unica){ store.set('semfase', {sem: ch, text: f.text}); return f.text; }
  }
  return null;
}
/* Gera sem deixar começar duas vezes ao mesmo tempo; devolve null se não deu. */
async function comGerando(fn){
  if (Inf.gerando) return null;
  Inf.gerando = true; mostrarGerando(true);
  let r = null;
  try{ r = await fn(); }catch(e){}
  mostrarGerando(false); Inf.gerando = false;
  if (!r) toast('Não consegui gerar uma fase agora. Tente de novo.');
  return r;
}
async function jogarSemana(){
  const ch = semanaDe(dataHoje()), text = await comGerando(() => faseDaSemana(ch));
  if (!text) return;
  fecharTodos('ov-splash'); carregar({k: 's', semana: ch, nome: 'semana ' + ch, text});
}
$('#btnSem').onclick = jogarSemana;

/* Contra o relógio: 3 minutos, quantas fases novas dá para resolver. Sem dicas; o tempo corre pelo relógio. */
const Corrida = {ativa: false, fim: 0, feitas: 0, prox: null, duracao: 180000};
const nivelCorrida = n => n < 4 ? 'facil' : n < 9 ? 'medio' : 'dificil';
const gerarNivelCorrida = async n => { const f = await gerarNivelInf(nivelCorrida(n), n, 0); return f && Object.assign(f, {k: 'r', n, nome: 'Corrida ' + (n + 1)}); };
const prepararProxima = n => { if (Gerador.emSegundoPlano) Corrida.prox = gerarNivelCorrida(n); };
async function jogarCorrida(){
  const fase = await comGerando(() => gerarNivelCorrida(0));
  if (!fase) return;
  fecharTodos('ov-splash');
  Object.assign(Corrida, {ativa: true, feitas: 0, fim: Date.now() + Corrida.duracao, prox: null});
  carregar(fase); prepararProxima(1);
}
function corridaFeita(){
  Corrida.feitas++; Som.vitoria(); vibrar(30); toast('Mais uma! Vamos para a próxima.');
  setTimeout(proximaCorrida, 700);
}
async function proximaCorrida(){
  if (!Corrida.ativa) return;
  const n = Corrida.feitas;
  let fase = null;
  try{ fase = (Corrida.prox && await Corrida.prox) || await gerarNivelCorrida(n); }catch(e){}
  Corrida.prox = null;
  if (!Corrida.ativa) return;
  if (!fase || Date.now() >= Corrida.fim){ fimCorrida(); return; }
  carregar(fase); prepararProxima(n + 1);
}
function fimCorrida(){
  if (!Corrida.ativa) return;
  Corrida.ativa = false; Corrida.prox = null;
  S.venceu = true; S.drag = null; removerFlutuante(); limparGhost(); atualizarDesfazer(); renderReserva();
  const n = Corrida.feitas, antes = corr.melhor;
  corr = {melhor: Math.max(n, antes), jogos: corr.jogos + 1, total: corr.total + n}; store.set('corr', corr);
  anunciar(tr('Tempo esgotado!'));
  setTimeout(() => mostrarFimCorrida(n, n > antes, antes), 400);
}
function mostrarFimCorrida(n, recorde, antes){
  $('#winTitulo').textContent = tr('Tempo esgotado!');
  $('#winTexto').textContent = tr(n ? 'Você resolveu {n} em 3 minutos.' : 'Nenhuma fase dessa vez. Tente de novo!', {n: qtd(n, ' fase', ' fases')});
  $('#winEstrelas').innerHTML = ''; $('#winEstrelas').removeAttribute('aria-label');
  const r = $('#winRes'); r.innerHTML = ''; const pill = mk('span', 'pill'); pill.innerHTML = ic('trophy'); pill.append(String(n)); r.appendChild(pill);
  $('#winBadge').textContent = tr(recorde && n ? 'Novo recorde da corrida!' : 'Seu recorde: {n}', {n: String(corr.melhor)});
  const acts = $('#winActs'); acts.innerHTML = '';
  [['Jogar de novo', 'pri', jogarCorrida], ['Menu', '', abrirMenu]].forEach(([txt, cls, fn]) => {
    const b = mk('button', 'btn ' + cls, tr(txt)); b.onclick = () => { fechar('win'); fn(); }; acts.appendChild(b);
  });
  $('#cardWin').querySelectorAll('.conf').forEach(x => x.remove());
  abrir('win');
}
$('#btnCorr').onclick = () => { fechar('menu'); jogarCorrida(); };
