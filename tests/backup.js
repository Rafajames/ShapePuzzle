// Lógica pura do backup (validar, resumir, juntar), da soma de verificação e das sequências de dias.
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const logic = html.split('// ==LOGIC-START==')[1].split('// ==LOGIC-END==')[0];
const L = new Function(logic + '; return {limparBackup,resumoBackup,juntarDados,somaTexto,sequenciasDe,diaNum};')();
const lv = JSON.parse(html.slice(html.indexOf('/*LEVELS-START*/') + 16, html.indexOf('/*LEVELS-END*/')));
let ok = true; const falha = m => { ok = false; console.log('FALHA:', m); }; const igual = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) falha(m + ' → ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); };
const env = d => ({app: 'shapepuzzle', v: 1, criado: '2026-11-01T10:00:00Z', dados: d});

console.log('Validação');
igual(L.limparBackup(null).erro !== undefined, true, 'null recusado');
igual(L.limparBackup({app: 'outro', v: 1, dados: {}}).erro !== undefined, true, 'app errado recusado');
igual(L.limparBackup({app: 'shapepuzzle', v: 2, dados: {prog: {max: 1, done: [0]}}}).erro.includes('versão'), true, 'versão futura recusada com mensagem');
igual(L.limparBackup(env({})).erro, 'Esse backup está vazio.', 'backup vazio');
igual(L.limparBackup(env({prog: {max: 0, done: []}})).erro, 'Esse backup está vazio.', 'só zeros também é vazio');
const bom = {prog: {max: 7, done: [0, 1, 2, 2, 5]}, est: {0: 3, 1: 2, 5: 1}, rec: {'b:fase01': {t: 20000, j: 8}}, dias: {'2026-11-01': {t: 30000, j: 9, d: 0}},
  custom: [{nome: 'Minha', text: lv[0].text}], stats: {tempo: 5000, vitorias: 3, jogadas: 30, dicas: 1, solucoes: 0, desde: 1700000000000},
  inf: {feitas: {medio: 4, crescente: 2}, porNivel: {medio: {n: 4, t: 15000, est: 10, e3: 2}}}, cfg: {lang: 'en', tema: 'claro', a11y: {dalt: true}, humor: 'calma', pecas: 4, vibra: false, musica: true, sfx: false, vol: 0.4}};
const r = L.limparBackup(env(bom));
igual(!!r.dados, true, 'backup bom aceito'); igual(r.criado, '2026-11-01', 'data do backup');
igual(r.dados.prog.done, [0, 1, 2, 5], 'repetidos saem de "done"');
igual(r.dados.cfg.tema, 'claro', 'ajustes mantidos'); igual(r.dados.cfg.pecas, 4, 'peças por vez');
igual(L.resumoBackup(r.dados), {fases: 4, estrelas: 6, recordes: 1, dias: 1, criadas: 1, infinito: 4}, 'resumo');

console.log('Limpeza de dados perigosos ou estranhos');
const sujo = L.limparBackup(env({prog: {max: 1e9, done: ['a', 3, -4]}, est: {'x': 3, '4': 99, '5': 0}, rec: {'zzz': {t: 1, j: 1}, 'b:ok': {t: -5, j: 3}, 'b:fase02': {t: 1000.7, j: 4}},
  dias: {'ontem': {t: 1}, '2026-02-30x': {t: 1}, '2026-10-10': {t: 5000}}, custom: [{nome: '<b>x</b>', text: lv[1].text}, {nome: 'lixo', text: 'GABARITO:\n1,1\nPECAS_CUSTOM:\n1:0-0;\n'}, {nome: 'dup', text: lv[1].text}, 7, null],
  stats: {tempo: -5, vitorias: 'abc'}, cfg: {lang: 'xx', tema: 'rosa', humor: 'bagunça', pecas: 1, vol: 7, a11y: {dalt: 'sim', cont: true}, vibra: 'x', evil: 1}, __proto__x: 1, extra: {a: 1}}));
igual(!!sujo.dados, true, 'aceita o que dá e descarta o resto');
const d = sujo.dados;
igual(d.prog, {max: 999, done: [0, 3]}, 'prog é limitado'); igual(d.est, {4: 3}, 'estrelas: só 1 a 3, em fases numeradas');
igual(Object.keys(d.rec), ['b:fase02'], 'recordes inválidos saem'); igual(d.rec['b:fase02'], {t: 1001, j: 4}, 'tempo arredondado');
igual(Object.keys(d.dias), ['2026-10-10'], 'dias inválidos saem'); igual(d.custom.length, 1, 'só fase válida e sem repetição'); igual(d.custom[0].nome, 'bx/b', 'tags < > removidas do nome');
igual(d.stats.tempo, 0, 'tempo negativo vira 0'); igual(d.stats.vitorias, 0, 'texto vira 0');
igual(d.cfg, {a11y: {cont: true}}, 'ajustes inválidos saem'); igual('extra' in d || 'evil' in d, false, 'chaves desconhecidas não passam');
igual(L.limparBackup(env({custom: Array.from({length: 300}, (_, i) => ({nome: 'f' + i, text: lv[0].text + '\n'.repeat(i)}))})).dados.custom.length, 100, 'no máximo 100 fases criadas');

console.log('Juntar');
const atual = {prog: {max: 3, done: [0, 1]}, est: {0: 2, 1: 3}, rec: {'b:fase01': {t: 30000, j: 6}}, dias: {'2026-11-01': {t: 50000, j: 12, d: 1}},
  custom: [{nome: 'Minha', text: lv[3].text}], stats: {tempo: 9000, vitorias: 1, jogadas: 10, dicas: 0, solucoes: 0, desde: 1600000000000},
  inf: {feitas: {medio: 6}, porNivel: {medio: {n: 6, t: 20000, est: 12, e3: 1}}}, cfg: {lang: 'pt', tema: 'escuro'}};
const m = L.juntarDados(atual, r.dados);
igual(m.prog, {max: 7, done: [0, 1, 2, 5]}, 'prog: maior e união'); igual(m.est, {0: 3, 1: 3, 5: 1}, 'estrelas: o maior');
igual(m.rec['b:fase01'], {t: 20000, j: 6}, 'recorde: melhor tempo e melhores jogadas separados');
igual(m.dias['2026-11-01'], {t: 30000, j: 9, d: 0}, 'fase do dia: o resultado mais rápido');
igual(m.custom.map(f => f.nome), ['Minha', 'Minha (2)'], 'fases criadas: junta e evita nome repetido');
igual(m.stats, {tempo: 9000, vitorias: 3, jogadas: 30, dicas: 1, solucoes: 0, desde: 1600000000000}, 'estatísticas: o maior; "desde" o mais antigo');
igual(m.inf.feitas, {medio: 6, crescente: 2}, 'infinito: feitas'); igual(m.inf.porNivel.medio, {n: 6, t: 15000, est: 12, e3: 2}, 'infinito: melhores marcas');
igual(m.cfg, {lang: 'pt', tema: 'escuro'}, 'juntar não muda os ajustes deste aparelho');
igual(atual.prog.max, 3, 'o objeto original não é alterado');
const a2 = L.juntarDados(L.juntarDados({}, r.dados), r.dados);
igual(a2.custom.length, 1, 'juntar o mesmo backup duas vezes não duplica fases'); igual(a2.stats.vitorias, 3, 'nem soma estatísticas');
igual(L.juntarDados({}, r.dados).prog, r.dados.prog, 'juntar com aparelho vazio = o backup');

console.log('Soma de verificação');
igual(L.somaTexto('abc') === L.somaTexto('abc'), true, 'estável'); igual(L.somaTexto('abc') !== L.somaTexto('abd'), true, 'muda com 1 letra');
igual(L.somaTexto('').length, 8, 'sempre 8 dígitos'); igual(/^[0-9a-f]{8}$/.test(L.somaTexto('ação')), true, 'hexadecimal');

console.log('Sequências de dias');
igual(L.sequenciasDe({}, '2026-11-01'), {atual: 0, maior: 0}, 'sem dias');
igual(L.sequenciasDe({'2026-10-30': 1, '2026-10-31': 1, '2026-11-01': 1}, '2026-11-01'), {atual: 3, maior: 3}, 'hoje incluído');
igual(L.sequenciasDe({'2026-10-30': 1, '2026-10-31': 1}, '2026-11-01'), {atual: 2, maior: 2}, 'hoje ainda não jogado não quebra a sequência');
igual(L.sequenciasDe({'2026-10-28': 1, '2026-10-30': 1}, '2026-11-01'), {atual: 0, maior: 1}, 'sequência quebrada');
igual(L.sequenciasDe({'2026-10-01': 1, '2026-10-02': 1, '2026-10-03': 1, '2026-10-10': 1, '2026-10-31': 1, '2026-11-01': 1}, '2026-11-01'), {atual: 2, maior: 3}, 'maior sequência do passado');
igual(L.sequenciasDe({'2026-02-28': 1, '2026-03-01': 1, '2025-12-31': 1, '2026-01-01': 1}, '2026-03-01'), {atual: 2, maior: 2}, 'virada de mês e de ano');
console.log(ok ? 'BACKUP: TUDO OK' : 'BACKUP: HÁ FALHAS'); process.exit(ok ? 0 : 1);
