/* ---- Sequências de dias da fase do dia (lógica pura) ---- */
const diaNum = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000) : NaN; };
/* Sequência de números seguidos (dias ou semanas): a atual (que ainda vale se o de hoje não foi jogado) e a maior de todas. */
function sequenciaNum(lista, hoje){
  const nums = lista.filter(n => !isNaN(n)).sort((a, b) => a - b);
  let maior = 0, run = 0, ant = null;
  for (const n of nums){ run = ant !== null && n === ant + 1 ? run + 1 : 1; ant = n; if (run > maior) maior = run; }
  const set = new Set(nums); let d = hoje, atual = 0;
  if (!isNaN(d)){ if (!set.has(d)) d--; while (set.has(d)){ atual++; d--; } }
  return {atual, maior};
}
const sequenciasDe = (dias, hoje) => sequenciaNum(Object.keys(dias || {}).map(diaNum), diaNum(hoje));
/* Semanas (segunda a domingo), no formato ISO "2026-W45". */
const semanaIdx = data => Math.floor((diaNum(data) + 3) / 7);   /* nº da semana desde 1970; o dia 0 era uma quinta */
function semanaDe(data){
  const d = diaNum(data); if (isNaN(d)) return '';
  const quinta = d - ((d + 3) % 7) + 3, ano = new Date(quinta * 86400000).getUTCFullYear();
  return ano + '-W' + String(Math.floor((quinta - Math.round(Date.UTC(ano, 0, 1) / 86400000)) / 7) + 1).padStart(2, '0');
}
/* Segunda-feira de uma semana "2026-W45" (como AAAA-MM-DD). */
function segundaDe(chave){
  const m = /^(\d{4})-W(\d{2})$/.exec(chave || ''); if (!m) return '';
  const jan4 = Math.round(Date.UTC(+m[1], 0, 4) / 86400000), seg = jan4 - ((jan4 + 3) % 7) + (+m[2] - 1) * 7;
  return new Date(seg * 86400000).toISOString().slice(0, 10);
}
const sequenciasSemanas = (sem, hoje) => sequenciaNum(Object.keys(sem || {}).map(k => semanaIdx(segundaDe(k))), semanaIdx(hoje));

/* ---- Backup do progresso (lógica pura: validar, resumir e juntar) ---- */
const BK_NIVEIS = ['crescente', 'facil', 'medio', 'dificil', 'mestre'];
const BK_HUMORES = ['auto', 'tema', 'calma', 'animada', 'noturna', 'noite', 'manha', 'mare', 'mata', 'entardecer', 'chip', 'madeira', 'pixel'];
const BK_TEMAS = ['auto', 'escuro', 'claro', 'oceano', 'floresta', 'poente', 'retro', 'madeira', 'pixel'];
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
const inteiro = (v, min, max) => { v = Math.round(+v); return isFinite(v) ? Math.min(max, Math.max(min, v)) : min; };
function limparBackup(env){
  if (!isObj(env) || env.app !== 'shapepuzzle' || !isObj(env.dados)) return {erro: 'Isso não parece um backup do Shape Puzzle.'};
  if (env.v !== 1) return {erro: 'Esse backup é de uma versão que este jogo não conhece. Atualize o jogo e tente de novo.'};
  const d = env.dados, o = {};
  if (isObj(d.prog)){ const done = Array.isArray(d.prog.done) ? [...new Set(d.prog.done.map(v => inteiro(v, 0, 999)))].sort((a, b) => a - b) : [];
    o.prog = {max: inteiro(d.prog.max, 0, 999), done}; }
  if (isObj(d.est)){ o.est = {}; for (const k of Object.keys(d.est)) if (/^\d{1,3}$/.test(k) && d.est[k] >= 1) o.est[k] = inteiro(d.est[k], 1, 3); }
  if (isObj(d.rec)){ o.rec = {}; for (const k of Object.keys(d.rec)){ const r = d.rec[k];
    if (/^[bcds]:.{1,40}$/.test(k) && isObj(r) && r.t > 0 && r.j > 0) o.rec[k] = {t: inteiro(r.t, 1, 864e7), j: inteiro(r.j, 1, 99999)}; } }
  if (isObj(d.dias)){ o.dias = {}; for (const k of Object.keys(d.dias)){ const r = d.dias[k];
    if (!isNaN(diaNum(k)) && isObj(r) && r.t > 0) o.dias[k] = {t: inteiro(r.t, 1, 864e7), j: inteiro(r.j, 0, 99999), d: inteiro(r.d, 0, 999)}; } }
  if (isObj(d.sem)){ o.sem = {}; for (const k of Object.keys(d.sem)){ const r = d.sem[k];
    if (/^\d{4}-W\d{2}$/.test(k) && isObj(r) && r.t > 0) o.sem[k] = {t: inteiro(r.t, 1, 864e7), j: inteiro(r.j, 0, 99999), d: inteiro(r.d, 0, 999)}; } }
  if (isObj(d.corr)) o.corr = {melhor: inteiro(d.corr.melhor, 0, 1e5), jogos: inteiro(d.corr.jogos, 0, 1e7), total: inteiro(d.corr.total, 0, 1e8)};
  if (Array.isArray(d.custom)){ o.custom = []; const vistos = new Set();
    for (const f of d.custom.slice(0, 100)){
      if (!isObj(f) || typeof f.text !== 'string' || typeof f.nome !== 'string' || f.text.length > 3000 || vistos.has(f.text)) continue;
      let ok = false; try{ ok = faseValida(f.text); }catch(e){}
      const nome = f.nome.replace(/[<>]/g, '').trim().slice(0, 30);
      if (ok && nome){ vistos.add(f.text); o.custom.push({nome, text: f.text}); } } }
  if (isObj(d.stats)){ const s = d.stats, n = k => inteiro(s[k], 0, 1e13);
    o.stats = {tempo: n('tempo'), vitorias: n('vitorias'), jogadas: n('jogadas'), dicas: n('dicas'), solucoes: n('solucoes'), desde: n('desde')}; }
  if (isObj(d.inf)){ o.inf = {feitas: {}, porNivel: {}};
    for (const k of BK_NIVEIS){
      if (isObj(d.inf.feitas) && d.inf.feitas[k] > 0) o.inf.feitas[k] = inteiro(d.inf.feitas[k], 0, 1e7);
      const p = isObj(d.inf.porNivel) ? d.inf.porNivel[k] : null;
      if (isObj(p) && k !== 'crescente') o.inf.porNivel[k] = {n: inteiro(p.n, 0, 1e7), t: inteiro(p.t, 0, 864e7), est: inteiro(p.est, 0, 1e8), e3: inteiro(p.e3, 0, 1e7)}; } }
  if (isObj(d.cart)) o.cart = limparCart(d.cart);
  if (isObj(d.cfg)){ const c = d.cfg, q = {};
    if (['pt', 'en', 'es'].includes(c.lang)) q.lang = c.lang;
    if (BK_TEMAS.includes(c.tema)) q.tema = c.tema;
    if (isObj(c.a11y)){ q.a11y = {}; for (const k of ['dalt', 'cont', 'texto', 'mov']) if (typeof c.a11y[k] === 'boolean') q.a11y[k] = c.a11y[k]; }
    if (BK_HUMORES.includes(c.humor)) q.humor = c.humor;
    if (c.pecas === 'auto' || (c.pecas >= 1 && c.pecas <= 99)) q.pecas = c.pecas === 'auto' ? 'auto' : inteiro(c.pecas, 1, 99);
    for (const k of ['vibra', 'musica', 'sfx']) if (typeof c[k] === 'boolean') q[k] = c[k];
    if (typeof c.vol === 'number' && c.vol >= 0 && c.vol <= 1) q.vol = c.vol;
    o.cfg = q; }
  const cheio = (o.prog && (o.prog.max > 0 || o.prog.done.length)) || (o.est && Object.keys(o.est).length) || (o.rec && Object.keys(o.rec).length) || (o.dias && Object.keys(o.dias).length) || (o.sem && Object.keys(o.sem).length) || (o.corr && o.corr.jogos > 0)
    || (o.custom && o.custom.length) || (o.stats && Object.values(o.stats).some(v => v > 0)) || (o.inf && (Object.keys(o.inf.feitas).length || Object.keys(o.inf.porNivel).length));
  if (!cheio) return {erro: 'Esse backup está vazio.'};
  return {dados: o, criado: typeof env.criado === 'string' ? env.criado.slice(0, 10) : ''};
}
function resumoBackup(d){
  const inf = d.inf ? Object.values(d.inf.feitas || {}).reduce((a, b) => Math.max(a, b), 0) : 0;
  return {fases: d.prog ? d.prog.done.length : 0, estrelas: d.est ? Object.values(d.est).reduce((a, b) => a + b, 0) : 0,
    recordes: d.rec ? Object.keys(d.rec).length : 0, dias: d.dias ? Object.keys(d.dias).length : 0, semanas: d.sem ? Object.keys(d.sem).length : 0,
    criadas: d.custom ? d.custom.length : 0, infinito: inf};
}
/* Junta o que já existe (a) com o do backup (b): fica o melhor dos dois. Os ajustes (cfg) de (a) não mudam. */
function juntarDados(a, b){
  const o = JSON.parse(JSON.stringify(a || {}));
  if (b.prog){ const p = o.prog || {max: 0, done: []}; p.max = Math.max(p.max, b.prog.max); p.done = [...new Set([...p.done, ...b.prog.done])].sort((x, y) => x - y); o.prog = p; }
  if (b.est){ o.est = o.est || {}; for (const k of Object.keys(b.est)) o.est[k] = Math.max(o.est[k] || 0, b.est[k]); }
  if (b.rec){ o.rec = o.rec || {}; for (const k of Object.keys(b.rec)){ const x = o.rec[k], y = b.rec[k]; o.rec[k] = x ? {t: Math.min(x.t, y.t), j: Math.min(x.j, y.j)} : {t: y.t, j: y.j}; } }
  if (b.dias){ o.dias = o.dias || {}; for (const k of Object.keys(b.dias)){ const x = o.dias[k], y = b.dias[k]; if (!x || y.t < x.t) o.dias[k] = {t: y.t, j: y.j, d: y.d}; } }
  if (b.sem){ o.sem = o.sem || {}; for (const k of Object.keys(b.sem)){ const x = o.sem[k], y = b.sem[k]; if (!x || y.t < x.t) o.sem[k] = {t: y.t, j: y.j, d: y.d}; } }
  if (b.corr){ const x = o.corr || {melhor: 0, jogos: 0, total: 0}; o.corr = {melhor: Math.max(x.melhor, b.corr.melhor), jogos: Math.max(x.jogos, b.corr.jogos), total: Math.max(x.total, b.corr.total)}; }
  if (b.custom){ o.custom = o.custom || []; const textos = new Set(o.custom.map(f => f.text)), nomes = new Set(o.custom.map(f => f.nome));
    for (const f of b.custom){ if (textos.has(f.text)) continue; let nome = f.nome, i = 2; while (nomes.has(nome)) nome = f.nome.slice(0, 26) + ' (' + (i++) + ')';
      nomes.add(nome); textos.add(f.text); o.custom.push({nome, text: f.text}); } }
  if (b.stats){ const x = o.stats || {tempo: 0, vitorias: 0, jogadas: 0, dicas: 0, solucoes: 0, desde: 0}, y = b.stats;
    o.stats = {tempo: Math.max(x.tempo, y.tempo), vitorias: Math.max(x.vitorias, y.vitorias), jogadas: Math.max(x.jogadas, y.jogadas), dicas: Math.max(x.dicas, y.dicas),
      solucoes: Math.max(x.solucoes, y.solucoes), desde: x.desde && y.desde ? Math.min(x.desde, y.desde) : (x.desde || y.desde)}; }
  if (b.inf){ const x = o.inf || {feitas: {}, porNivel: {}};
    for (const k of Object.keys(b.inf.feitas)) x.feitas[k] = Math.max(x.feitas[k] || 0, b.inf.feitas[k]);
    for (const k of Object.keys(b.inf.porNivel)){ const p = x.porNivel[k], q = b.inf.porNivel[k];
      x.porNivel[k] = p ? {n: Math.max(p.n, q.n), t: p.t && q.t ? Math.min(p.t, q.t) : (p.t || q.t), est: Math.max(p.est, q.est), e3: Math.max(p.e3, q.e3)} : q; }
    o.inf = x; }
  if (b.cart) o.cart = juntarCart(o.cart, b.cart);
  return o;
}
/* Soma de verificação simples (FNV-1a) para perceber um código copiado pela metade. */
function somaTexto(t){ let h = 0x811c9dc5; for (let i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); }
