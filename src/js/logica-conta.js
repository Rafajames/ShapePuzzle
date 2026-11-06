/* ---- Estrelas, itens e conquistas da conta (lógica pura: roda no navegador e nos testes) ----
   O saldo nunca é guardado: sai das estrelas das fases + bônus (fase do dia, desafio da semana) + conquistas resgatadas
   + ganhos avulsos (anúncios premiados) − o que foi gasto. Só o que não dá para recalcular fica na "carteira":
   cart = {g: ganhos avulsos {chave: estrelas}, s: gastos {chave: estrelas}, v: conquistas já resgatadas}. */
const BONUS_DIA = 2, BONUS_SEMANA = 5, NOME_CUSTO = 30, BONUS_CAMP_SEMANA = 10;
/* Itens: 'av:pN' / 'av:aN' (avatar), 'mold:id' (moldura) e 'fun:id' (fundo do avatar).
   Cada item tem uma categoria. A categoria define o preço em estrelas e o bônus que o item dá, equipado, a cada fase vencida.
   comum = todo mundo tem; conq = só por conquista (sem preço). */
const CATEGORIAS = ['comum', 'raro', 'epico', 'lendario'];
const PRECO_CAT = {raro: 20, epico: 50, lendario: 120};
const BONUS_CAT = {comum: 0, raro: 1, epico: 2, lendario: 3};
const BONUS_DIA_MAX = 30;      /* teto diário do bônus dos itens (repetir fase fácil não vira fábrica de estrelas) */
const N_AV_P = 24, N_AV_A = 12;
const ITENS = {};
const item = (chave, cat, conq) => { ITENS[chave] = cat === 'comum' ? {cat, livre: true} : conq ? {cat, conq: true} : {cat, preco: PRECO_CAT[cat]}; };
for (let i = 1; i <= N_AV_P; i++) item('av:p' + i, i <= 6 ? 'comum' : i <= 14 ? 'raro' : i <= 18 ? 'epico' : {19: 'raro', 20: 'raro', 21: 'raro', 22: 'epico', 23: 'lendario', 24: 'epico'}[i], i >= 19);
for (let i = 1; i <= N_AV_A; i++) item('av:a' + i, i <= 4 ? 'raro' : i <= 8 ? 'epico' : 'lendario');
[['', 'comum'], ['madeira', 'comum'], ['pixel', 'raro'], ['festa', 'raro'], ['marmore', 'raro'], ['metal', 'raro'], ['neon', 'epico'], ['cristal', 'epico'], ['lava', 'epico'],
 ['galaxia', 'lendario'], ['ouro', 'lendario'], ['gelo', 'epico', 1], ['fogo', 'epico', 1], ['arco', 'lendario', 1]].forEach(([id, cat, q]) => item('mold:' + id, cat, q));
[['', 'comum'], ['listras', 'comum'], ['bolinhas', 'comum'], ['xadrez', 'raro'], ['diagonal', 'raro'], ['ceu', 'raro'], ['estrelas', 'epico'], ['aurora', 'epico'],
 ['oceano', 'epico'], ['cosmos', 'lendario'], ['dourado', 'lendario']].forEach(([id, cat]) => item('fun:' + id, cat));
const catItem = chave => (ITENS[chave] || {}).cat || 'comum';
/* bônus por fase vencida com o visual equipado ({av, mold, fun}) */
const bonusEquipado = e => !e ? 0 : BONUS_CAT[catItem('av:' + (e.av || ''))] + BONUS_CAT[catItem('mold:' + (e.mold || ''))] + BONUS_CAT[catItem('fun:' + (e.fun || ''))];
/* soma o bônus de uma vitória na carteira (chave do dia), respeitando o teto diário; só vale para itens que a pessoa tem */
function bonusVitoria(d, e, hoje){
  const donos = itensDe(d), eq = {
    av: donos.has('av:' + (e && e.av)) ? e.av : '', mold: donos.has('mold:' + (e && e.mold || '')) ? e.mold : '', fun: donos.has('fun:' + (e && e.fun || '')) ? e.fun : ''};
  const b = bonusEquipado(eq), c = cartDe(d), k = 'b:' + hoje, ja = c.g[k] || 0, ganho = Math.max(0, Math.min(b, BONUS_DIA_MAX - ja));
  if (ganho) c.g[k] = ja + ganho;
  return {cart: c, ganho, teto: ja + ganho >= BONUS_DIA_MAX};
}
/* m = o que se mede; n = quanto precisa; est = estrelas de prêmio; item = avatar ou moldura que libera */
const CONQUISTAS = [
  {id: 'fases5', m: 'fases', n: 5, est: 5}, {id: 'fases10', m: 'fases', n: 10, est: 10, item: 'av:p21'}, {id: 'fases25', m: 'fases', n: 25, est: 20},
  {id: 'fases50', m: 'fases', n: 50, est: 40, item: 'av:p24'}, {id: 'fases100', m: 'fases', n: 100, est: 80, item: 'mold:arco'},
  {id: 'estr30', m: 'estrelas', n: 30, est: 5}, {id: 'estr100', m: 'estrelas', n: 100, est: 15, item: 'mold:fogo'}, {id: 'estr300', m: 'estrelas', n: 300, est: 40, item: 'av:p23'},
  {id: 'seq3', m: 'seq', n: 3, est: 5}, {id: 'seq7', m: 'seq', n: 7, est: 15, item: 'mold:gelo'}, {id: 'seq30', m: 'seq', n: 30, est: 60},
  {id: 'dia1', m: 'dias', n: 1, est: 3, item: 'av:p19'}, {id: 'sem1', m: 'sem', n: 1, est: 8, item: 'av:p20'}, {id: 'inf10', m: 'inf', n: 10, est: 10, item: 'av:p22'}
];
const cartDe = d => { const c = d && d.cart || {}; return {g: Object.assign({}, c.g), s: Object.assign({}, c.s), v: Array.isArray(c.v) ? c.v.slice() : []}; };
const somaVals = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
const somaPref = (o, p) => Object.keys(o || {}).filter(k => k.startsWith(p)).reduce((a, k) => a + o[k], 0);
function medidasConta(d, hoje){
  d = d || {};
  return {fases: d.prog ? d.prog.done.length : 0, estrelas: somaVals(d.est), seq: sequenciasDe(d.dias, hoje || '').maior, dias: d.dias ? Object.keys(d.dias).length : 0,
    sem: d.sem ? Object.keys(d.sem).length : 0, inf: d.inf ? somaVals(d.inf.feitas) : 0};
}
function saldoConta(d){
  const c = cartDe(d), m = medidasConta(d);
  const conq = CONQUISTAS.filter(q => c.v.includes(q.id)).reduce((a, q) => a + q.est, 0);
  return m.estrelas + BONUS_DIA * m.dias + BONUS_SEMANA * m.sem + conq + somaVals(c.g) - somaVals(c.s);
}
/* ganhos por origem, para mostrar de onde vêm as estrelas */
function origemEstrelas(d){
  const c = cartDe(d), m = medidasConta(d);
  return {fases: m.estrelas, dias: BONUS_DIA * m.dias, sem: BONUS_SEMANA * m.sem, conquistas: CONQUISTAS.filter(q => c.v.includes(q.id)).reduce((a, q) => a + q.est, 0), itens: somaPref(c.g, 'b:'), semana: somaPref(c.g, 'w:'),
    outros: somaVals(c.g) - somaPref(c.g, 'b:') - somaPref(c.g, 'w:'), gastas: somaVals(c.s)};
}
function itensDe(d){
  const c = cartDe(d), r = new Set(Object.keys(ITENS).filter(k => ITENS[k].livre));
  for (const k of Object.keys(c.s)) if (k.startsWith('i:') && ITENS[k.slice(2)]) r.add(k.slice(2));
  for (const q of CONQUISTAS) if (q.item && c.v.includes(q.id)) r.add(q.item);
  return r;
}
const conquistasNovas = (d, hoje) => { const c = cartDe(d), m = medidasConta(d, hoje); return CONQUISTAS.filter(q => !c.v.includes(q.id) && m[q.m] >= q.n); };
function resgatarConquistas(d, hoje){
  const novas = conquistasNovas(d, hoje), c = cartDe(d);
  novas.forEach(q => c.v.push(q.id));
  return {cart: c, novas, estrelas: novas.reduce((a, q) => a + q.est, 0)};
}
function comprarItem(d, chave){
  const it = ITENS[chave], c = cartDe(d);
  if (!it) return {erro: 'inexistente'};
  if (itensDe(d).has(chave)) return {erro: 'ja-tem'};
  if (!it.preco) return {erro: 'so-conquista'};
  if (saldoConta(d) < it.preco) return {erro: 'saldo', falta: it.preco - saldoConta(d)};
  c.s['i:' + chave] = it.preco;
  return {cart: c, preco: it.preco};
}
const trocasDeApelido = d => Object.keys(cartDe(d).s).filter(k => k.startsWith('n:')).length;
function pagarApelido(d){
  const c = cartDe(d), s = saldoConta(d);
  if (s < NOME_CUSTO) return {erro: 'saldo', falta: NOME_CUSTO - s};
  c.s['n:' + (trocasDeApelido(d) + 1)] = NOME_CUSTO;
  return {cart: c, preco: NOME_CUSTO};
}
/* carteira: junta duas (de dois aparelhos) sem perder nada */
function juntarCart(a, b){
  const x = cartDe({cart: a}), y = cartDe({cart: b});
  for (const k of Object.keys(y.g)) x.g[k] = Math.max(x.g[k] || 0, y.g[k]);
  for (const k of Object.keys(y.s)) x.s[k] = Math.max(x.s[k] || 0, y.s[k]);
  y.v.forEach(id => { if (!x.v.includes(id)) x.v.push(id); });
  return x;
}
function limparCart(c){
  const o = {g: {}, s: {}, v: []};
  if (!c || typeof c !== 'object') return o;
  const ok = k => /^[a-z]{1,4}:[\w:.-]{0,40}$/.test(k);
  for (const [campo, fonte] of [['g', c.g], ['s', c.s]]){
    if (!fonte || typeof fonte !== 'object') continue;
    for (const k of Object.keys(fonte).slice(0, 3000)) if (ok(k) && fonte[k] >= 0) o[campo][k] = Math.min(1e6, Math.round(+fonte[k]));
  }
  if (Array.isArray(c.v)) o.v = [...new Set(c.v.filter(id => CONQUISTAS.some(q => q.id === id)))];
  return o;
}

/* ---- Filtro simples de apelidos (palavrões e nomes que imitam o jogo) ---- */
const APELIDO_TRECHOS = ['caralho', 'buceta', 'cuzao', 'viado', 'arrombad', 'porra', 'fuck', 'bitch', 'cunt', 'nigger', 'nigga', 'faggot', 'whore', 'mierda', 'pendejo', 'maricon', 'cabron', 'hitler', 'nazista', 'shapepuzzle', 'rafajames'];
const APELIDO_EXATAS = ['puta', 'puto', 'fdp', 'merda', 'shit', 'dick', 'rape', 'verga', 'joder', 'admin', 'moderador', 'suporte', 'staff', 'sistema'];
function apelidoProibido(nome){
  const t = String(nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/[@]/g, 'a').replace(/[$]/g, 's');
  const junto = t.replace(/[^a-z]/g, '');
  if (APELIDO_TRECHOS.some(w => junto.includes(w))) return true;
  return t.split(/[^a-z]+/).filter(Boolean).some(w => APELIDO_EXATAS.includes(w));
}
