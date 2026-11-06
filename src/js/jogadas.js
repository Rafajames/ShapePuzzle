/* ---- ações ---- */
function tremer(){
  const b = $('#board'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
}
function tentarColocar(p, gx, gy){
  if (!podeColocar(S.jogo, p.formato, gx, gy)){
    if (sobreposto(p.formato, gx, gy)){ tremer(); Som.invalido(); vibrar([25, 40, 25]); anunciar(tr('Não cabe aí.')); }
    return false;
  }
  limparDica(); iniciaTempo();
  S.ultimaIdu = colocar(S.jogo, p, gx, gy); S.hist.push(S.ultimaIdu); S.jog++; tutorialEvento('colocou');
  S.sel = S.jogo.fila === 1 ? S.jogo.reserva[0] || null : null; limparGhost();
  Som.encaixar(); vibrar(14);
  { const falta = S.jogo.total - S.jogo.mapa.size; anunciar(falta ? tr(falta === 1 ? 'Peça encaixada. Falta 1 peça.' : 'Peça encaixada. Faltam {n} peças.', {n: falta}) : tr('Peça encaixada.')); }
  renderBoard(); destacarEncaixe(S.ultimaIdu); renderReserva(); renderDica(); renderStats();
  if (concluido(S.jogo)) vencer();
  return true;
}
/* a peça que acabou de encaixar "salta" e brilha por um instante */
function destacarEncaixe(idu){
  if (a11y.mov) return;
  const g = S.jogo.grade;
  for (let y = 0; y < S.n; y++) for (let x = 0; x < S.n; x++) if (g[y][x] === idu){
    const c = cellEl(x, y); c.classList.remove('novo'); void c.offsetWidth; c.classList.add('novo');
    setTimeout(() => c.classList.remove('novo'), 650);
  }
}
function renderSelo(){
  const cv = S.cur, selo = $('#selo'); if (!S.venceu || !cv || cv.k === 'r') return;
  selo.innerHTML = ic('check'); selo.append(tr(cv.k === 'b' ? 'Fase ' + (cv.i + 1) : cv.k === 'd' ? 'Dia ' + dataCurta(cv.data) : cv.k === 'n' ? tr('Natal · dia {n}', {n: cv.dia}) : cv.k === 's' ? nomeSemana(cv.semana) : ehCamp(cv) ? 'Fase ' + (cv.idx + 1) + '/' + cv.total : faseDe(cv).nome));
  selo.hidden = false; selo.setAttribute('role', 'button'); selo.tabIndex = 0; selo.setAttribute('aria-label', tr('Ver o resultado'));
}
/* depois de fechar o resultado, tocar no selo da fase abre de novo */
function reabrirVitoria(){ if (S.venceu && S.ultVit) mostrarVitoria(S.ultVit, true); }
$('#selo').onclick = reabrirVitoria;
$('#selo').onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); reabrirVitoria(); } };
function vencer(){
  tick();
  S.venceu = true; atualizarDesfazer(); anunciar(tr('Fase concluída!'));
  $('#board').classList.add('win');
  renderSelo(); Festa.iniciar();
  const c = S.cur, k = chaveFase(c), t = Math.round(tempoMs()), j = S.jog, saldo0 = saldoAtual(), ganhos = [];
  let novoT = false, novoJ = false, anterior = k ? recs[k] : null; S.presente = null;
  const est = estrelasDe(j, S.jogo.total, S.dicas);
  if (c.k === 'u') tutorialFeito();
  else { Est.vitorias++; Est.jogadas += j; Est.dicas += S.dicas; if (S.solVista) Est.solucoes++; salvarEst(); }
  if (c.k !== 'u'){
    const mis = registrarMissoes([['vit'], ['semDica', S.dicas ? 0 : 1], ['tres', est === 3 ? 1 : 0], ['rapida', t < 60000 ? 1 : 0], ['dia', c.k === 'd' ? 1 : 0], ['inf', c.k === 'i' ? 1 : 0]].filter(x => x[1] !== 0));
    if (mis) ganhos.push(['Missões do dia', mis]);
  }
  if (c.k === 'r'){ corridaFeita(); return; }
  if (c.k === 'o') registrarOff(c, t, j);
  if (c.k === 'i') registrarInf(c, t, j, est);
  if (c.k === 'b' && !modoTeste){
    if (!prog.done.includes(c.i)) prog.done.push(c.i);
    prog.max = Math.max(prog.max, Math.min(c.i + 1, LIMITE_FASES - 1));
    store.set('prog', prog);
    if (!(estrelasFase[c.i] >= est)){ ganhos.push(['Estrelas da fase', est - (estrelasFase[c.i] || 0)]); estrelasFase[c.i] = est; store.set('est', estrelasFase); }
  }
  if (c.k === 'd' && !dias[c.data]){ dias[c.data] = {t, j, d: S.dicas}; store.set('dias', dias); ganhos.push(['Fase do dia', BONUS_DIA]); }
  if (c.k === 'n' && !modoTeste){ const nt = vitoriaNatal(c); if (nt){ ganhos.push(['Calendário de Natal', nt.estrelas]); S.presente = nt.item; } }
  if (c.k === 's' && !sem[c.semana]){ sem[c.semana] = {t, j, d: S.dicas}; store.set('sem', sem); ganhos.push(['Desafio da semana', BONUS_SEMANA]); }
  const bon = aposVitoriaConta(); if (bon) ganhos.push(['Bônus do visual', bon.ganho, bon.teto]);
  { const resto = saldoAtual() - saldo0 - ganhos.reduce((a, g) => a + g[1], 0); if (resto > 0) ganhos.push(['Conquistas', resto]); }
  if (k && !S.dicas && !modoTeste){
    if (!recs[k]) recs[k] = {t, j};
    else { if (t < recs[k].t){ recs[k].t = t; novoT = true; } if (j < recs[k].j){ recs[k].j = j; novoJ = true; } }
    store.set('rec', recs);
  }
  renderTitulo(); renderDica(); renderStats(); renderReserva();
  setTimeout(() => { Som.vitoria(); vibrar([40, 60, 40, 60, 140]); }, 120);
  if (c.k === 'd') agendarLembretes();
  if (Est.vitorias >= 3) setTimeout(() => pedirLembretes(), 2500);
  setTimeout(() => mostrarVitoria({t, j, novoT, novoJ, anterior, est, saldo0, saldo1: saldoAtual(), ganhos}), 900);
}
/* botão de uma ação da vitória (usado na tela de conclusão e no painel de baixo) */
function botaoAcao(a){
  const b = mk('button', 'btn ' + a.cls); if (a.icone) b.innerHTML = ic(a.icone); b.append(tr(a.txt));
  b.onclick = () => { if (a.fn.fecha !== false) fechar('win'); a.fn(); }; return b;
}
function mostrarVitoria(res, reabrir){
  S.ultVit = res;
  const c = S.cur, acts = $('#winActs');
  const ultima = c.k === 'b' && c.i >= LIMITE_FASES - 1;
  $('#winTitulo').textContent = tr(c.k === 'u' ? 'Tutorial concluído!' : ehCamp(c) ? 'Fase ' + (c.idx + 1) + ' concluída!' : c.k === 'i' ? 'Infinito ' + (c.num + 1) + ' concluído!' : ultima ? 'Você dominou todas as formas!' : c.k === 'd' ? 'Fase do dia concluída!' : c.k === 'n' ? tr('Porta {n} do Natal aberta!', {n: c.dia}) : c.k === 's' ? 'Desafio da semana concluído!' : c.k === 'b' ? 'Fase ' + (c.i + 1) + ' concluída!' : 'Fase concluída!');
  $('#winTexto').textContent = tr(c.k === 'u' ? 'Agora você já sabe o básico. Vamos para a Fase 1?' : c.k === 'x' ? 'Enviando o seu resultado…' : ultima ? 'Todas as fases estão completas. Que tal criar as suas?'
    : c.k === 'n' ? (S.presente ? tr('Presente de Natal: {nome}! Já está em Meu perfil.', {nome: nomeItem(S.presente)}) : c.dia < NATAL_DIAS ? 'Volte amanhã para abrir a próxima porta.' : 'Feliz Natal!')
    : c.k === 'd' ? 'Volte amanhã para um novo desafio.' : c.k === 's' ? 'Volte na semana que vem para um novo desafio.'
    : (c.k === 't' && !c.shared) ? 'Sua fase tem solução. Pode salvar e compartilhar.' : 'Mandou bem!');
  const re = $('#winEstrelas'); re.innerHTML = '';
  for (let n = 1; n <= 3; n++) re.insertAdjacentHTML('beforeend', ic('star').replace('class="i"', 'class="i e' + n + (n <= res.est ? ' on' : '') + '" style="--d:' + (0.15 + n * 0.22).toFixed(2) + 's"'));
  re.setAttribute('aria-label', tr(res.est === 1 ? '1 estrela de 3' : res.est + ' estrelas de 3'));
  if (!reabrir && !a11y.mov) for (let n = 1; n <= res.est; n++) setTimeout(() => Som.estrela && Som.estrela(n), (0.15 + n * 0.22) * 1000);
  $('#winElogio').textContent = tr(res.est === 3 ? 'Perfeito!' : res.est === 2 ? 'Muito bem!' : 'Conseguiu!');
  const r = $('#winRes'); r.innerHTML = '';
  const chip = (valor, rotulo) => { const s = mk('span', 'resChip'); s.appendChild(mk('b', '', valor)); s.appendChild(mk('small', '', rotulo)); r.appendChild(s); };
  chip(fmtTempo(res.t), tr('tempo')); chip(String(res.j), tr(res.j === 1 ? 'jogada' : 'jogadas')); if (S.dicas) chip(String(S.dicas), tr(S.dicas === 1 ? 'dica' : 'dicas'));
  const k = chaveFase(c), novo = !S.dicas && (res.novoT || res.novoJ), bd = $('#winBadge');
  bd.textContent = tr(!k ? '' : S.dicas ? 'Com dica — esta partida não conta para recorde.'
    : novo ? (res.novoT && res.novoJ ? 'Novo recorde de tempo e de jogadas!' : res.novoT ? 'Novo recorde de tempo!' : 'Novo recorde de jogadas!')
    : !res.anterior ? 'Primeiro registro desta fase.' : 'Seu recorde: ' + fmtTempo(recs[k].t) + ' · ' + fmtJog(recs[k].j));
  bd.classList.toggle('novo', !!novo); if (novo) bd.insertAdjacentHTML('afterbegin', ic('trophy'));
  const so = $('#winSoma'), gs = (res.ganhos || []).filter(g => g[1] > 0); so.textContent = ''; so.hidden = !gs.length;
  if (gs.length){
    const linha = (txt, valor, total) => { const l = mk('div', total ? 'somaL somaT' : 'somaL'); l.appendChild(mk('span', '', txt)); l.appendChild(valor); so.appendChild(l); };
    gs.forEach(([rot, n, teto]) => linha(tr(rot) + (teto ? ' (' + tr('limite de hoje atingido') + ')' : ''), mk('b', '', '+' + n + ' ★')));
    const v = mk('span', 'somaV'); v.append(res.saldo0 + ' → '); v.appendChild(mk('b', '', res.saldo1 + ' ★'));
    linha(tr('Total'), v, true);
  }
  acts.innerHTML = '';
  S.acoesVit = [];
  const add = (txt, cls, fn, icone) => { S.acoesVit.push({txt, cls, fn, icone}); };
  if (c.k === 'b' && !ultima) add('Próxima fase', 'pri', () => carregar({k: 'b', i: c.i + 1}), 'next');
  if (c.k === 'i') add('Próxima fase', 'pri', () => jogarInfinito(c.modo), 'next');
  if (c.k === 'n') add('Calendário de Natal', 'pri', abrirNatal, 'gift');
  if (c.k === 't' && !c.shared) add('Voltar ao editor', 'pri', () => abrir('editor'));
  if (c.k === 't' && c.shared) add('Salvar em Minhas fases', 'pri', () => { salvarCustom(c.nome, c.text); toast('Fase salva em Minhas fases'); });
  if (ultima) add('Criar fase', 'pri', () => abrirEditor());
  if (c.k === 'x') vitoriaCamp(c, res, add, reabrir);
  else if (c.k === 'o') vitoriaOff(c, res, add);
  else if (c.k === 'u'){ add('Ir para a Fase 1', 'pri', () => carregar({k: 'b', i: 0})); add('Jogar o tutorial de novo', '', abrirTutorial); }
  else {
  const compartilharRes = () => {
    const base = urlBase();
    if (c.k === 'd') compartilhar('Shape Puzzle', tr('Shape Puzzle — Fase do dia {data}\n⏱ {tempo} · {jog}{dicas}\n🔥 Sequência: {seq}\nConsegue mais rápido?', {data: dataCurta(c.data), tempo: fmtTempo(res.t), jog: fmtJog(res.j), dicas: S.dicas ? ' · ' + qtd(S.dicas, ' dica', ' dicas') : '', seq: qtd(sequencia(), ' dia', ' dias')}), base);
    else if (c.k === 's') compartilhar('Shape Puzzle', tr('Shape Puzzle — Desafio da semana {sem}\n⏱ {tempo} · {jog}{dicas}\n🔥 Semanas seguidas: {seq}\nConsegue mais rápido?', {sem: nomeSemana(c.semana), tempo: fmtTempo(res.t), jog: fmtJog(res.j), dicas: S.dicas ? ' · ' + qtd(S.dicas, ' dica', ' dicas') : '', seq: qtd(sequenciasSemanas(sem, dataHoje()).atual, ' semana', ' semanas')}), base);
    else if (c.k === 'b') compartilhar('Shape Puzzle', tr('Passei da fase {n} do Shape Puzzle em {tempo} ({jog})! Tenta aí:', {n: c.i + 1, tempo: fmtTempo(res.t), jog: fmtJog(res.j)}), base);
    else if (c.k === 'n') compartilhar('Shape Puzzle', tr('Abri a porta {n} do Calendário de Natal do Shape Puzzle em {tempo}! 🎄 Vem jogar também:', {n: c.dia, tempo: fmtTempo(res.t)}), base);
    else if (c.k === 'i') compartilhar('Shape Puzzle', tr('Olha essa fase do modo infinito do Shape Puzzle. Consegue resolver?'), urlFase(c.text, c.nome));
    else compartilhar('Shape Puzzle', tr('Tente a fase "{nome}" que eu criei no Shape Puzzle!', {nome: c.k === 'c' ? custom[c.i].nome : c.nome}), urlFase(faseDe(c).text, c.k === 'c' ? custom[c.i].nome : c.nome));
  };
  compartilharRes.fecha = false;
  add(c.k === 'd' || c.k === 's' || c.k === 'n' ? 'Compartilhar resultado' : c.k === 'b' ? 'Desafiar um amigo' : 'Compartilhar fase', '', compartilharRes, 'share');
  const jn = () => carregar(S.cur); add('Jogar de novo', '', jn, 'reset');
  if (c.k === 'i') add('Mudar dificuldade', '', abrirInf, 'grid');
  else if (c.k !== 't') add('Fases', '', abrirMenu, 'grid');
  }
  add('Início', '', irInicio, 'home');
  S.acoesVit.forEach(a => acts.appendChild(botaoAcao(a)));
  renderReserva(); ajustar();         /* os mesmos botões também ficam embaixo, para quem fecha a tela de conclusão */
  const card = $('#cardWin'); card.querySelectorAll('.conf').forEach(n => n.remove());
  if (!a11y.mov) Object.values(COR).forEach((cor, n) => { for (let i = 0; i < 8; i++){
    const d = mk('i', 'conf'); d.style.background = cor;
    d.style.setProperty('--dx', (Math.random() * 320 - 160) + 'px'); d.style.setProperty('--dy', (Math.random() * 300 - 120) + 'px');
    d.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); d.style.animationDelay = (n * 0.03 + Math.random() * 0.2) + 's';
    card.appendChild(d);
  }});
  abrir('win');
}

function acaoGirar(){
  const p = S.sel; if (!p){ toast('Selecione uma peça primeiro'); return; }
  p.formato = girar(p.formato); Som.girar(); S.anim = 'giro'; anunciar(tr('Peça girada.')); tutorialEvento('girou'); aposTransformar();
}
function acaoFlip(){
  const p = S.sel; if (!p){ toast('Selecione uma peça primeiro'); return; }
  p.formato = inverter(p.formato); Som.flip(); S.anim = 'flip'; anunciar(tr('Peça espelhada.')); tutorialEvento('espelhou'); aposTransformar();
}
function aposTransformar(){
  renderReserva();
  if (S.drag && S.drag.moved){ criarFlutuante(); posFlutuante(); atualizarGhostDrag(); }
  else atualizarGhostHover();
}

