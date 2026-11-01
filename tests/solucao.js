// Testa solucaoDe (solução inteira mostrada peça por peça): parte do estado atual, cai para "do zero" se houver conflito e nunca altera o jogo.
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const logic = html.split('// ==LOGIC-START==')[1].split('// ==LOGIC-END==')[0];
const L = new Function(logic + '; return {novoJogo,podeColocar,colocar,solucaoDe,dicaDe,concluido,orientacoes};')();
const lv = JSON.parse(html.slice(html.indexOf('/*LEVELS-START*/') + 16, html.indexOf('/*LEVELS-END*/')));
let ok = true; const falha = m => { ok = false; console.log('FALHA:', m); };
const foto = j => JSON.stringify([j.grade, j.reserva.map(p => p.uid)]);

lv.forEach((f, i) => {
  const j = L.novoJogo(f.text), antes = foto(j);
  const r = L.solucaoDe(j);
  if (r.tipo !== 'ok'){ falha(`fase ${i + 1}: sem solução (${r.tipo})`); return; }
  if (r.zero) falha(`fase ${i + 1}: tabuleiro vazio não deveria cair no "do zero"`);
  if (r.passos.length !== j.reserva.length) falha(`fase ${i + 1}: ${r.passos.length} passos para ${j.reserva.length} peças`);
  if (foto(j) !== antes) falha(`fase ${i + 1}: solucaoDe alterou o jogo`);
  // as peças dos passos cobrem o tabuleiro inteiro, sem sobrepor
  const cob = Array.from({length: j.n}, () => Array(j.n).fill(0));
  r.passos.forEach(q => q.o.forEach((l, a) => l.forEach((v, b) => { if (v) cob[q.py + a][q.px + b]++; })));
  if (!cob.every(l => l.every(v => v === 1))) falha(`fase ${i + 1}: solução não cobre o tabuleiro exatamente uma vez`);
  // as cores certas ficam nas casas marcadas
  r.passos.forEach(q => q.o.forEach((l, a) => l.forEach((v, b) => { const g = j.gab[q.py + a][q.px + b]; if (v && g && g !== q.peca.id) falha(`fase ${i + 1}: cor errada na solução`); })));
});
console.log('solução de todas as', lv.length, 'fases conferida');

// parte do estado atual: depois de colocar a dica, a solução tem uma peça a menos
{
  const j = L.novoJogo(lv[0].text), d = L.dicaDe(j);
  const p = d.peca; const rod = L.orientacoes(p.formato).find(o => JSON.stringify(o) === JSON.stringify(d.o));
  p.formato = rod; L.colocar(j, p, d.px, d.py);
  const r = L.solucaoDe(j);
  if (r.tipo !== 'ok' || r.zero || r.passos.length !== j.reserva.length) falha('depois de uma peça certa a solução deveria continuar dali');
  else console.log('parte do estado atual: ok (' + r.passos.length + ' passos restantes)');
}

// conflito: uma peça colocada na cor errada → solução do zero com todas as peças
{
  const j = L.novoJogo(lv[0].text); let feito = false;
  for (const p of j.reserva){
    if (feito) break;
    for (const o of L.orientacoes(p.formato)){
      if (feito) break;
      for (let y = 0; y < j.n && !feito; y++) for (let x = 0; x < j.n && !feito; x++){
        if (!L.podeColocar(j, o, x, y)) continue;
        let ruim = false; o.forEach((l, a) => l.forEach((v, b) => { const g = j.gab[y + a][x + b]; if (v && g && g !== p.id) ruim = true; }));
        if (!ruim) continue;
        p.formato = o; L.colocar(j, p, x, y); feito = true;
      }
    }
  }
  if (!feito) falha('não achei como montar o conflito');
  else {
    const total = j.reserva.length + j.mapa.size, r = L.solucaoDe(j);
    if (r.tipo !== 'ok' || !r.zero || r.passos.length !== total) falha('com peça errada, a solução deveria vir do zero com todas as peças');
    else console.log('conflito → solução do zero: ok (' + r.passos.length + ' peças)');
  }
}
console.log(ok ? 'SOLUÇÃO: TUDO OK' : 'SOLUÇÃO: HÁ FALHAS'); process.exit(ok ? 0 : 1);
