/* ======================= Acessibilidade ======================= */
const A11Y_PADRAO = {dalt: false, cont: matchMedia('(prefers-contrast: more)').matches, texto: false, mov: matchMedia('(prefers-reduced-motion: reduce)').matches};
let a11y = Object.assign({}, A11Y_PADRAO, store.get('a11y', {}));
/* ---- tema ---- */
const TEMAS = ['auto', 'madeira', 'pixel', 'escuro', 'claro', 'oceano', 'floresta', 'poente', 'retro', 'pedra', 'papel'];
const TEMA_PADRAO = 'madeira';
const TEMA_COR = {escuro: '#0c0c12', claro: '#eef0fa', oceano: '#06161f', floresta: '#08150e', poente: '#150a14', retro: '#1f2327', madeira: '#24150b', pixel: '#a8dcf5', pedra: '#1c1f23', papel: '#efe6d3'};
let tema = store.get('tema', TEMA_PADRAO); if (!TEMAS.includes(tema)) tema = TEMA_PADRAO;
const mqClaro = matchMedia('(prefers-color-scheme: light)');
const temaAtivo = () => a11y.cont ? 'escuro' : tema === 'auto' ? (mqClaro.matches ? 'claro' : 'escuro') : tema;
function aplicarTema(){
  const t = temaAtivo();
  document.documentElement.setAttribute('data-tema', t);
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = TEMA_COR[t];
  const nota = $('#temaNota'); if (nota) nota.hidden = !a11y.cont;
}
if (mqClaro.addEventListener) mqClaro.addEventListener('change', () => { if (tema === 'auto') aplicarTema(); });
function aplicarA11y(){
  const b = document.body.classList; aplicarTema();
  b.toggle('dalt', !!a11y.dalt); b.toggle('cont', !!a11y.cont); b.toggle('tg', !!a11y.texto); b.toggle('rm', !!a11y.mov);
  if (window.__pronto) ajustar();
}
let liveT = 0;
function anunciar(msg){
  const l = $('#live'); if (!l) return;
  l.textContent = ''; clearTimeout(liveT); liveT = setTimeout(() => { l.textContent = msg; }, 60);
}
const NOME_COR = {1: 'azul', 6: 'verde', 11: 'rosa', 16: 'amarela'};
const nomeCor = id => tr(NOME_COR[id] || 'azul');
const casasDe = f => f.reduce((a, l) => a + l.reduce((x, v) => x + (v ? 1 : 0), 0), 0);
const descPeca = p => tr('Peça {cor}, {n} casas', {cor: nomeCor(p.id), n: casasDe(p.formato)});
function descCelula(x, y){
  const j = S.jogo, idu = j.grade[y][x], est = j.gab[y][x], par = {y: y + 1, x: x + 1};
  if (idu){ const p = j.mapa.get(idu); par.cor = nomeCor(p ? p.id : 1); if (est) par.est = nomeCor(est); return tr(est ? 'Linha {y}, coluna {x}: peça {cor} sobre a estrela {est}' : 'Linha {y}, coluna {x}: peça {cor}', par); }
  if (est){ par.est = nomeCor(est); return tr('Linha {y}, coluna {x}: vazia, estrela {est}', par); }
  return tr('Linha {y}, coluna {x}: vazia', par);
}
const ICONES = {
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  left:'<path d="M15 5l-7 7 7 7"/>', right:'<path d="M9 5l7 7-7 7"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  download:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  upload:'<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
  trash:'<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',
  play:'<path d="M8 5l11 7-11 7z"/>',
  note:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  noteoff:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/><path d="M3 3l18 18"/>',
  rotate:'<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v5h-5"/>',
  flip:'<path d="M12 3v18" stroke-dasharray="2 3"/><path d="M9 7L4 12l5 5V7z"/><path d="M15 7l5 5-5 5V7z"/>',
  star:'<path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  reset:'<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v5h5"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  code:'<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',
  infinity:'<path d="M12 12c-2-3-3.5-4.5-5.5-4.5a4.5 4.5 0 0 0 0 9c2 0 3.5-1.500 5.500-4.500zm0 0c2 3 3.500 4.500 5.500 4.500a4.500 4.500 0 0 0 0-9c-2 0-3.500 1.500-5.500 4.500z"/>',
  home:'<path d="M4 11l8-7 8 7M6 10v10h12V10"/>',
  stats:'<path d="M5 20V11M12 20V4M19 20v-7"/>',
  qr:'<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  calendar:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  swap:'<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  grid:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 12h16M12 4v16"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H4v1a3 3 0 0 0 3 3M16 6h4v1a3 3 0 0 1-3 3M12 13v4M8 20h8"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  chat:'<path d="M4 5h16v11H9l-5 4V5z"/>',
  dots:'<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  send:'<path d="M21 3L3 11l7 3 3 7 8-18z"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'
};
const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n]}</svg>`;
function pintarIcones(raiz = document){
  raiz.querySelectorAll('[data-i]').forEach(b => { if (!b.dataset.ok){ b.insertAdjacentHTML('afterbegin', ic(b.dataset.i)); b.dataset.ok = 1; } });
}
let toastT = 0;
function toast(msg){
  const el = $('#toast'); el.textContent = tr(msg); el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600);
}
let ordemOv = 0;
/* Diálogos: ao abrir, o foco vai para dentro dele e o fundo fica inerte; ao fechar, o foco volta para onde estava. */
function prepararDialogos(){
  document.querySelectorAll('.ov').forEach(o => {
    const card = o.querySelector('.card'); if (!card) return;
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true');
    const h = card.querySelector('h1'); if (h){ h.id = h.id || 'h-' + o.id; card.setAttribute('aria-labelledby', h.id); }
  });
  let abertos = new Set();
  const sinc = () => {
    const agora = new Set([...document.querySelectorAll('.ov.on')]);
    let novo = null;
    agora.forEach(o => { if (!abertos.has(o)){ o._foco = document.activeElement; o._ordem = ++ordemOv; novo = o; } });
    $('#app').inert = agora.size > 0;
    if (novo){
      requestAnimationFrame(() => { const card = novo.querySelector('.card'); const alvo = card && (card.querySelector('[data-close]') || card.querySelector('button:not([hidden]):not([disabled])')); if (alvo) alvo.focus({preventScroll: true}); else if (card){ card.tabIndex = -1; card.focus({preventScroll: true}); } });
    } else if (!agora.size){
      abertos.forEach(o => { if (!agora.has(o) && o._foco && o._foco.isConnected && o._foco !== document.body){ try{ o._foco.focus({preventScroll: true}); }catch(e){} } });
    }
    abertos = agora;
  };
  const obs = new MutationObserver(sinc);
  document.querySelectorAll('.ov').forEach(o => obs.observe(o, {attributes: true, attributeFilter: ['class']}));
  sinc();
}
const abrir = id => { $('#ov-' + id).classList.add('on'); if (window.atualizarTuto) atualizarTuto(); };
const fechar = id => { $('#ov-' + id).classList.remove('on'); if (window.atualizarTuto) atualizarTuto(); };
const fmtTempo = ms => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const qtd = (n, um, varios) => tr(n + (n === 1 ? um : varios));   /* "1 dia" / "3 dias" */
const fmtJog = n => qtd(n, ' jogada', ' jogadas');
const pad2 = n => String(n).padStart(2, '0');
const fmtData = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
const dataHoje = () => fmtData(new Date());
const dataCurta = iso => iso.slice(8, 10) + '/' + iso.slice(5, 7);

function pecaEl(formato, id, tam){
  const el = mk('div', 'pg ' + tam);
  el.style.setProperty('--w', formato[0].length);
  for (const linha of formato) for (const v of linha){
    const c = mk('div', 'pc' + (v ? '' : ' e'));
    c.style.setProperty('--c', COR[id]); if (v) c.dataset.s = id;
    el.appendChild(c);
  }
  return el;
}

