// Semanas (ISO) e sequências: lógica pura do desafio da semana.
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'logica-progresso.js'), 'utf8');
const L = new Function(src + ';return {diaNum, semanaDe, segundaDe, semanaIdx, sequenciasDe, sequenciasSemanas, limparBackup, juntarDados, resumoBackup, faseValida: () => true}')();
let falhas = 0; const ok = (c, m) => { console.log((c ? '  ok   ' : '  FALHA ') + m); if (!c) falhas++; };
const casos = {'2026-11-02': '2026-W45', '2026-11-01': '2026-W44', '2026-01-01': '2026-W01', '2027-01-03': '2026-W53', '2024-12-30': '2025-W01', '2021-01-03': '2020-W53', '2026-12-28': '2026-W53', '2025-12-29': '2026-W01'};
for (const [d, w] of Object.entries(casos)) ok(L.semanaDe(d) === w, `${d} é a semana ${w} (deu ${L.semanaDe(d)})`);
ok(L.segundaDe('2026-W45') === '2026-11-02' && L.segundaDe('2026-W01') === '2025-12-29' && L.segundaDe('2026-W53') === '2026-12-28', 'segunda-feira de cada semana');
ok(L.semanaDe('lixo') === '' && L.segundaDe('2026-45') === '', 'entradas inválidas viram texto vazio');
for (let d = 0; d < 400; d++) { const dt = new Date(Date.UTC(2026, 0, 1 + d)).toISOString().slice(0, 10); const w = L.semanaDe(dt), seg = L.segundaDe(w);
  if (L.semanaIdx(dt) !== L.semanaIdx(seg) || L.diaNum(dt) - L.diaNum(seg) < 0 || L.diaNum(dt) - L.diaNum(seg) > 6) { ok(false, `${dt} fora da semana ${w}`); break; } if (d === 399) ok(true, '400 dias seguidos caem na semana certa (segunda a domingo)'); }
const sq = (o, h) => JSON.stringify(L.sequenciasSemanas(o, h));
ok(sq({'2026-W43': {}, '2026-W44': {}, '2026-W45': {}, '2026-W40': {}}, '2026-11-02') === '{"atual":3,"maior":3}', 'três semanas seguidas, contando a de hoje');
ok(sq({'2026-W43': {}, '2026-W44': {}}, '2026-11-02') === '{"atual":2,"maior":2}', 'a semana de hoje ainda não jogada não quebra a sequência');
ok(sq({'2026-W42': {}}, '2026-11-02') === '{"atual":0,"maior":1}', 'duas semanas sem jogar zeram a atual');
ok(sq({'2026-W52': {}, '2026-W53': {}, '2027-W01': {}}, '2027-01-04') === '{"atual":3,"maior":3}', 'a virada de ano continua a sequência');
// backup com semanas e corrida
const bom = {app: 'shapepuzzle', v: 1, dados: {sem: {'2026-W45': {t: 90000, j: 12, d: 0}, 'lixo': {t: 1}, '2026-W46': {t: -5}}, corr: {melhor: 7, jogos: 3, total: 15}}};
const r = L.limparBackup(bom);
ok(!r.erro && Object.keys(r.dados.sem).join() === '2026-W45' && r.dados.corr.melhor === 7, 'backup guarda semanas válidas e a corrida, descarta o resto');
ok(L.resumoBackup(r.dados).semanas === 1, 'resumo conta as semanas');
const j = L.juntarDados({sem: {'2026-W45': {t: 100000, j: 9, d: 0}, '2026-W44': {t: 5, j: 1, d: 0}}, corr: {melhor: 9, jogos: 1, total: 9}}, r.dados);
ok(j.sem['2026-W45'].t === 90000 && j.sem['2026-W44'].t === 5, 'juntar fica com o melhor tempo de cada semana');
ok(j.corr.melhor === 9 && j.corr.jogos === 3 && j.corr.total === 15, 'juntar fica com o maior de cada marca da corrida');
ok(L.limparBackup({app: 'shapepuzzle', v: 1, dados: {corr: {melhor: 0, jogos: 0, total: 0}}}).erro, 'corrida zerada sozinha conta como backup vazio');
console.log(falhas ? 'FALHOU' : 'PROGRESSO: TUDO OK'); process.exit(falhas ? 1 : 0);
