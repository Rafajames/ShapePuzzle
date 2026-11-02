/* ---- arrastar ---- */
function criarFlutuante(){
  const d = S.drag, f = $('#flut'); f.innerHTML = ''; f.appendChild(pecaEl(d.piece.formato, d.piece.id, 'big')); f.hidden = false;
}
function removerFlutuante(){ const f = $('#flut'); f.hidden = true; f.innerHTML = ''; }
function origemFlut(d){
  const f = d.piece.formato, off = d.tipo === 'mouse' ? 0 : -S.cell * 1.5;
  return {px: d.x - f[0].length * S.cell / 2, py: d.y + off - f.length * S.cell / 2};
}
function posFlutuante(){ const o = origemFlut(S.drag); $('#flut').style.transform = `translate(${o.px}px,${o.py}px)`; }
function gridDeOrigem(o){
  const r = $('#board').getBoundingClientRect();
  return {gx: Math.round((o.px - r.left) / S.cell), gy: Math.round((o.py - r.top) / S.cell)};
}
function atualizarGhostDrag(){
  const d = S.drag; if (!d || !d.moved) return;
  const {gx, gy} = gridDeOrigem(origemFlut(d));
  if (sobreposto(d.piece.formato, gx, gy)) mostrarGhost(d.piece, gx, gy); else limparGhost();
}
function atualizarGhostHover(){
  if (S.drag || !S.sel || !S.hover || !S.hover.mouse){ if (!S.drag) limparGhost(); return; }
  const f = S.sel.formato;
  mostrarGhost(S.sel, S.hover.x - Math.floor(f[0].length / 2), S.hover.y - Math.floor(f.length / 2));
}
function iniciarDrag(e, piece, origem){
  const jaSel = S.sel === piece;
  S.drag = {piece, pid: e.pointerId, tipo: e.pointerType, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, moved: false, origem, jaSel};
  limparGhost(); iniciaTempo();
  selecionar(piece);
}

$('#reserva').addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const w = e.target.closest('.pw'); if (!w) return;
  const p = S.jogo.reserva.find(q => q.uid == w.dataset.uid); if (!p) return;
  e.preventDefault(); iniciarDrag(e, p, 'reserva');
});
$('#board').addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (S.venceu || S.drag) return;
  const c = celulaEm(e.clientX, e.clientY); if (!c) return;
  e.preventDefault();
  if (S.jogo.grade[c.y][c.x]){
    const p = remover(S.jogo, c.x, c.y);
    if (p){ limparDica(); devolver(p); Som.pegar(); renderBoard(); iniciarDrag(e, p, 'tabuleiro'); }
  } else if (S.sel){
    if (e.pointerType !== 'mouse'){ gestoInicio(e, 'tabuleiro', c); return; }
    const f = S.sel.formato;
    tentarColocar(S.sel, c.x - Math.floor(f[0].length / 2), c.y - Math.floor(f.length / 2));
  } else gestoInicio(e, 'tabuleiro', c);
});
$('#board').addEventListener('pointerleave', () => { S.hover = null; if (!S.drag) limparGhost(); });
window.addEventListener('pointermove', e => {
  const d = S.drag;
  if (d && e.pointerId === d.pid){
    d.x = e.clientX; d.y = e.clientY;
    if (!d.moved && Math.hypot(d.x - d.x0, d.y - d.y0) > 6){
      d.moved = true; criarFlutuante(); renderReserva(); if (d.origem === 'reserva') Som.pegar();
    }
    if (d.moved){ posFlutuante(); atualizarGhostDrag(); }
    return;
  }
  const c = e.target === $('#board') || $('#board').contains(e.target) ? celulaEm(e.clientX, e.clientY) : null;
  S.hover = c ? {x: c.x, y: c.y, mouse: e.pointerType === 'mouse'} : null;
  atualizarGhostHover();
});
function fimDrag(e, cancelado){
  const d = S.drag; if (!d || e.pointerId !== d.pid) return;
  S.drag = null; removerFlutuante(); limparGhost();
  if (d.moved && !cancelado){
    const {gx, gy} = gridDeOrigem(origemFlut(d));
    if (!tentarColocar(d.piece, gx, gy) && !sobreposto(d.piece.formato, gx, gy)) Som.soltar();
  } else if (!d.moved && d.origem === 'reserva' && d.tipo !== 'mouse' && toqueDuplo(d.x0, d.y0)){
    S.sel = d.piece; S.drag = null; S.sel.formato = girar(S.sel.formato); Som.girar(); S.anim = 'giro'; marcarTuto('giro');
  } else if (!d.moved && d.jaSel && d.origem === 'reserva' && d.tipo === 'mouse'){
    S.sel = null;
  }
  renderReserva(); renderDica();
}
window.addEventListener('pointerup', e => fimDrag(e, false));
window.addEventListener('pointercancel', e => fimDrag(e, true));

/* ---- gestos no celular: dois toques giram 90°, deslizar espelha ---- */
let G = null, ULT_TOQUE = null;
const SWIPE_MIN = 34;
function gestoInicio(e, zona, cel){
  if (e.pointerType === 'mouse' || S.venceu) return false;
  G = {id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), zona, cel};
  return true;
}
function toqueDuplo(x, y){
  const a = performance.now(), u = ULT_TOQUE;
  ULT_TOQUE = {t: a, x, y};
  if (u && a - u.t < 380 && Math.hypot(x - u.x, y - u.y) < 46){ ULT_TOQUE = null; return true; }
  return false;
}
document.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' || S.drag || document.querySelector('.ov.on')) return;
  if (e.target.closest('.pw,#board,button,a,input,select,textarea')) return;
  gestoInicio(e, 'fundo');
});
function fimGesto(e, cancelado){
  const g = G; if (!g || e.pointerId !== g.id) return;
  G = null; if (cancelado || S.venceu) return;
  const dx = e.clientX - g.x0, dy = e.clientY - g.y0, dt = performance.now() - g.t0;
  if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 900){
    if (!S.sel){ toast('Toque numa peça para selecionar. Depois, dois toques giram e deslizar espelha.'); return; }
    S.sel.formato = inverter(S.sel.formato);
    Som.flip(); S.anim = 'flip'; marcarTuto('esp'); aposTransformar(); return;
  }
  if (Math.hypot(dx, dy) < 12 && dt < 450){
    if (g.zona === 'tabuleiro' && S.sel){
      const f = S.sel.formato; tentarColocar(S.sel, g.cel.x - Math.floor(f[0].length / 2), g.cel.y - Math.floor(f.length / 2));
    } else if (g.zona === 'fundo' && S.sel && toqueDuplo(e.clientX, e.clientY)){
      S.sel.formato = girar(S.sel.formato); Som.girar(); S.anim = 'giro'; marcarTuto('giro'); aposTransformar();
    }
  }
}
window.addEventListener('pointerup', e => fimGesto(e, false));
window.addEventListener('pointercancel', e => fimGesto(e, true));

/* ---- tutorial dos gestos (só no celular): mostra o que fazer, passo a passo ---- */
let tuto = Object.assign({sel: false, giro: false, esp: false, fim: false}, store.get('tuto', {}));
const TUTO_TXT = {sel: 'Toque numa peça para selecioná-la.', giro: 'Agora dê dois toques rápidos na peça para girá-la.', esp: 'Muito bem! Agora deslize o dedo por aqui, fora da peça, para espelhá-la.'};
const tutoAtivo = () => matchMedia('(pointer:coarse)').matches && !tuto.fim && !S.venceu;
const passoTuto = () => !S.sel ? 'sel' : !tuto.giro ? 'giro' : 'esp';
function marcarTuto(k){
  if (tuto[k]) return;
  tuto[k] = true;
  if (tuto.giro && tuto.esp){ tuto.fim = true; toast('Isso mesmo! Agora é só encaixar as peças no tabuleiro.'); }
  store.set('tuto', tuto);
}
function atualizarTuto(){
  const mao = $('#mao'), pular = $('#tutoPular'); if (!mao) return;
  const ativo = tutoAtivo();
  pular.hidden = !ativo;
  if (S.sel && !tuto.sel){ tuto.sel = true; store.set('tuto', tuto); }
  const alvo = ativo && !S.drag && !document.querySelector('.ov.on') ? document.querySelector(passoTuto() === 'sel' ? '#reserva .pw' : passoTuto() === 'giro' ? '#reserva .pw.sel' : '#dica') : null;
  if (!alvo){ mao.className = ''; mao.dataset.passo = ''; return; }
  const r = alvo.getBoundingClientRect(), passo = passoTuto();
  mao.style.left = (r.left + r.width / 2) + 'px'; mao.style.top = (r.top + r.height / 2) + 'px';
  if (mao.dataset.passo !== passo){ mao.className = ''; void mao.offsetWidth; mao.dataset.passo = passo; }
  mao.className = 'on ' + (passo === 'sel' ? 'toque' : passo === 'giro' ? 'duplo' : 'desliza');
}
$('#tutoPular').onclick = () => { tuto.fim = true; store.set('tuto', tuto); atualizarTuto(); renderDica(); toast('Tudo bem! Você pode rever o tutorial no menu.'); };
$('#btnTuto').onclick = () => { tuto = {sel: false, giro: false, esp: false, fim: false}; store.set('tuto', tuto); fechar('menu'); S.sel = null; renderReserva(); renderDica(); ajustar(); atualizarTuto(); };

/* ---- teclado ---- */
function tirarDaCasa(x, y){
  if (S.venceu || !S.jogo.grade[y][x]) return false;
  const p = remover(S.jogo, x, y);
  if (!p) return false;
  limparDica(); devolver(p); Som.soltar(); anunciar(tr('Peça devolvida.')); renderBoard(); renderReserva(); atualizarGhostHover(); return true;
}
/* cursor do teclado no tabuleiro: funciona como o mouse passando por cima */
function moverCursor(dx, dy){
  const n = S.n, primeira = !S.cursor;
  const c = S.cursor || {x: Math.floor(n / 2), y: Math.floor(n / 2)};
  if (!primeira){ c.x = Math.max(0, Math.min(n - 1, c.x + dx)); c.y = Math.max(0, Math.min(n - 1, c.y + dy)); }
  S.cursor = c;
  document.querySelectorAll('#board .cell.cur').forEach(el => el.classList.remove('cur'));
  cellEl(c.x, c.y).classList.add('cur');
  S.hover = {x: c.x, y: c.y, mouse: true};
  if (document.activeElement !== $('#board') && !(document.activeElement && document.activeElement.classList.contains('pw'))) $('#board').focus({preventScroll: true});
  atualizarGhostHover();
  let msg = descCelula(c.x, c.y);
  if (S.sel && !S.jogo.grade[c.y][c.x]){ const f = S.sel.formato; msg += ' · ' + tr(podeColocar(S.jogo, f, c.x - Math.floor(f[0].length / 2), c.y - Math.floor(f.length / 2)) ? 'a peça cabe aqui' : 'a peça não cabe aqui'); }
  anunciar(msg);
}
function acaoCursor(){
  const c = S.cursor; if (!c){ moverCursor(0, 0); return; }
  if (S.venceu) return;
  if (S.jogo.grade[c.y][c.x]){ tirarDaCasa(c.x, c.y); return; }
  if (!S.sel){ toast('Escolha uma peça primeiro (teclas 1 a 6).'); return; }
  const f = S.sel.formato;
  tentarColocar(S.sel, c.x - Math.floor(f[0].length / 2), c.y - Math.floor(f.length / 2));
}
const SETAS = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};
window.addEventListener('keydown', e => {
  if (e.target.matches('input,textarea,select')) return;
  if (e.key === 'Escape'){ document.querySelectorAll('.ov.on').forEach(o => { if (o.id !== 'ov-splash') o.classList.remove('on'); }); if (S.sel && !S.drag){ S.sel = null; limparGhost(); renderReserva(); renderDica(); } return; }
  if (document.querySelector('.ov.on') || e.ctrlKey || e.metaKey || e.altKey) return;
  if (SETAS[e.key]){ e.preventDefault(); moverCursor(...SETAS[e.key]); return; }
  if ((e.key === 'Enter' || e.key === ' ') && (e.target === document.body || e.target.id === 'board' || (e.target.classList && e.target.classList.contains('pw')))){
    e.preventDefault();
    if (e.target.classList && e.target.classList.contains('pw')){ const q = S.jogo.reserva.find(x => x.uid == e.target.dataset.uid); if (q){ selecionar(q); const w = document.querySelector('#reserva .pw.sel'); if (w) w.focus(); } }
    else acaoCursor();
    return;
  }
  const k = e.key.toLowerCase();
  if (k === 'r') acaoGirar();
  else if (k === 't') acaoFlip();
  else if (k === 'h') acaoDica();
  else if (k === 'z') acaoDesfazer();
  else if (/^[1-6]$/.test(k) && !S.venceu){ const q = visiveis(S.jogo)[+k - 1]; if (q) selecionar(q); }
  else if (k === 'p' && !S.venceu){ const v = visiveis(S.jogo); if (v.length){ selecionar(v[(v.indexOf(S.sel) + 1) % v.length]); } }
  else if (k === 'e' && S.hover) tirarDaCasa(S.hover.x, S.hover.y);
});

