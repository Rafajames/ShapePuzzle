/* ---- editor ---- */
const E = {grid: Array.from({length: TAM}, () => Array(TAM).fill(0)), cor: 1, modo: null};
function montarEditor(){
  const pal = $('#pal'); pal.innerHTML = '';
  for (const id of CORES_IDS){
    const b = mk('button', 'sw' + (E.cor === id ? ' on' : '')); b.style.setProperty('--c', COR[id]);
    b.setAttribute('aria-label', tr('Cor') + ' ' + nomeCor(id)); b.dataset.s = id; b.onclick = () => { E.cor = id; montarEditor(); }; pal.appendChild(b);
  }
  const b = $('#edBoard');
  if (!b.children.length) for (let i = 0; i < TAM * TAM; i++){ const c = mk('div', 'cell'); c.innerHTML = '<div class="fill"></div>'; b.appendChild(c); }
  renderEditor();
}
function renderEditor(){
  const b = $('#edBoard'); let n = 0;
  for (let y = 0; y < TAM; y++) for (let x = 0; x < TAM; x++){
    const f = b.children[y * TAM + x].firstChild, v = E.grid[y][x];
    if (v){ f.style.display = 'block'; f.style.setProperty('--c', COR[v]); f.dataset.s = v; n++; } else f.style.display = 'none';
  }
  const info = $('#edInfo'), faltam = TAM * TAM - n;
  info.className = faltam ? '' : 'ok';
  info.textContent = tr(faltam ? `Faltam ${faltam} casas para preencher` : 'Tabuleiro completo — pronto para salvar ou testar');
  ['#edSalvar', '#edTestar', '#edExportar', '#edCompartilhar'].forEach(s => $(s).disabled = faltam > 0);
}
function abrirEditor(){ montarEditor(); abrir('editor'); }
function celulaEditor(cx, cy){
  const el = document.elementFromPoint(cx, cy), b = $('#edBoard');
  if (!el) return null; const c = el.closest('.cell'); if (!c || !b.contains(c)) return null;
  const i = [...b.children].indexOf(c); return {x: i % TAM, y: Math.floor(i / TAM)};
}
function pintar(c){
  if (!c) return;
  const novo = E.modo === 'pintar' ? E.cor : 0;
  if (E.grid[c.y][c.x] !== novo){ E.grid[c.y][c.x] = novo; renderEditor(); }
}
$('#edBoard').addEventListener('pointerdown', e => {
  const c = celulaEditor(e.clientX, e.clientY); if (!c) return;
  e.preventDefault();
  E.modo = E.grid[c.y][c.x] === 0 ? 'pintar' : 'apagar'; E.pid = e.pointerId; pintar(c);
});
window.addEventListener('pointermove', e => { if (E.modo && e.pointerId === E.pid) pintar(celulaEditor(e.clientX, e.clientY)); });
['pointerup', 'pointercancel'].forEach(t => window.addEventListener(t, () => { E.modo = null; }));
const edTexto = () => gerarTexto(E.grid, parseInt($('#edDif').value, 10));
const edNome = () => ($('#edNome').value.trim().replace(/[\\/:*?"<>|]/g, '') || 'minha-fase').slice(0, 30);
$('#edLimpar').onclick = () => { E.grid = Array.from({length: TAM}, () => Array(TAM).fill(0)); renderEditor(); };
$('#edSalvar').onclick = () => { salvarCustom(edNome(), edTexto()); toast('Fase "' + edNome() + '" salva em Minhas fases'); };
$('#edExportar').onclick = () => baixar(edNome(), edTexto());
$('#edCompartilhar').onclick = () => compartilhar('Shape Puzzle', `Tente a fase "${edNome()}" que eu criei no Shape Puzzle!`, urlFase(edTexto(), edNome()));
$('#edTestar').onclick = () => { fechar('editor'); carregar({k: 't', nome: edNome(), text: edTexto()}); };

