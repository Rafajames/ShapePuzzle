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
  renderBoard(); renderReserva(); renderDica(); renderStats();
  if (concluido(S.jogo)) vencer();
  return true;
}
function renderSelo(){
  const cv = S.cur, selo = $('#selo'); if (!S.venceu || !cv || cv.k === 'r') return;
  selo.innerHTML = ic('check'); selo.append(tr(cv.k === 'b' ? 'Fase ' + (cv.i + 1) : cv.k === 'd' ? 'Dia ' + dataCurta(cv.data) : cv.k === 's' ? nomeSemana(cv.semana) : ehCamp(cv) ? 'Fase ' + (cv.idx + 1) + '/' + cv.total : faseDe(cv).nome));
  selo.hidden = false;
}
function vencer(){
  tick();
  S.venceu = true; atualizarDesfazer(); anunciar(tr('Fase concluída!'));
  $('#board').classList.add('win');
  renderSelo();
  const c = S.cur, k = chaveFase(c), t = Math.round(tempoMs()), j = S.jog;
  let novoT = false, novoJ = false, anterior = k ? recs[k] : null;
  const est = estrelasDe(j, S.jogo.total, S.dicas);
  if (c.k === 'u') tutorialFeito();
  else { Est.vitorias++; Est.jogadas += j; Est.dicas += S.dicas; if (S.solVista) Est.solucoes++; salvarEst(); }
  if (c.k === 'r'){ corridaFeita(); return; }
  if (c.k === 'o') registrarOff(c, t, j);
  if (c.k === 'i') registrarInf(c, t, j, est);
  if (c.k === 'b' && !modoTeste){
    if (!prog.done.includes(c.i)) prog.done.push(c.i);
    prog.max = Math.max(prog.max, Math.min(c.i + 1, LIMITE_FASES - 1));
    store.set('prog', prog);
    if (!(estrelasFase[c.i] >= est)){ estrelasFase[c.i] = est; store.set('est', estrelasFase); }
  }
  if (c.k === 'd' && !dias[c.data]){ dias[c.data] = {t, j, d: S.dicas}; store.set('dias', dias); }
  if (c.k === 's' && !sem[c.semana]){ sem[c.semana] = {t, j, d: S.dicas}; store.set('sem', sem); }
  if (k && !S.dicas && !modoTeste){
    if (!recs[k]) recs[k] = {t, j};
    else { if (t < recs[k].t){ recs[k].t = t; novoT = true; } if (j < recs[k].j){ recs[k].j = j; novoJ = true; } }
    store.set('rec', recs);
  }
  renderTitulo(); renderDica(); renderStats(); renderReserva();
  setTimeout(() => { Som.vitoria(); vibrar([40, 60, 40, 60, 140]); }, 120);
  setTimeout(() => mostrarVitoria({t, j, novoT, novoJ, anterior, est}), 900);
}
function mostrarVitoria(res){
  const c = S.cur, acts = $('#winActs');
  const ultima = c.k === 'b' && c.i >= LIMITE_FASES - 1;
  $('#winTitulo').textContent = tr(c.k === 'u' ? 'Tutorial concluído!' : ehCamp(c) ? 'Fase ' + (c.idx + 1) + ' concluída!' : c.k === 'i' ? 'Infinito ' + (c.num + 1) + ' concluído!' : ultima ? 'Você dominou todas as formas!' : c.k === 'd' ? 'Fase do dia concluída!' : c.k === 's' ? 'Desafio da semana concluído!' : c.k === 'b' ? 'Fase ' + (c.i + 1) + ' concluída!' : 'Fase concluída!');
  $('#winTexto').textContent = tr(c.k === 'u' ? 'Agora você já sabe o básico. Vamos para a Fase 1?' : c.k === 'x' ? 'Enviando o seu resultado…' : ultima ? 'Todas as fases estão completas. Que tal criar as suas?'
    : c.k === 'd' ? 'Volte amanhã para um novo desafio.' : c.k === 's' ? 'Volte na semana que vem para um novo desafio.'
    : (c.k === 't' && !c.shared) ? 'Sua fase tem solução. Pode salvar e compartilhar.' : 'Mandou bem!');
  const re = $('#winEstrelas'); re.innerHTML = '';
  for (let n = 1; n <= 3; n++) re.insertAdjacentHTML('beforeend', ic('star').replace('class="i"', 'class="i' + (n <= res.est ? ' on' : '') + '" style="--d:' + (0.15 + n * 0.22).toFixed(2) + 's"'));
  re.setAttribute('aria-label', tr(res.est === 1 ? '1 estrela de 3' : res.est + ' estrelas de 3'));
  const r = $('#winRes'); r.innerHTML = '';
  const pill = (icone, txt) => { const s = mk('span', 'pill'); s.innerHTML = ic(icone); s.append(txt); r.appendChild(s); };
  pill('clock', fmtTempo(res.t)); pill('swap', fmtJog(res.j)); if (S.dicas) pill('bulb', qtd(S.dicas, ' dica', ' dicas'));
  const k = chaveFase(c);
  $('#winBadge').textContent = tr(!k ? '' : S.dicas ? 'Com dica — esta partida não conta para recorde.'
    : (res.novoT || res.novoJ) ? (res.novoT && res.novoJ ? 'Novo recorde de tempo e de jogadas!' : res.novoT ? 'Novo recorde de tempo!' : 'Novo recorde de jogadas!')
    : !res.anterior ? 'Primeiro registro desta fase.' : 'Seu recorde: ' + fmtTempo(recs[k].t) + ' · ' + fmtJog(recs[k].j));
  acts.innerHTML = '';
  const add = (txt, cls, fn, icone) => { const b = mk('button', 'btn ' + cls); if (icone) b.innerHTML = ic(icone); b.append(tr(txt)); b.onclick = () => { if (fn.fecha !== false) fechar('win'); fn(); }; acts.appendChild(b); };
  if (c.k === 'b' && !ultima) add('Próxima fase', 'pri', () => carregar({k: 'b', i: c.i + 1}));
  if (c.k === 'i') add('Próxima fase', 'pri', () => jogarInfinito(c.modo));
  if (c.k === 't' && !c.shared) add('Voltar ao editor', 'pri', () => abrir('editor'));
  if (c.k === 't' && c.shared) add('Salvar em Minhas fases', 'pri', () => { salvarCustom(c.nome, c.text); toast('Fase salva em Minhas fases'); });
  if (ultima) add('Criar fase', 'pri', () => abrirEditor());
  if (c.k === 'x') vitoriaCamp(c, res, add);
  else if (c.k === 'o') vitoriaOff(c, res, add);
  else if (c.k === 'u'){ add('Ir para a Fase 1', 'pri', () => carregar({k: 'b', i: 0})); add('Jogar o tutorial de novo', '', abrirTutorial); }
  else {
  const compartilharRes = () => {
    const base = urlBase();
    if (c.k === 'd') compartilhar('Shape Puzzle', tr('Shape Puzzle — Fase do dia {data}\n⏱ {tempo} · {jog}{dicas}\n🔥 Sequência: {seq}\nConsegue mais rápido?', {data: dataCurta(c.data), tempo: fmtTempo(res.t), jog: fmtJog(res.j), dicas: S.dicas ? ' · ' + qtd(S.dicas, ' dica', ' dicas') : '', seq: qtd(sequencia(), ' dia', ' dias')}), base);
    else if (c.k === 's') compartilhar('Shape Puzzle', tr('Shape Puzzle — Desafio da semana {sem}\n⏱ {tempo} · {jog}{dicas}\n🔥 Semanas seguidas: {seq}\nConsegue mais rápido?', {sem: nomeSemana(c.semana), tempo: fmtTempo(res.t), jog: fmtJog(res.j), dicas: S.dicas ? ' · ' + qtd(S.dicas, ' dica', ' dicas') : '', seq: qtd(sequenciasSemanas(sem, dataHoje()).atual, ' semana', ' semanas')}), base);
    else if (c.k === 'b') compartilhar('Shape Puzzle', tr('Passei da fase {n} do Shape Puzzle em {tempo} ({jog})! Tenta aí:', {n: c.i + 1, tempo: fmtTempo(res.t), jog: fmtJog(res.j)}), base);
    else if (c.k === 'i') compartilhar('Shape Puzzle', tr('Olha essa fase do modo infinito do Shape Puzzle. Consegue resolver?'), urlFase(c.text, c.nome));
    else compartilhar('Shape Puzzle', tr('Tente a fase "{nome}" que eu criei no Shape Puzzle!', {nome: c.k === 'c' ? custom[c.i].nome : c.nome}), urlFase(faseDe(c).text, c.k === 'c' ? custom[c.i].nome : c.nome));
  };
  compartilharRes.fecha = false;
  add(c.k === 'd' || c.k === 's' ? 'Compartilhar resultado' : c.k === 'b' ? 'Desafiar um amigo' : 'Compartilhar fase', '', compartilharRes, 'share');
  const jn = () => carregar(S.cur); add('Jogar de novo', '', jn);
  if (c.k === 'i') add('Mudar dificuldade', '', abrirInf);
  else if (c.k !== 't') add('Fases', '', abrirMenu);
  }
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

