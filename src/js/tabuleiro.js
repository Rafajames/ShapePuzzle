/* ---- tabuleiro ---- */
function rotuloTabuleiro(){ const b = $('#board'); if (b) b.setAttribute('aria-label', tr('Tabuleiro {n} por {n}. Setas movem o cursor, Enter encaixa a peça.', {n: S.n})); }
function montarBoard(){
  const b = $('#board'); b.innerHTML = ''; b.style.setProperty('--n', S.n); S.cursor = null;
  rotuloTabuleiro();
  for (let y = 0; y < S.n; y++) for (let x = 0; x < S.n; x++){
    const c = mk('div', 'cell');
    c.innerHTML = '<div class="star"></div><div class="fill"></div>'; c.setAttribute('role', 'img');
    b.appendChild(c);
  }
}
function cellEl(x, y){ return $('#board').children[y * S.n + x]; }
function renderBoard(){
  const j = S.jogo;
  for (let y = 0; y < S.n; y++) for (let x = 0; x < S.n; x++){
    const c = cellEl(x, y), star = c.children[0], fill = c.children[1];
    const idu = j.grade[y][x], est = j.gab[y][x];
    if (idu){ const p = j.mapa.get(idu); fill.style.display = 'block'; fill.style.setProperty('--c', COR[p ? p.id : 1]); fill.dataset.s = p ? p.id : 1; }
    else fill.style.display = 'none';
    if (est && !idu){ star.style.display = 'block'; star.style.setProperty('--c', COR[est]); star.dataset.s = est; }
    else star.style.display = 'none';
    c.setAttribute('aria-label', descCelula(x, y));
  }
}
function celulaEm(cx, cy){
  const r = $('#board').getBoundingClientRect();
  const x = Math.floor((cx - r.left) / S.cell), y = Math.floor((cy - r.top) / S.cell);
  return (x >= 0 && y >= 0 && x < S.n && y < S.n) ? {x, y} : null;
}

/* ---- reserva ---- */
/* Cada fileira cabe inteira na largura: se as peças ficarem largas demais, todas encolhem juntas. */
function fitFileiras(){
  const el = $('#reserva'); if (!el) return;
  el.style.removeProperty('--mini');
  const disp = el.clientWidth; if (!disp) return;
  const gap = parseFloat(getComputedStyle(el.querySelector('.rp') || el).columnGap) || 0;
  for (let t = 0; t < 5; t++){
    const need = Math.max(0, ...[...el.querySelectorAll('.rp')].map(r => [...r.children].reduce((a, c) => a + c.offsetWidth, 0) + gap * Math.max(0, r.children.length - 1)));
    if (need <= disp) break;
    const mini = parseFloat(getComputedStyle(el).getPropertyValue('--mini')) || 30;
    el.style.setProperty('--mini', Math.max(10, Math.floor(mini * disp / need * 0.96)) + 'px');
  }
}
function renderReserva(){
  const el = $('#reserva'); el.innerHTML = ''; atualizarDesfazer();
  const arrastando = S.drag && S.drag.moved ? S.drag.piece : null;
  const vis = visiveis(S.jogo), n = vis.length;
  /* centralizadas: até 3 numa fileira; 4 = 2+2; 5 = 3+2; 6 = 3+3 */
  const cima = n <= 3 ? n : Math.ceil(n / 2);
  let fileira = null;
  vis.forEach((p, i) => {
    if (i === 0 || i === cima) el.appendChild(fileira = mk('div', 'rp'));
    const w = mk('div', 'pw' + (S.sel === p ? ' sel' : '') + (arrastando === p ? ' hide' : '') + (S.dicaPeca === p.uid ? ' dicaP' : ''));
    w.dataset.uid = p.uid; w.tabIndex = 0; w.setAttribute('role', 'button');
    w.setAttribute('aria-pressed', S.sel === p); w.setAttribute('aria-label', (i + 1) + '. ' + descPeca(p) + (S.sel === p ? ', ' + tr('selecionada') : ''));
    const pe = pecaEl(p.formato, p.id, 'mini');
    if (S.anim && S.sel === p) pe.classList.add(S.anim === 'giro' ? 'a-giro' : 'a-flip');
    w.appendChild(pe);
    fileira.appendChild(w);
  });
  S.anim = null;
  if (!S.jogo.reserva.length) el.innerHTML = '<div class="vazio">' + tr('Todas as peças estão no tabuleiro.') + '</div>';
  { const j = S.jogo, resta = j.reserva.length;
    $('#contagem').textContent = !resta ? '' : tr(j.fila === 1 ? 'Peça ' + (j.total - resta + 1) + ' de ' + j.total : resta + (resta === 1 ? ' restante' : ' restantes')); }
  fitFileiras(); atualizarTuto();
  $('#btnGirar').disabled = $('#btnFlip').disabled = !S.sel;
  $('#btnDica').disabled = S.venceu || (S.cur && semDica(S.cur));
}
function renderDica(){
  const toque = matchMedia('(pointer:coarse)').matches;
  let t;
  $('#dica').classList.toggle('tuto', tutoAtivo() || tutorialAtivo());
  if (tutorialAtivo()) t = tutorialTexto();
  else if (tutoAtivo()) t = TUTO_TXT[passoTuto()];
  else if (S.venceu) t = 'Fase concluída!';
  else if (toque) t = S.sel ? 'Dois toques giram · deslizar o dedo espelha · toque numa casa para encaixar.' : 'Toque numa peça para selecionar. Depois, dois toques giram e deslizar espelha.';
  else if (!S.sel && S.jogo.fila) t = 'Peças em fila: encaixe a peça da vez para ver a próxima. Dá para tirar uma peça já colocada tocando nela.';
  else if (S.sel) t = toque ? 'Peça selecionada — use Girar/Espelhar e toque numa casa para encaixar (ou arraste).'
                             : 'Peça selecionada — R gira, T espelha. Clique numa casa para encaixar (ou arraste).';
  else t = toque ? 'Arraste uma peça para o tabuleiro, ou toque nela para selecionar.'
                 : 'Arraste uma peça para o tabuleiro. Clique numa peça já encaixada para tirá-la (ou passe o mouse e aperte E).';
  $('#dica').textContent = tr(t);
}
/* Peça tirada do tabuleiro: volta à reserva; em fila, volta para a frente. */
function devolver(p){ if (S.jogo.fila) S.jogo.reserva.unshift(p); else S.jogo.reserva.push(p); }
function selecionar(p){ S.sel = p; renderReserva(); renderDica(); if (p) anunciar(descPeca(p) + ', ' + tr('selecionada')); }

/* ---- fantasma (pré-visualização do encaixe) ---- */
function limparGhost(){ S.ghost.forEach(c => c.classList.remove('gok', 'gbad')); S.ghost = []; }
function mostrarGhost(p, gx, gy){
  limparGhost();
  const f = p.formato, ok = podeColocar(S.jogo, f, gx, gy);
  for (let i = 0; i < f.length; i++) for (let k = 0; k < f[0].length; k++){
    if (!f[i][k]) continue;
    const ax = gx + k, ay = gy + i;
    if (ax < 0 || ax >= S.n || ay < 0 || ay >= S.n) continue;
    const c = cellEl(ax, ay); c.classList.add(ok ? 'gok' : 'gbad'); S.ghost.push(c);
  }
}
function sobreposto(f, gx, gy){
  for (let i = 0; i < f.length; i++) for (let k = 0; k < f[0].length; k++)
    if (f[i][k] && gx + k >= 0 && gx + k < S.n && gy + i >= 0 && gy + i < S.n) return true;
  return false;
}

