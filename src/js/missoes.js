/* ======================= Missões do dia ======================= */
/* Três tarefas por dia, iguais para todo mundo (sorteadas pela data). O progresso fica no aparelho; os prêmios vão para a carteira (e para a nuvem). */
let misEst = store.get('mis', null);
const NOME_MISSAO = {v2: 'Vença 2 fases', v4: 'Vença 4 fases', sd2: 'Vença 2 fases sem usar dica', e1: 'Faça 3 estrelas em uma fase', e3: 'Faça 3 estrelas em 3 fases',
  rap: 'Vença uma fase em menos de 1 minuto', dia: 'Jogue a fase do dia', inf: 'Vença uma fase do modo infinito', corr: 'Jogue uma partida contra o relógio'};
/* o que abrir ao tocar numa missão que pede um modo de jogo */
const IR_MISSAO = {dia: () => $('#btnDia').onclick(), inf: () => $('#btnInf').onclick(), corr: () => $('#btnCorr').onclick()};
const progMissao = (m, hoje) => (cart.g['mis:' + hoje + ':' + m.id] !== undefined) ? m.n : (misEst && misEst.d === hoje ? misEst.p[m.id] || 0 : 0);
/* conta os eventos de uma jogada ([ev, quantos]...); dá os prêmios e avisa uma vez só. Devolve as estrelas ganhas. */
function registrarMissoes(lista){
  if (modoTeste) return 0;
  const hoje = dataHoje(); let c = cart, novas = [], todas = false;
  for (const [ev, n] of lista){ const r = contarMissao(misEst, c, hoje, ev, n); misEst = r.est; c = r.cart; novas = novas.concat(r.novas); todas = todas || r.todas; }
  store.set('mis', misEst);
  if (!novas.length) return 0;
  guardarCart(c); contaAgendar(5000); renderConta();
  const total = novas.reduce((a, m) => a + m.est, 0) + (todas ? MISSAO_BONUS : 0);
  toast(todas ? tr('Todas as missões do dia cumpridas! +{n} ★', {n: total}) : tr('Missão cumprida: {nome}! +{n} ★', {nome: tr(NOME_MISSAO[novas[0].id]), n: total}));
  return total;
}
function renderMissoesInicio(){
  const hoje = dataHoje(), l = missoesDoDia(hoje), feitas = l.filter(m => progMissao(m, hoje) >= m.n).length;
  const falta = l.filter(m => progMissao(m, hoje) < m.n).reduce((a, m) => a + m.est, 0) + (cart.g['mis:' + hoje + ':todas'] === undefined ? MISSAO_BONUS : 0);
  $('#hMisSub').textContent = tr('{a} de {b}', {a: feitas, b: l.length}) + (falta ? ' · +' + falta + ' ★' : ' · ✓');
  $('#hMisPontos').innerHTML = l.map(m => '<i' + (progMissao(m, hoje) >= m.n ? ' class="ok"' : '') + '></i>').join('');
  $('#hMis').classList.toggle('feito', feitas === l.length);
}
function abrirMissoes(){
  const hoje = dataHoje(), l = missoesDoDia(hoje), ul = $('#msLista'); ul.textContent = '';
  l.forEach(m => {
    const v = progMissao(m, hoje), ok = v >= m.n, li = mk('li', ok ? 'ok' : '');
    const topo = mk('div', 'msTopo');
    topo.appendChild(mk('b', '', (ok ? '✓ ' : '') + tr(NOME_MISSAO[m.id])));
    topo.appendChild(mk('span', 'msPremio', '+' + m.est + ' ★'));
    li.appendChild(topo);
    const barra = mk('div', 'cnBarra'), i = mk('i'); i.style.width = Math.round(100 * v / m.n) + '%'; barra.appendChild(i); li.appendChild(barra);
    li.appendChild(mk('small', 'cnQv', v + '/' + m.n));
    if (!ok && IR_MISSAO[m.ev]){ li.classList.add('ir'); li.tabIndex = 0; li.setAttribute('role', 'button'); const ir = () => { fechar('missoes'); sairDaAbertura(); IR_MISSAO[m.ev](); }; li.onclick = ir; li.onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); ir(); } }; }
    ul.appendChild(li);
  });
  const todas = cart.g['mis:' + hoje + ':todas'] !== undefined;
  $('#msBonus').textContent = todas ? tr('Bônus das 3 missões recebido: +{n} ★', {n: MISSAO_BONUS}) : tr('Cumpra as 3 para ganhar mais {n} ★.', {n: MISSAO_BONUS});
  relogioMissoes();
  abrir('missoes');
}
function relogioMissoes(){ const t = $('#hDiaRel').textContent.match(/\d\d:\d\d:\d\d/); $('#msSub').textContent = t ? tr('Missões novas em {t}', {t: t[0]}) : ''; }
$('#hMis').onclick = abrirMissoes;
$('#msJogar').onclick = () => { fechar('missoes'); if ($('#ov-splash').classList.contains('on')) $('#btnJogar').onclick(); };
setInterval(() => { if ($('#ov-missoes').classList.contains('on')) relogioMissoes(); }, 1000);
