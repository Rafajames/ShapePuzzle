/* ======================= Estatísticas ======================= */
function fmtDuracao(ms){
  const min = Math.floor(ms / 60000), h = Math.floor(min / 60), m = min % 60;
  return h ? tr('{h} h {m} min', {h, m}) : min ? tr('{m} min', {m: min}) : tr('menos de 1 min');
}
const nomeRec = k => k[0] === 's' ? nomeSemana(k.slice(2)) : k[0] === 'b' ? tr('Fase ' + (parseInt(k.slice(1 + 1 + 4), 10) || '?')) : k[0] === 'd' ? tr('Dia {data}', {data: dataCurta(k.slice(2))}) : k.slice(2);
/* grade de quadradinhos "valor + legenda" */
const gradeSv = itens => {
  const g = mk('div', 'estg');
  itens.forEach(([v, r]) => { const d = mk('div', 'sv'); d.append(mk('b', '', v), mk('span', '', tr(r))); g.appendChild(d); });
  return g;
};
function abrirEstatisticas(){
  const corpo = $('#estCorpo'); corpo.innerHTML = '';
  const bloco = (titulo, itens) => {
    corpo.append(mk('h2', '', tr(titulo)), gradeSv(itens));
  };
  const total = fasesVisiveis(), feitas = prog.done.length, estrelas = Object.keys(estrelasFase).reduce((a, k) => a + (+estrelasFase[k] || 0), 0);
  const tres = Object.keys(estrelasFase).filter(k => estrelasFase[k] === 3).length;
  const dg = [[fmtDuracao(Est.tempo), 'Tempo jogado'], [String(Est.vitorias), 'Fases vencidas'], [String(Est.jogadas), 'Jogadas'], [String(Est.dicas), 'Dicas usadas']];
  if (Est.solucoes) dg.push([String(Est.solucoes), 'Soluções vistas']);
  dg.push([new Date(Est.desde).toLocaleDateString(LANG_HTML[lang]), 'Jogando desde']);
  bloco('Geral', dg);
  bloco('Fases do jogo', [[feitas + '/' + total, 'Fases concluídas'], [estrelas + '/' + total * 3, 'Estrelas'], [String(tres), 'Fases com 3 estrelas'], [String(prog.max + 1), 'Fase mais adiantada']]);
  const sq = sequenciasDe(dias, dataHoje()), ts = Object.values(dias).map(d => d.t).filter(t => t > 0);
  bloco('Fase do dia', [[String(Object.keys(dias).length), 'Dias jogados'], ['🔥 ' + sq.atual, 'Sequência atual'], [String(sq.maior), 'Maior sequência'], [ts.length ? fmtTempo(Math.min(...ts)) : '–', 'Melhor tempo']]);
  const ss = sequenciasSemanas(sem, dataHoje()), tsem = Object.values(sem).map(d => d.t).filter(t => t > 0);
  bloco('Desafio da semana', [[String(Object.keys(sem).length), 'Semanas jogadas'], ['🔥 ' + ss.atual, 'Sequência atual'], [String(ss.maior), 'Maior sequência'], [tsem.length ? fmtTempo(Math.min(...tsem)) : '–', 'Melhor tempo']]);
  bloco('Contra o relógio', [[String(corr.melhor), 'Melhor corrida'], [String(corr.jogos), 'Corridas'], [String(corr.total), 'Fases resolvidas']]);
  const totalInf = MODOS_INF.reduce((a, m) => a + (inf.feitas[m] || 0), 0), it = [[String(totalInf), 'Fases feitas']];
  ['facil', 'medio', 'dificil', 'mestre'].forEach(n => { const p = inf.porNivel[n]; if (p && p.n) it.push([p.n + (p.t ? ' · ' + fmtTempo(p.t) : ''), NIVEIS_INF[n].nome]); });
  bloco('Modo infinito', it);
  const melhores = Object.keys(recs).map(k => ({k, t: recs[k].t})).sort((a, b) => a.t - b.t).slice(0, 4);
  if (melhores.length) bloco('Seus melhores tempos', melhores.map(r => [fmtTempo(r.t), nomeRec(r.k)]));
  bloco('Criação', [[String(custom.length), 'Fases criadas']]);
  abrir('stats');
}
$('#btnEst').onclick = abrirEstatisticas;

