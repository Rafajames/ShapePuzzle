/* ======================= Fase em andamento: guardada para continuar depois ======================= */
/* Guarda onde cada peça está, o tempo e as jogadas. Ao abrir o jogo de novo, a fase volta como estava. Campeonato e corrida não entram. */
const ANDA_TIPOS = ['b', 'c', 'd', 's', 'i', 'n'];
function dadosAndamento(){
  const c = S.cur, j = S.jogo;
  if (!c || !j) return undefined;
  if (!ANDA_TIPOS.includes(c.k)) return undefined;            /* outro tipo de jogo: não mexe no que já estava guardado */
  const postas = S.hist.filter(i => j.mapa.has(i));
  if (S.venceu || !postas.length) return null;
  const pos = postas.map(i => {
    const p = j.mapa.get(i), f0 = p.formato.findIndex(l => l.some(Boolean)), k0 = p.formato[f0].findIndex(Boolean);
    let y0 = -1, x0 = -1;
    for (let r = 0; r < j.n && y0 < 0; r++) for (let q = 0; q < j.n; q++) if (j.grade[r][q] === i){ y0 = r; x0 = q; break; }
    return {o: p.ord, f: p.formato, x: x0 - k0, y: y0 - f0};
  });
  return {v: 1, cur: c, h: somaTexto(faseDe(c).text), jog: S.jog, dicas: S.dicas, acum: Math.round(S.t.acum), sol: S.solVista, pos,
    res: j.reserva.map(p => [p.ord, p.formato]), sel: S.sel ? S.sel.ord : -1};
}
let andaSig = '';
function guardarAndamento(forcar){
  if (restaurando) return;
  const d = dadosAndamento(); if (d === undefined) return;
  const sig = d ? JSON.stringify(Object.assign({}, d, {acum: 0})) : '';
  if (sig === andaSig && !forcar) return;
  andaSig = sig; store.set('andamento', d);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) guardarAndamento(true); });
addEventListener('pagehide', () => guardarAndamento(true));

function lerAndamento(){
  const a = store.get('andamento', null);
  if (!isObj(a) || a.v !== 1 || !isObj(a.cur) || !ANDA_TIPOS.includes(a.cur.k) || !Array.isArray(a.pos) || !Array.isArray(a.res)) return null;
  let f = null; try{ f = faseDe(a.cur); }catch(e){}
  if (!f || typeof f.text !== 'string' || somaTexto(f.text) !== a.h) return null;      /* a fase mudou (ou foi apagada) */
  if (a.cur.k === 'd' && a.cur.data !== dataHoje()) return null;                     /* fase do dia de ontem */
  if (a.cur.k === 's' && a.cur.semana !== semanaDe(dataHoje())) return null;
  return a;
}
/* Recoloca as peças na fase recém-carregada. Se algo não bater, recomeça a fase do zero. */
function retomarAndamento(a){
  const j = S.jogo; S.hist = [];
  try{
    for (const q of a.pos){
      const p = j.reserva.find(r => r.ord === q.o);
      if (!p || !Array.isArray(q.f)) throw 0;
      p.formato = q.f;
      if (!podeColocar(j, p.formato, q.x, q.y)) throw 0;
      S.hist.push(colocar(j, p, q.x, q.y));
    }
    const ordem = a.res.map(([o, f]) => { const p = j.reserva.find(r => r.ord === o); if (!p) throw 0; p.formato = f; return p; });
    if (ordem.length !== j.reserva.length) throw 0;
    j.reserva = ordem;
  }catch(e){ carregar(S.cur); return false; }
  S.ultimaIdu = S.hist[S.hist.length - 1] || 0; S.jog = a.jog | 0; S.dicas = a.dicas | 0; S.t.acum = a.acum || 0; S.solVista = !!a.sol;
  S.sel = j.reserva.find(r => r.ord === a.sel) || (j.fila === 1 ? j.reserva[0] || null : null);
  andaSig = ''; renderTudo(); ajustar(); atualizarTuto();
  return true;
}
