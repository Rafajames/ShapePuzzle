const fs = require('fs');
const path = require('path'), crypto = require('crypto');
const ler = f => fs.readFileSync(f, 'utf8');
const pega = h => JSON.parse(h.slice(h.indexOf('/*LEVELS-START*/') + 16, h.indexOf('/*LEVELS-END*/')));
const html = ler(path.join(__dirname, '..', 'index.html'));
const carimbos = JSON.parse(ler(path.join(__dirname, 'fases-1-30.json')));
const logic = html.split('// ==LOGIC-START==')[1].split('// ==LOGIC-END==')[0];
const L = new Function(logic + '; return {TAM,parseFase,novoJogo,podeColocar,colocar,remover,concluido,faseValida,buscar,dicaDe,visiveis,girar,inverter,filaEfetiva};')();
let ok = true; const falha = m => { ok = false; console.log('FALHA:', m); };
const lv = pega(html);
const sha = t => crypto.createHash('sha256').update(t).digest('hex');
console.log('fases:', lv.length);
if (lv.length !== 50) falha('esperava 50');
for (let i = 0; i < 30; i++) if (sha(JSON.stringify(lv[i])) !== carimbos[i]) falha('fase ' + (i + 1) + ' foi alterada!');
console.log('as 30 primeiras fases continuam idênticas ao carimbo salvo:', lv.slice(0, 30).every((x, i) => sha(JSON.stringify(x)) === carimbos[i]));
lv.forEach((f, i) => {
  const j = L.novoJogo(f.text), n = j.n;
  const cel = j.reserva.reduce((a, p) => a + p.formato.flat().reduce((s, v) => s + v, 0), 0);
  const vazio = Array.from({length: n}, () => Array(n).fill(false));
  const r = L.buscar(vazio, j.reserva, j.gab, 2, 5e6);
  if (cel !== n * n) falha(`fase ${i+1}: ${cel} células em tabuleiro ${n}x${n}`);
  if (r.n < 1 || r.estourou) falha(`fase ${i+1}: sem solução`);
  if (i >= 30 && r.n !== 1) falha(`fase ${i+1}: solução não única`);
  if (i < 30 && (n !== 5 || (j.fila && j.fila !== 5) || (j.reserva.length > 5 && !j.filaAuto))) falha(`fase ${i+1} (clássica) deveria ser 5x5 com 5 peças por vez automático`);
  if (i >= 30 && n < 6) falha(`fase ${i+1} deveria ser maior que 5x5`);
  // jogar só com dicas respeitando a fila: a peça sugerida precisa estar entre as visíveis
  let guard = 0;
  while (!L.concluido(j) && guard++ < 40){
    const d = L.dicaDe(j);
    if (d.tipo !== 'ok'){ falha(`fase ${i+1}: dica ${d.tipo}`); break; }
    if (j.fila && !L.visiveis(j).includes(d.peca)) falha(`fase ${i+1}: dica sugeriu peça escondida`);
    d.peca.formato = d.o;
    if (!L.podeColocar(j, d.peca.formato, d.px, d.py)){ falha(`fase ${i+1}: dica inválida`); break; }
    L.colocar(j, d.peca, d.px, d.py);
  }
  if (!L.concluido(j)) falha(`fase ${i+1}: dicas não completaram`);
});
console.log('todas as 50 fases foram resolvidas só com dicas (respeitando a fila)');
// visíveis: o padrão nunca é menos de 5; só a escolha da pessoa diminui (1 a 6) ou libera tudo (99)
{ const vis = (t, escolha) => L.visiveis(L.novoJogo(t, 5, escolha)).length;
  [35, 39, 46].forEach(i => { if (vis(lv[i].text, 0) !== 5) falha(`fase ${i+1} deveria mostrar 5 peças por padrão (mesmo com FILA no texto)`); });
  if (vis(lv[35].text, 3) !== 3) falha('escolha 3 deveria mostrar 3');
  if (vis(lv[39].text, 1) !== 1) falha('escolha 1 deveria mostrar 1 (mesmo numa fase com FILA própria)');
  if (vis(lv[0].text, 0) !== Math.min(5, lv[0].text.split('\n').filter(l => /^\d+:/.test(l)).length)) falha('fase clássica deveria mostrar 5 peças por vez');
  const t = L.novoJogo(lv[35].text, 5, 99); if (t.fila !== 0 || L.visiveis(t).length !== t.reserva.length) falha('escolha 99 deveria mostrar todas');
  if (L.filaEfetiva(10, 2, 4, 0) !== 5 || L.filaEfetiva(10, 0, 6, 0) !== 6 || L.filaEfetiva(4, 0, 5, 0) !== 0) falha('filaEfetiva');
  console.log('peças por vez: mínimo 5 no automático, escolha da pessoa vale'); }
console.log(ok ? 'TUDO OK' : 'HOUVE FALHAS'); process.exit(ok ? 0 : 1);
