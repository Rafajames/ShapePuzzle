// Estrelas, itens e conquistas da conta (lógica pura).
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const logic = html.split('// ==LOGIC-START==')[1].split('// ==LOGIC-END==')[0];
const L = new Function(logic + ';return {saldoConta, itensDe, comprarItem, pagarApelido, resgatarConquistas, conquistasNovas, juntarCart, limparCart, juntarDados, limparBackup, medidasConta, origemEstrelas, trocasDeApelido, apelidoProibido, ITENS, CONQUISTAS, NOME_CUSTO}')();
let falhas = 0; const ok = (c, m) => { console.log((c ? '  ok   ' : '  FALHA ') + m); if (!c) falhas++; };
const base = (extra) => Object.assign({prog: {max: 0, done: []}, est: {}, dias: {}, sem: {}, inf: {feitas: {}, porNivel: {}}, cart: {g: {}, s: {}, v: []}}, extra);
ok(L.saldoConta(base()) === 0, 'começa com 0 estrelas');
ok(L.saldoConta(base({est: {0: 3, 1: 2, 2: 1}})) === 6, 'soma as estrelas das fases');
ok(L.saldoConta(base({dias: {'2026-11-01': {t: 1, j: 1, d: 0}, '2026-11-02': {t: 1, j: 1, d: 0}}, sem: {'2026-W45': {t: 1, j: 1, d: 0}}})) === 2 * 2 + 5, 'bônus: 2 por fase do dia e 5 por desafio da semana');
ok(L.saldoConta({}) === 0 && L.saldoConta(null) === 0, 'dados vazios não quebram');
// itens
const livres = L.itensDe(base());
ok(livres.has('av:p1') && livres.has('av:p6') && !livres.has('av:p7') && livres.has('mold:') && livres.has('mold:madeira') && !livres.has('mold:ouro'), 'itens livres no começo');
let d = base({est: {0: 3, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3}});   // 18 estrelas
let r = L.comprarItem(d, 'av:p7');
ok(r.cart && r.preco === 15 && r.cart.s['i:av:p7'] === 15, 'compra de avatar de 15 estrelas');
d.cart = r.cart; ok(L.saldoConta(d) === 3 && L.itensDe(d).has('av:p7'), 'saldo desce e o item passa a ser seu');
ok(L.comprarItem(d, 'av:p7').erro === 'ja-tem', 'não compra duas vezes');
r = L.comprarItem(d, 'av:p8'); ok(r.erro === 'saldo' && r.falta === 12, 'saldo curto informa quanto falta');
ok(L.comprarItem(d, 'mold:gelo').erro === 'so-conquista' && L.comprarItem(d, 'av:p99').erro === 'inexistente', 'só por conquista e inexistente não compram');
// apelido
d = base({est: {0: 3, 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3}});  // 33
r = L.pagarApelido(d); ok(r.cart && r.preco === L.NOME_CUSTO, 'trocar apelido custa ' + L.NOME_CUSTO);
d.cart = r.cart; ok(L.saldoConta(d) === 3 && L.trocasDeApelido(d) === 1, 'conta uma troca');
ok(L.pagarApelido(d).erro === 'saldo', 'sem saldo, não troca');
// conquistas
const feitas = Array.from({length: 10}, (_, i) => i);
d = base({prog: {max: 10, done: feitas}, est: Object.fromEntries(feitas.map(i => [i, 3]))});   // 10 fases, 30 estrelas
const c = L.resgatarConquistas(d, '2026-11-05');
const ids = c.novas.map(q => q.id).sort().join(',');
ok(ids === 'estr30,fases10,fases5', 'conquistas cumpridas: ' + ids);
ok(c.estrelas === 5 + 10 + 5, 'prêmio em estrelas somado: ' + c.estrelas);
d.cart = c.cart; ok(L.itensDe(d).has('av:p21') && L.saldoConta(d) === 30 + 20, 'conquista libera o avatar e soma estrelas');
ok(L.resgatarConquistas(d, '2026-11-05').novas.length === 0, 'não resgata duas vezes');
d.prog = {max: 0, done: []}; ok(L.saldoConta(d) === 50 && L.itensDe(d).has('av:p21'), 'zerar o progresso não tira estrelas nem itens já resgatados');
const dias = {}; for (let i = 0; i < 7; i++) dias['2026-11-0' + (1 + i)] = {t: 1, j: 1, d: 0};
ok(L.medidasConta(base({dias}), '2026-11-07').seq === 7 && L.conquistasNovas(base({dias}), '2026-11-07').some(q => q.id === 'seq7'), 'sequência de 7 dias vira conquista');
// carteira: juntar aparelhos e limpar
const a = {g: {'a:1': 3}, s: {'i:av:p7': 15}, v: ['fases5']}, b2 = {g: {'a:2': 4}, s: {'i:av:p8': 15, 'i:av:p7': 15}, v: ['fases10', 'fases5']};
const j = L.juntarCart(a, b2);
ok(j.g['a:1'] === 3 && j.g['a:2'] === 4 && j.s['i:av:p7'] === 15 && j.s['i:av:p8'] === 15 && j.v.length === 2, 'junta sem duplicar nem perder');
const sujo = L.limparCart({g: {'ok:x': 5, '<script>': 9, 'z:y': -4}, s: {'n:1': 1e9}, v: ['fases5', 'inventada', 'fases5']});
ok(Object.keys(sujo.g).join() === 'ok:x' && sujo.s['n:1'] === 1e6 && sujo.v.join() === 'fases5', 'limpeza de dados inválidos');
// backup: a carteira viaja junto
const env = {app: 'shapepuzzle', v: 1, dados: {prog: {max: 3, done: [0, 1, 2]}, cart: {g: {}, s: {'n:1': 30}, v: ['fases5']}}};
const lim = L.limparBackup(env); ok(lim.dados && lim.dados.cart.s['n:1'] === 30 && lim.dados.cart.v[0] === 'fases5', 'backup guarda a carteira');
const jun = L.juntarDados(L.limparBackup(env).dados, {prog: {max: 5, done: [0, 1, 2, 3, 4]}, cart: {g: {}, s: {'n:2': 30}, v: []}});
ok(jun.cart.s['n:1'] === 30 && jun.cart.s['n:2'] === 30 && jun.prog.done.length === 5, 'juntar dois aparelhos junta também a carteira');
ok(L.apelidoProibido('p0rr4') && L.apelidoProibido('F u c k') && L.apelidoProibido('Admin') && L.apelidoProibido('shape_puzzle') && L.apelidoProibido('Pütä'.replace('ü','u').replace('ä','a')), 'filtro barra palavrões, truques com símbolos e nomes que imitam o jogo');
ok(!L.apelidoProibido('Maria Luz') && !L.apelidoProibido('Computador') && !L.apelidoProibido('Ana123') && !L.apelidoProibido('Estrela'), 'não barra apelidos normais (Computador, Estrela…)');
console.log(falhas ? '\nCONTA-LOGICA: ' + falhas + ' FALHA(S)' : '\nCONTA-LOGICA: TUDO OK'); process.exit(falhas ? 1 : 0);
