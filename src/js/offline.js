/* ======================= Campeonato sem internet (QR code) =======================
   Nada vai para servidor: o campeonato, o convite de cada pessoa e os resultados viajam dentro do link/QR (veja logica-offline.js). */
let offs = store.get('offs', {});      /* código → {p: pacote, eu: índice de quem usa este aparelho | null, ts} */
const OFF = {id: null, pendente: null};
const salvarOffs = () => {
  const ids = Object.keys(offs).sort((a, b) => offs[b].ts - offs[a].ts);
  ids.slice(20).forEach(i => delete offs[i]);
  store.set('offs', offs);
};
const urlOff = (p, eu) => urlBase() + '#o=' + codigoOff(p) + (eu != null ? '&eu=' + eu : '');
const meusOff = e => (e.eu != null && e.p.r[e.eu]) || [];

/* Guarda (ou junta com o que já havia) o campeonato lido de um código. Devolve {id} ou {erro}. */
function importarOff(r){
  const p = r.pacote, e = offs[p.i];
  if (!e){ offs[p.i] = {p, eu: r.eu, ts: Date.now()}; salvarOffs(); return {id: p.i}; }
  const m = juntarOff(e.p, p);
  if (!m) return {erro: 'Esse código é de outro campeonato.'};
  e.p = m; e.ts = Date.now();
  if (r.eu != null && (e.eu == null || !meusOff(e).some(Boolean))) e.eu = r.eu;
  salvarOffs(); return {id: p.i};
}
/* link do convite (#o=...&eu=N) ou de resultados (#o=...) aberto neste aparelho */
function lerLinkOff(){
  if (!/[#&]o=SPO1\./.test(location.hash)) return null;
  const r = lerCodigoOff(location.hash, BUILTIN.length);
  history.replaceState(null, '', location.pathname + location.search);
  if (r.erro){ toast(r.erro); return null; }
  const g = importarOff(r);
  if (g.erro){ toast(g.erro); return null; }
  return g.id;
}
window.addEventListener('hashchange', () => { const id = lerLinkOff(); if (id){ fecharTodos('ov-splash'); abrirOffV(id); } });

/* ---- fases ---- */
const textosOff = new Map();
async function textoDeRef(ref){
  const k = JSON.stringify(ref);
  if (textosOff.has(k)) return textosOff.get(k);
  let t = null;
  if (ref[0] === 'b') t = BUILTIN[ref[1]].text;
  else { const f = await Gerador.gerar(ref[2], NIVEIS_INF[ref[1]].o); t = f && f.text; }
  if (t) textosOff.set(k, t);
  return t;
}
/* sorteia as fases do campeonato; só aceita fase de solução única */
async function sortearFasesOff(tipo, n){
  if (tipo === 'jogo') return PRESETS[n].map(i => ['b', i]);
  const fases = [];
  for (let k = 0; k < n; k++){
    const nivel = tipo === 'crescente' ? OFF_NIVEIS[Math.floor(k * 3 / n)] : tipo;
    let ref = null;
    for (let t = 0; t < 6 && !ref; t++){
      const seed = novaSeed(), f = await Gerador.gerar(seed, NIVEIS_INF[nivel].o);
      if (f && f.unica) ref = ['g', nivel, seed];
    }
    if (!ref) return null;
    fases.push(ref);
  }
  return fases;
}
const rotuloFaseOff = ref => ref[0] === 'b' ? tr('Fase do jogo') : tr('Sorteada') + ' · ' + tr(NIVEIS_INF[ref[1]].nome);

/* ---- jogar ---- */
async function jogarFaseOff(i){
  const e = offs[OFF.id]; if (!e) return;
  if (e.eu == null){ toast('Diga primeiro quem é você.'); return; }
  if (meusOff(e)[i]){ toast('Você já fez esta fase.'); return; }
  const text = await comGerando(() => textoDeRef(e.p.f[i])); if (!text) return;
  fecharTodos();
  carregar({k: 'o', oc: e.p.i, idx: i, total: e.p.f.length, campNome: e.p.n, nome: 'Fase ' + (i + 1), text});
  toast('Valendo! O tempo já está correndo e as dicas ficam desligadas.');
}
/* a primeira vez que a fase é concluída é a que vale */
function registrarOff(c, t, j){
  const e = offs[c.oc]; if (!e || e.eu == null) return;
  const r = e.p.r[e.eu] = e.p.r[e.eu] || e.p.f.map(() => null);
  if (!r[c.idx]) r[c.idx] = [inteiro(t, 1, 864e5), inteiro(j, 1, 99999)];
  e.ts = Date.now(); salvarOffs();
}
function vitoriaOff(c, res, add){
  const e = offs[c.oc]; if (!e){ return; }
  const feitas = meusOff(e), tudo = e.p.f.every((_, i) => feitas[i]);
  $('#winTexto').textContent = tr(tudo ? 'Você terminou o campeonato! Mostre o seu QR de resultado.' : 'Resultado guardado neste aparelho.');
  const proxima = e.p.f.findIndex((_, i) => !feitas[i]);
  if (!tudo && proxima >= 0) add('Próxima fase do campeonato', 'pri', () => setTimeout(() => { OFF.id = c.oc; jogarFaseOff(proxima); }, 50));
  add(tudo ? 'Ver resultado' : 'Ver campeonato', tudo || proxima < 0 ? 'pri' : '', () => setTimeout(() => abrirOffV(c.oc), 50), 'trophy');
}

/* ---- início ---- */
function abrirOffHub(){
  const l = $('#ofLista'); l.innerHTML = ''; $('#ofCola').value = ''; aviso('#ofAviso', '');
  const ids = Object.keys(offs).sort((a, b) => offs[b].ts - offs[a].ts);
  if (!ids.length) l.innerHTML = '<p class="vazio2">' + tr('Você ainda não tem nenhum campeonato sem internet.') + '</p>';
  ids.forEach(id => {
    const p = offs[id].p, d = mk('div', 'cust');
    d.append(mk('span', '', p.n + ' · ' + qtd(p.j.length, ' jogador', ' jogadores')),
      icBtn('play', tr('Abrir') + ': ' + p.n, () => { fechar('off'); abrirOffV(id); }),
      icBtn('trash', tr('Tirar deste aparelho') + ': ' + p.n, () => { if (confirmarTirarOff()){ delete offs[id]; salvarOffs(); abrirOffHub(); } }));
    l.appendChild(d);
  });
  abrir('off');
}
const confirmarTirarOff = () => confirm(tr('Tirar este campeonato deste aparelho? Os resultados guardados aqui serão apagados.'));
$('#cpOff').onclick = () => { fechar('camps'); abrirOffHub(); };
$('#ofCriar').onclick = () => { fechar('off'); abrirOffCriar(); };
$('#ofImportar').onclick = () => {
  const r = lerCodigoOff($('#ofCola').value, BUILTIN.length);
  if (r.erro){ aviso('#ofAviso', r.erro, 'erro'); return; }
  const g = importarOff(r);
  if (g.erro){ aviso('#ofAviso', g.erro, 'erro'); return; }
  fechar('off'); abrirOffV(g.id);
};

/* ---- criar ---- */
function abrirOffCriar(){
  $('#ocNome').value = ''; $('#ocEu').value = cpNome || ''; $('#ocOutros').value = ''; aviso('#ocAviso', '');
  abrir('offc'); setTimeout(() => $('#ocNome').focus(), 50);
}
$('#ocCriar').onclick = async () => {
  const nome = limparNome($('#ocNome').value), eu = limparNome($('#ocEu').value);
  const outros = $('#ocOutros').value.split(/[\n,;]+/).map(limparNome).filter(Boolean);
  const erro = !nomeValido(nome) ? 'Dê um nome ao campeonato (pelo menos 2 letras).' : !nomeValido(eu) ? 'Digite o seu nome (pelo menos 2 letras).'
    : !outros.length ? 'Escreva o nome de pelo menos mais um jogador.' : outros.length + 1 > OFF_MAX_J ? 'No máximo ' + OFF_MAX_J + ' jogadores, contando com você.'
    : [eu, ...outros].some((x, i, a) => !nomeValido(x) || a.findIndex(y => normalizarNome(y) === normalizarNome(x)) !== i) ? 'Cada jogador precisa de um nome diferente, com pelo menos 2 letras.' : '';
  if (erro){ aviso('#ocAviso', erro, 'erro'); return; }
  aviso('#ocAviso', '');
  const f = await comGerando(() => sortearFasesOff($('#ocTipo').value, +$('#ocQtd').value)); if (!f) return;
  const r = limparOff({v: 1, i: novoCodigo(), n: nome, f, j: [eu, ...outros], r: {}}, BUILTIN.length);
  if (r.erro){ aviso('#ocAviso', r.erro, 'erro'); return; }
  offs[r.pacote.i] = {p: r.pacote, eu: 0, ts: Date.now()}; salvarOffs();
  if (!cpNome){ cpNome = eu; store.set('cpnome', eu); }
  fechar('offc'); abrirOffV(r.pacote.i);
};

/* ---- o campeonato ---- */
const medalha = pos => pos >= 1 && pos <= 3 ? ['🥇', '🥈', '🥉'][pos - 1] : pos ? pos + 'º' : '–';
function abrirOffV(id){
  if (!offs[id]) return;
  OFF.id = id; fecharTodos(); aviso('#ovAviso', ''); $('#ovCola').value = '';
  renderOffV(); abrir('offv');
}
function textoRankingOff(p){
  const rk = rankOff(p);
  return tr('Shape Puzzle — campeonato "{c}"', {c: p.n}) + '\n' + rk.map(l => medalha(l.pos) + ' ' + l.nome + (l.feitas ? ' — ' + (l.completo ? fmtTempo(l.t) : l.feitas + '/' + p.f.length + ' · ' + fmtTempo(l.t)) : ' — ' + tr('ainda não jogou'))).join('\n');
}
function renderOffV(){
  const e = offs[OFF.id]; if (!e) return;
  const p = e.p, tem = e.eu != null, feitas = meusOff(e);
  $('#ovTitulo').textContent = p.n;
  $('#ovSub').textContent = qtd(p.f.length, ' fase', ' fases') + ' · ' + qtd(p.j.length, ' jogador', ' jogadores');
  /* quem é você? (só até o primeiro resultado) */
  $('#ovQuem').hidden = tem; $('#ovMeu').hidden = !tem;
  const sel = $('#ovQuemSel'); sel.innerHTML = '';
  p.j.forEach((n, i) => { const o = mk('option', '', n); o.value = i; sel.appendChild(o); });
  $('#ovQuemOk').onclick = () => { e.eu = +sel.value; salvarOffs(); renderOffV(); };
  /* minhas fases */
  if (tem){
    $('#ovMeuTit').textContent = tr('Suas fases, {nome}', {nome: p.j[e.eu]});
    const l = $('#ovFases'); l.innerHTML = '';
    p.f.forEach((ref, i) => {
      const x = feitas[i], d = mk('div', 'lf' + (x ? ' ok' : '')), s = mk('span', '', tr('Fase ' + (i + 1)));
      s.appendChild(mk('small', '', x ? '✓ ' + fmtTempo(x[0]) + ' · ' + fmtJog(x[1]) : rotuloFaseOff(ref)));
      d.appendChild(s);
      const b = icBtn(x ? 'check' : 'play', tr(x ? 'Feita' : 'Jogar') + ': ' + tr('Fase ' + (i + 1)), () => jogarFaseOff(i));
      b.disabled = !!x; d.appendChild(b); l.appendChild(d);
    });
    const tudo = p.f.every((_, i) => feitas[i]);
    $('#ovFim').hidden = !tudo;
  }
  /* ranking */
  const rk = rankOff(p), r = $('#ovRank'); r.innerHTML = '';
  rk.forEach(l => {
    const d = mk('div', 'rk' + (l.idx === e.eu ? ' eu' : ''));
    d.append(mk('span', 'pos', medalha(l.pos)), mk('span', 'nm', l.nome),
      mk('span', 'tm', !l.feitas ? tr('ainda não jogou') : (l.completo ? '' : l.feitas + '/' + p.f.length + ' · ') + fmtTempo(l.t) + (l.completo ? ' · ' + fmtJog(l.jog) : '')));
    linhaClicavel(d, l.nome, () => abrirJogador(l.nome, l.pos, perfilJogador(p.j.map((_, i) => p.r[i] || []), l.idx, p.f.length), p.f.map((_, i) => 'Fase ' + (i + 1))));
    r.appendChild(d);
  });
  /* estatísticas */
  const est = estatOff(p), eb = $('#ovEst'); eb.innerHTML = '';
  if (est.comResultado){
    eb.appendChild(mk('h2', '', tr('Estatísticas')));
    const it = [[est.terminaram + '/' + est.jogadores, 'terminaram tudo'], [fmtTempo(est.tempoTotal), 'tempo somado'], [String(est.jogadasTotal), 'jogadas somadas']];
    if (est.maisRapida) it.push([tr('Fase ' + (est.maisRapida.i + 1)), 'fase mais rápida']);
    if (est.maisDificil) it.push([tr('Fase ' + (est.maisDificil.i + 1)), 'fase mais demorada']);
    eb.appendChild(gradeSv(it));
    est.porFase.filter(f => f.n).forEach(f => {
      const d = mk('div', 'lf'), s = mk('span', '', tr('Fase ' + (f.i + 1)));
      s.appendChild(mk('small', '', tr('Melhor: {nome} {t} · Média: {m} · {n} de {total}', {nome: f.melhor.nome, t: fmtTempo(f.melhor.t), m: fmtTempo(f.media), n: f.n, total: p.j.length})));
      d.appendChild(s); eb.appendChild(d);
    });
  }
  /* QR dos jogadores */
  const cv = $('#ovConvites'); cv.innerHTML = '';
  p.j.forEach((n, i) => {
    if (i === e.eu) return;
    const d = mk('div', 'cust');
    d.append(mk('span', '', n), icBtn('qr', tr('QR code') + ': ' + n, () => {
      compartilhar('Shape Puzzle', tr('{nome}, você foi convidado(a) para o campeonato "{c}" no Shape Puzzle! São {n} fases, cada um joga no seu tempo e no fim vocês comparam os resultados.', {nome: n, c: p.n, n: p.f.length}), urlOff(Object.assign({}, p, {r: {}}), i));
      alternarQR(true);
    }, tr('QR code')));
    cv.appendChild(d);
  });
  $('#ovResultado').hidden = !feitas.some(Boolean);
}
$('#ovResultado').onclick = () => {
  const e = offs[OFF.id], f = meusOff(e), p = e.p, nf = f.filter(Boolean).length, t = f.filter(Boolean).reduce((a, x) => a + x[0], 0);
  compartilhar('Shape Puzzle', tr('{nome} jogou o campeonato "{c}" no Shape Puzzle ({a} de {b} fases, {t} no total). Escaneie o QR code ou abra o link para juntar o resultado.', {nome: p.j[e.eu], c: p.n, a: nf, b: p.f.length, t: fmtTempo(t)}), urlOff(p));
  alternarQR(true);
};
$('#ovRanking').onclick = () => { const p = offs[OFF.id].p; compartilhar('Shape Puzzle', textoRankingOff(p), urlOff(p)); };
$('#ovImportar').onclick = () => {
  const r = lerCodigoOff($('#ovCola').value, BUILTIN.length);
  if (r.erro){ aviso('#ovAviso', r.erro, 'erro'); return; }
  if (r.pacote.i !== OFF.id){ aviso('#ovAviso', 'Esse código é de outro campeonato.', 'erro'); return; }
  const g = importarOff(r);
  if (g.erro){ aviso('#ovAviso', g.erro, 'erro'); return; }
  $('#ovCola').value = ''; renderOffV(); aviso('#ovAviso', 'Resultados juntados.', 'ok');
};
$('#ovExcluir').onclick = () => { if (confirmarTirarOff()){ delete offs[OFF.id]; salvarOffs(); fechar('offv'); abrirOffHub(); } };
