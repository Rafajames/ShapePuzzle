/* ---- Estrelas, itens e conquistas da conta (lógica pura: roda no navegador e nos testes) ----
   O saldo nunca é guardado: sai das estrelas das fases + bônus (fase do dia, desafio da semana) + conquistas resgatadas
   + ganhos avulsos (anúncios premiados) − o que foi gasto. Só o que não dá para recalcular fica na "carteira":
   cart = {g: ganhos avulsos {chave: estrelas}, s: gastos {chave: estrelas}, v: conquistas já resgatadas}. */
const BONUS_DIA = 2, BONUS_SEMANA = 5, NOME_CUSTO = 30;
/* Itens: 'av:pN' (avatar) e 'mold:id' (moldura). livre = todo mundo tem; preco = comprado com estrelas; (sem nenhum dos dois) = só por conquista. */
const ITENS = {};
for (let i = 1; i <= 24; i++) ITENS['av:p' + i] = i <= 6 ? {livre: true} : i <= 10 ? {preco: 15} : i <= 14 ? {preco: 30} : i <= 18 ? {preco: 60} : {};
Object.assign(ITENS, {'mold:': {livre: true}, 'mold:madeira': {livre: true}, 'mold:pixel': {preco: 30}, 'mold:festa': {preco: 50}, 'mold:ouro': {preco: 100},
  'mold:gelo': {}, 'mold:fogo': {}, 'mold:arco': {}});
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
  return {fases: m.estrelas, dias: BONUS_DIA * m.dias, sem: BONUS_SEMANA * m.sem, conquistas: CONQUISTAS.filter(q => c.v.includes(q.id)).reduce((a, q) => a + q.est, 0), outros: somaVals(c.g), gastas: somaVals(c.s)};
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
