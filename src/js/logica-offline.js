/* ---- Campeonato sem internet por QR code: lógica pura (testada em Node) ----
   Tudo viaja dentro do próprio link/QR. Um "pacote" é o campeonato (nome, fases, jogadores) mais os resultados que já se tem:
   {v: 1, i: código, n: nome, f: [fases], j: [nomes], r: {"0": [[tempoMs, jogadas] | null, ...]}}
   Uma fase é ['b', número da fase do jogo] ou ['g', 'facil'|'medio'|'dificil'|'mestre', semente] (o jogo gera a mesma fase em qualquer aparelho). */
function b64u(s){ return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function deb64u(s){ s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
const OFF_MAX_J = 12, OFF_MAX_F = 8, OFF_NIVEIS = ['facil', 'medio', 'dificil', 'mestre'], OFF_CRESCENTE = ['facil', 'medio', 'dificil'];
const defOff = p => JSON.stringify([p.n, p.f, p.j]);
function limparOff(p, nBuiltin = 999){
  if (!isObj(p) || p.v !== 1) return {erro: 'Esse código é de uma versão que este jogo não conhece. Atualize o jogo e tente de novo.'};
  const nome = limparNome(String(p.n || '').slice(0, 40)), id = String(p.i || '');
  if (!codigoValido(id) || nome.length < 2) return {erro: 'Esse código não parece ser de um campeonato do Shape Puzzle.'};
  if (!Array.isArray(p.j) || p.j.length < 2 || p.j.length > OFF_MAX_J) return {erro: 'O campeonato precisa de 2 a ' + OFF_MAX_J + ' jogadores.'};
  const j = p.j.map(limparNome), vistos = new Set(j.map(normalizarNome));
  if (j.some(x => !nomeValido(x)) || vistos.size !== j.length) return {erro: 'Os nomes dos jogadores estão repetidos ou inválidos.'};
  if (!Array.isArray(p.f) || p.f.length < 1 || p.f.length > OFF_MAX_F) return {erro: 'O campeonato precisa de 1 a ' + OFF_MAX_F + ' fases.'};
  const f = [];
  for (const x of p.f){
    if (Array.isArray(x) && x[0] === 'b' && Number.isInteger(x[1]) && x[1] >= 0 && x[1] < nBuiltin) f.push(['b', x[1]]);
    else if (Array.isArray(x) && x[0] === 'g' && OFF_NIVEIS.includes(x[1]) && Number.isInteger(x[2]) && x[2] >= 1 && x[2] <= 999999999) f.push(['g', x[1], x[2]]);
    else return {erro: 'Uma das fases desse campeonato é inválida.'};
  }
  const r = {};
  if (isObj(p.r)) for (const k of Object.keys(p.r)){
    const i = +k; if (!Number.isInteger(i) || i < 0 || i >= j.length || !Array.isArray(p.r[k])) continue;
    const lin = f.map((_, n) => { const x = p.r[k][n]; return Array.isArray(x) && x[0] > 0 && x[1] > 0 ? [inteiro(x[0], 1, 864e5), inteiro(x[1], 1, 99999)] : null; });
    if (lin.some(Boolean)) r[i] = lin;
  }
  return {pacote: {v: 1, i: id, n: nome, f, j, r}};
}
/* código: SPO1.<pacote em base64>.<soma de verificação> (a soma só percebe cópia cortada ou estragada; não impede trapaça) */
function codigoOff(p){ const c = b64u(JSON.stringify({v: 1, i: p.i, n: p.n, f: p.f, j: p.j, r: p.r || {}})); return 'SPO1.' + c + '.' + somaTexto(c); }
/* Aceita o código puro, o link inteiro (com #o=...&eu=2) ou texto com o código no meio. Devolve {pacote, eu} ou {erro}. */
function lerCodigoOff(txt, nBuiltin){
  const t = String(txt || '').replace(/\s+/g, ''), m = /SPO1\.([A-Za-z0-9_-]{10,20000})\.([0-9a-f]{8})/.exec(t);
  if (!m) return {erro: !t ? 'Cole o código ou o link primeiro.' : t.includes('SPO1.') ? 'O código está incompleto ou foi alterado. Copie de novo, inteiro.' : 'Isso não parece um código de campeonato do Shape Puzzle.'};
  if (somaTexto(m[1]) !== m[2]) return {erro: 'O código está incompleto ou foi alterado. Copie de novo, inteiro.'};
  let obj; try{ obj = JSON.parse(deb64u(m[1])); }catch(e){ return {erro: 'O código está incompleto ou foi alterado. Copie de novo, inteiro.'}; }
  const r = limparOff(obj, nBuiltin); if (r.erro) return r;
  const e = /[#&?]eu=(\d{1,2})(?![\d])/.exec(String(txt || ''));
  return {pacote: r.pacote, eu: e && +e[1] < r.pacote.j.length ? +e[1] : null};
}
/* Junta os resultados de b em a (mesmo campeonato): em caso de conflito fica o melhor tempo. Devolve null se não for o mesmo campeonato. */
function juntarOff(a, b){
  if (a.i !== b.i || defOff(a) !== defOff(b)) return null;
  const r = JSON.parse(JSON.stringify(a.r || {}));
  for (const k of Object.keys(b.r || {})){
    const x = r[k] = r[k] || b.f.map(() => null);
    b.r[k].forEach((y, n) => { if (y && (!x[n] || y[0] < x[n][0])) x[n] = y; });
  }
  return Object.assign({}, a, {r});
}
/* Ranking: quem terminou todas as fases vem primeiro (menor tempo total, depois menos jogadas); depois quem fez mais fases. */
function rankOff(p){
  const lin = p.j.map((nome, idx) => { const r = p.r[idx] || [], fei = r.filter(Boolean);
    return {idx, nome, feitas: fei.length, t: fei.reduce((a, x) => a + x[0], 0), jog: fei.reduce((a, x) => a + x[1], 0), completo: fei.length === p.f.length}; });
  lin.sort((a, b) => b.feitas - a.feitas || a.t - b.t || a.jog - b.jog || a.idx - b.idx);
  let pos = 0, ant = null;
  lin.forEach((l, i) => {
    if (!l.feitas){ l.pos = 0; return; }
    if (!ant || ant.feitas !== l.feitas || ant.t !== l.t || ant.jog !== l.jog) pos = i + 1;
    l.pos = pos; ant = l;
  });
  return lin;
}
function estatOff(p){
  const porFase = p.f.map((_, i) => {
    const xs = p.j.map((nome, idx) => ({idx, nome, x: (p.r[idx] || [])[i]})).filter(o => o.x).map(o => ({idx: o.idx, nome: o.nome, t: o.x[0], jog: o.x[1]}));
    xs.sort((a, b) => a.t - b.t || a.jog - b.jog);
    return {i, n: xs.length, lista: xs, melhor: xs[0] || null, media: xs.length ? Math.round(xs.reduce((a, o) => a + o.t, 0) / xs.length) : 0};
  });
  const com = porFase.filter(f => f.n);
  const rk = rankOff(p);
  return {porFase, jogadores: p.j.length, terminaram: rk.filter(l => l.completo).length, comResultado: rk.filter(l => l.feitas).length,
    maisRapida: com.length ? com.reduce((a, f) => f.media < a.media ? f : a) : null, maisDificil: com.length > 1 ? com.reduce((a, f) => f.media > a.media ? f : a) : null,
    tempoTotal: rk.reduce((a, l) => a + l.t, 0), jogadasTotal: rk.reduce((a, l) => a + l.jog, 0)};
}
