/* Fases além das 50: determinísticas (iguais em qualquer aparelho), de solução única e liberadas de 10 em 10. */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src/js/logica-fases.js'), 'utf8');
const L = new Function(src + ';return {gerarFase, opcoesFaseB, seedFaseB, fasesVisiveisDe, parseFase, FASES_FIXAS, LOTE_FASES, LIMITE_FASES};')();
let falhas = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FALHA ') + m); if (!c) falhas++; };
const gerar = i => { for (let t = 0; t < 10; t++){ const f = L.gerarFase(L.seedFaseB(i, t), L.opcoesFaseB(i)); if (f && f.unica) return f; } return null; };

console.log('Liberação de 10 em 10');
const v = m => L.fasesVisiveisDe(m, 50, false);
ok(v(0) === 10 && v(9) === 10, 'começa com 10 fases');
ok(v(10) === 20 && v(19) === 20, 'terminou a 10 → aparecem até a 20');
ok(v(20) === 30 && v(49) === 50 && v(50) === 60 && v(999) === 1000, 'e assim por diante, sem passar de 1000');
ok(L.fasesVisiveisDe(0, 50, true) === 50, 'modo de teste mostra pelo menos as 50 fixas');

console.log('Dificuldade');
ok(L.opcoesFaseB(50).n === 6 && L.opcoesFaseB(69).n === 6, 'fases 51–70: 6×6');
ok(L.opcoesFaseB(70).n === 7 && L.opcoesFaseB(71).n === 7, 'depois: 7×7');
ok(L.opcoesFaseB(74).n === 6 && L.opcoesFaseB(79).n === 6, 'de cinco em cinco uma 6×6 para respirar');
ok(L.opcoesFaseB(400).minEstrelas >= 5 && L.opcoesFaseB(400).minEstrelas < L.opcoesFaseB(70).minEstrelas + 1, 'cada vez menos estrelas-guia, com piso');

console.log('Iguais para todo mundo');
for (const i of [50, 55, 70, 74, 120]){
  const a = gerar(i), b = gerar(i);
  ok(a && a.unica && a.text === b.text, `fase ${i + 1}: gerada duas vezes dá o mesmo texto, com solução única`);
  const p = L.parseFase(a.text); ok(p.n === L.opcoesFaseB(i).n, `fase ${i + 1}: tabuleiro ${p.n}×${p.n}`);
}
ok(gerar(50).text !== gerar(51).text && gerar(50).text !== gerar(52).text, 'fases diferentes têm textos diferentes');
ok(new Set(Array.from({length: 500}, (_, i) => L.seedFaseB(50 + i))).size === 500, 'sementes de 500 fases seguidas não se repetem');
ok(Array.from({length: 1000}, (_, i) => L.seedFaseB(i, 9)).every(s => s >= 1 && s <= 999999999), 'sementes dentro do limite');
console.log(falhas ? 'FASES GERADAS: COM FALHAS' : 'FASES GERADAS: TUDO OK');
process.exit(falhas ? 1 : 0);
