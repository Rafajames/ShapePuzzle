/* ======================= Estatísticas ======================= */
function fmtDuracao(ms){
  const min = Math.floor(ms / 60000), h = Math.floor(min / 60), m = min % 60;
  return h ? tr('{h} h {m} min', {h, m}) : min ? tr('{m} min', {m: min}) : tr('menos de 1 min');
}
const nomeRec = k => k[0] === 'b' ? tr('Fase ' + (parseInt(k.slice(1 + 1 + 4), 10) || '?')) : k[0] === 'd' ? tr('Dia {data}', {data: dataCurta(k.slice(2))}) : k.slice(2);
function abrirEstatisticas(){
  const corpo = $('#estCorpo'); corpo.innerHTML = '';
  const bloco = (titulo, itens) => {
    const g = mk('div', 'estg');
    itens.forEach(([v, r]) => { const d = mk('div', 'sv'); d.append(mk('b', '', v), mk('span', '', tr(r))); g.appendChild(d); });
    corpo.append(mk('h2', '', tr(titulo)), g);
  };
  const feitas = prog.done.filter(i => i < BUILTIN.length).length, estrelas = Object.keys(estrelasFase).reduce((a, k) => a + (+estrelasFase[k] || 0), 0);
  const tres = Object.keys(estrelasFase).filter(k => estrelasFase[k] === 3).length;
  const dg = [[fmtDuracao(Est.tempo), 'Tempo jogado'], [String(Est.vitorias), 'Fases vencidas'], [String(Est.jogadas), 'Jogadas'], [String(Est.dicas), 'Dicas usadas']];
  if (Est.solucoes) dg.push([String(Est.solucoes), 'Soluções vistas']);
  dg.push([new Date(Est.desde).toLocaleDateString(LANG_HTML[lang]), 'Jogando desde']);
  bloco('Geral', dg);
  bloco('Fases do jogo', [[feitas + '/' + BUILTIN.length, 'Fases concluídas'], [estrelas + '/' + BUILTIN.length * 3, 'Estrelas'], [String(tres), 'Fases com 3 estrelas'], [String(Math.min(prog.max, BUILTIN.length - 1) + 1), 'Fase mais adiantada']]);
  const sq = sequenciasDe(dias, dataHoje()), ts = Object.values(dias).map(d => d.t).filter(t => t > 0);
  bloco('Fase do dia', [[String(Object.keys(dias).length), 'Dias jogados'], ['🔥 ' + sq.atual, 'Sequência atual'], [String(sq.maior), 'Maior sequência'], [ts.length ? fmtTempo(Math.min(...ts)) : '–', 'Melhor tempo']]);
  const totalInf = MODOS_INF.reduce((a, m) => a + (inf.feitas[m] || 0), 0), it = [[String(totalInf), 'Fases feitas']];
  ['facil', 'medio', 'dificil', 'mestre'].forEach(n => { const p = inf.porNivel[n]; if (p && p.n) it.push([p.n + (p.t ? ' · ' + fmtTempo(p.t) : ''), NIVEIS_INF[n].nome]); });
  bloco('Modo infinito', it);
  const melhores = Object.keys(recs).map(k => ({k, t: recs[k].t})).sort((a, b) => a.t - b.t).slice(0, 4);
  if (melhores.length) bloco('Seus melhores tempos', melhores.map(r => [fmtTempo(r.t), nomeRec(r.k)]));
  bloco('Criação', [[String(custom.length), 'Fases criadas']]);
  abrir('stats');
}
$('#btnEst').onclick = abrirEstatisticas;

