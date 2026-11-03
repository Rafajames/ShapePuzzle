/* ---- criar ---- */
const CR = {fases: []};
const PRESETS = {3: [3, 10, 18], 5: [2, 9, 16, 24, 33], 8: [2, 6, 11, 16, 21, 27, 34, 41]};
const SORTEIOS = {facil: {nome: 'Sorteada (fácil)', o: {n: 5, minEstrelas: 14}}, medio: {nome: 'Sorteada (média)', o: {n: 5, minEstrelas: 7}}, dificil: {nome: 'Sorteada (difícil)', o: {n: 6, minEstrelas: 10, fila: 3}}};
function abrirCriar(edit){
  CR.edit = edit ? {id: CP.id, criado: edit.criado, fim: edit.fim, org: edit.org} : null;
  $('#crTitulo').textContent = tr(edit ? 'Editar campeonato' : 'Novo campeonato');
  $('#crCriar').lastChild.textContent = tr(edit ? 'Salvar alterações' : 'Criar campeonato');
  const pz = $('#crPrazo'); [...pz.querySelectorAll('[value=keep]')].forEach(o => o.remove());
  if (edit){
    CR.fases = edit.fases.map(f => ({nome: f.nome, text: f.text}));
    $('#crNome').value = edit.nome; $('#crMax').value = edit.max; $('#crModo').value = edit.modo;
    if (edit.fim){ pz.insertBefore(new Option(tr('Manter o prazo atual'), 'keep'), pz.firstChild); pz.value = 'keep'; } else pz.value = '0';
  } else if (CR.fases.length && CR.veioDeEdicao){ CR.fases = []; }
  CR.veioDeEdicao = !!edit;
  const sel = $('#crFonte'); sel.innerHTML = '';
  const grupo = (rot, itens) => { if (!itens.length) return; const g = mk('optgroup'); g.label = tr(rot); itens.forEach(([v, t]) => g.appendChild(new Option(t, v))); sel.appendChild(g); };
  grupo('Sortear uma nova fase', [['g:facil', tr('Fácil (5×5)')], ['g:medio', tr('Média (5×5)')], ['g:dificil', tr('Difícil (6×6, fila)')]]);
  grupo('Fases do jogo', BUILTIN.map((f, i) => ['b:' + i, tr('Fase ' + (i + 1))]));
  grupo('Minhas fases', custom.map((f, i) => ['c:' + i, f.nome]));
  if (!CR.fases.length) CR.fases = PRESETS[3].map(i => ({nome: 'Fase ' + (i + 1), text: BUILTIN[i].text}));
  aviso('#crInfo', ''); renderCriar(); abrir('criar');
}
function renderCriar(){
  const l = $('#crFases'); l.innerHTML = '';
  CR.fases.forEach((f, i) => {
    const d = mk('div', 'cust');
    d.append(mk('span', '', (i + 1) + '. ' + tr(f.nome)), icBtn('trash', tr('Remover') + ': ' + tr(f.nome), () => { CR.fases.splice(i, 1); renderCriar(); }));
    l.appendChild(d);
  });
  $('#crQtd').textContent = CR.fases.length;
}
function faseDaFonte(v){
  const [t, x] = v.split(':');
  if (t === 'b') return {nome: 'Fase ' + (parseInt(x, 10) + 1), text: BUILTIN[x].text};
  if (t === 'c') return {nome: custom[x].nome, text: custom[x].text};
  const sc = SORTEIOS[x], f = gerarFase(Math.floor(Math.random() * 1e9) + 1, sc.o);
  return f ? {nome: sc.nome, text: f.text} : null;
}
$('#crAdd').onclick = () => {
  if (CR.fases.length >= MAX_FASES_CAMP){ aviso('#crInfo', 'No máximo ' + MAX_FASES_CAMP + ' fases.', 'erro'); return; }
  const f = faseDaFonte($('#crFonte').value);
  if (!f){ aviso('#crInfo', 'Não consegui sortear agora. Tente de novo.', 'erro'); return; }
  CR.fases.push(f); aviso('#crInfo', ''); renderCriar();
};
document.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => { CR.fases = PRESETS[b.dataset.preset].map(i => ({nome: 'Fase ' + (i + 1), text: BUILTIN[i].text})); renderCriar(); });
$('#crCriar').onclick = async () => {
  const btn = $('#crCriar'); btn.disabled = true;
  try{
    const token = await tokenOrganizador();
    if (!token){ aviso('#crInfo', 'A sessão de organizador acabou. Feche, abra Campeonatos e entre com a senha.', 'erro'); btn.disabled = false; return; }
    const edit = CR.edit, prazo = $('#crPrazo').value;
    const m = montarCampeonato({nome: $('#crNome').value, org: edit ? edit.org : cpAuth.nome, max: $('#crMax').value, modo: $('#crModo').value, prazoDias: prazo === 'keep' ? 0 : prazo, fases: CR.fases, uid: cpAuth.uid}, Date.now());
    if (m.erro){ aviso('#crInfo', m.erro, 'erro'); btn.disabled = false; return; }
    aviso('#crInfo', edit ? 'Salvando…' : 'Criando…');
    let id = edit ? edit.id : '';
    if (edit){
      m.camp.criado = edit.criado; if (prazo === 'keep') m.camp.fim = edit.fim;
    } else for (let t = 0; t < 4 && !id; t++){ const c = novoCodigo(); if (!(await nuvem(cpDb, 'GET', 'c/' + c))) id = c; }
    if (!id) throw erroNuvem('http');
    await nuvem(cpDb, 'PUT', 'c/' + id, m.camp, token);
    lembrarCamp(id, cpDb, m.camp.nome, true);
    CR.fases = []; CR.veioDeEdicao = false; $('#crNome').value = '';
    fechar('criar'); await abrirLobby(id, cpDb);
    toast(edit ? 'Campeonato atualizado.' : 'Campeonato criado! Toque em Convidar para enviar o link.');
  }catch(e){ aviso('#crInfo', e && e.cod === 'negado' ? (CR.edit ? 'Não deu para salvar: alguém já entrou no campeonato (ou a sessão acabou).' : 'O banco recusou. As regras de segurança foram publicadas?') : msgNuvem(e), 'erro'); }
  btn.disabled = false;
};

/* ---- sala ---- */
async function abrirLobby(id, db){
  CP.id = id; CP.db = db; CP.camp = null; CP.jogs = {};
  $('#lbTitulo').textContent = tr('Campeonato'); $('#lbSub').textContent = tr('Carregando…');
  $('#lbEntrar').hidden = true; $('#lbJogo').hidden = true; $('#lbRank').innerHTML = ''; aviso('#lbAviso', '');
  $('#lbNome').value = cpNome;
  abrir('lobby');
  clearInterval(CP.timer); CP.timer = setInterval(() => { if ($('#ov-lobby').classList.contains('on') && !document.hidden) atualizarLobby(true); }, 10000);
  await cpDescarregar();
  await atualizarLobby();
}
async function atualizarLobby(silencioso){
  const id = CP.id, db = CP.db;
  try{
    if (!CP.camp){
      const c = await nuvem(db, 'GET', 'c/' + id);
      if (id !== CP.id) return;
      if (!c){ $('#lbSub').textContent = ''; aviso('#lbAviso', 'Não encontrei esse campeonato. Confira o código.', 'erro'); return; }
      c.fases = listaDe(c.fases); CP.camp = c;
    }
    const jogs = await nuvem(db, 'GET', 'p/' + id) || {};
    if (id !== CP.id) return;
    CP.jogs = jogs; renderLobby(); if (!silencioso) aviso('#lbAviso', '');
  }catch(e){ if (!silencioso || !CP.camp) aviso('#lbAviso', msgNuvem(e), 'erro'); }
}
const prazoTxt = fim => !fim ? tr('sem prazo') : Date.now() > fim ? tr('prazo encerrado') : tr('até') + ' ' + new Date(fim).toLocaleString(LANG_HTML[lang], {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});
/* Estatísticas de um jogador (toque no nome no ranking). nomesFases: nome de cada fase. */
function abrirJogador(nome, pos, perfil, nomesFases){
  $('#jgNome').textContent = tr('Estatísticas de {nome}', {nome});
  $('#jgSub').textContent = (pos ? tr('Posição {pos}', {pos}) + ' · ' : '') + tr('{a} de {b} fases concluídas', {a: perfil.feitas, b: perfil.total});
  const g = $('#jgGrade'); g.innerHTML = '';
  if (perfil.feitas) g.appendChild(gradeSv([[fmtTempo(perfil.tempo), 'tempo total'], [String(perfil.jog), 'jogadas'], [fmtTempo(perfil.medio), 'tempo médio por fase'], [perfil.melhores + '/' + perfil.feitas, 'fases com o melhor tempo']]));
  const l = $('#jgFases'); l.innerHTML = '';
  perfil.fases.forEach((f, i) => {
    const d = mk('div', 'lf' + (f.r ? ' ok' : '')), s = mk('span', '', (i + 1) + '. ' + tr(nomesFases[i]));
    s.appendChild(mk('small', '', !f.r ? tr('Ainda não jogada') : fmtTempo(f.r[0]) + ' · ' + fmtJog(f.r[1]) + ' · ' + tr('{pos}º de {n}', {pos: f.pos, n: f.n}) + (f.pos === 1 ? ' 🏆' : ' · ' + tr('melhor: {t}', {t: fmtTempo(f.melhor)}))));
    d.appendChild(s); l.appendChild(d);
  });
  abrir('jog');
}
/* linha de ranking que abre as estatísticas ao tocar (ou Enter/Espaço) */
function linhaClicavel(d, nome, abrirFn){
  d.classList.add('clic'); d.tabIndex = 0; d.setAttribute('role', 'button'); d.setAttribute('aria-label', tr('Ver estatísticas de {nome}', {nome}));
  d.appendChild(mk('span', 'seta', '›')); d.onclick = abrirFn;
  d.onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); abrirFn(); } };
}
function renderLobby(){
  const c = CP.camp, key = cpKey(), eu = CP.jogs[key], n = Object.keys(CP.jogs).length, encerrado = c.fim && Date.now() > c.fim;
  $('#lbTitulo').textContent = c.nome;
  $('#lbSub').innerHTML = '';
  $('#lbSub').append(tr('Organizado por {org} · {n} de {max} pessoas · {fases} · {prazo} · {modo} · código', {org: c.org, n, max: c.max, fases: qtd(c.fases.length, ' fase', ' fases'), prazo: prazoTxt(c.fim), modo: tr(c.modo === 'melhor' ? 'vale o melhor tempo' : 'vale a primeira vez')}) + ' ');
  $('#lbSub').appendChild(mk('span', 'cod', CP.id));
  $('#lbEntrar').hidden = !!eu; $('#lbJogo').hidden = !eu;
  const dono = souDono(), vazio = n === 0;
  $('#lbOrg').hidden = !dono; $('#lbSouOrg').hidden = dono || !c.uid; if (dono){ $('#lbSouOrgForm').hidden = true; }
  $('#lbEditar').disabled = !vazio;
  $('#lbOrgInfo').textContent = tr(vazio ? 'Você pode editar enquanto ninguém entrar. Quando alguém entrar (inclusive você), só dá para excluir.' : 'Já tem gente no campeonato: não dá mais para editar, só excluir.');
  if (!eu && encerrado) $('#lbEntrar').hidden = true;
  if (!eu && n >= c.max) aviso('#lbAviso', 'Este campeonato já está com todas as vagas preenchidas.', 'erro');
  const l = $('#lbFases'); l.innerHTML = '';
  c.fases.forEach((f, i) => {
    const r = eu && eu.f && eu.f[i], d = mk('div', 'lf' + (r ? ' ok' : '')), sp = mk('span');
    sp.append((i + 1) + '. ' + tr(f.nome), mk('small', '', r ? '✓ ' + fmtTempo(r.t) + ' · ' + fmtJog(r.j) : tr('Ainda não jogada')));
    const b = mk('button', 'btn sm' + (r ? '' : ' pri'), tr(r ? (c.modo === 'melhor' ? 'Melhorar' : 'Feita') : 'Jogar'));
    b.disabled = encerrado || (r && c.modo === 'primeira'); b.onclick = () => jogarFaseCamp(i); d.append(sp, b); l.appendChild(d);
  });
  const rk = rankear(c, CP.jogs), caixa = $('#lbRank'); caixa.innerHTML = '';
  if (!rk.length) caixa.innerHTML = '<p class="vazio2">' + tr('Ninguém entrou ainda.') + '</p>';
  rk.forEach(r => {
    const d = mk('div', 'rk' + (r.key === key ? ' eu' : ''));
    d.append(mk('span', 'pos', r.feitas && r.pos <= 3 ? ['🥇', '🥈', '🥉'][r.pos - 1] : tr(r.pos + 'º')), mk('span', 'nm', r.nome),
      mk('span', 'tm', r.feitas + '/' + c.fases.length + (r.feitas ? ' · ' + fmtTempo(r.tempo) : '')));
    linhaClicavel(d, r.nome, () => {
      const chaves = Object.keys(CP.jogs), N = c.fases.length;
      const todos = chaves.map(k => Array.from({length: N}, (_, i) => { const x = (CP.jogs[k].f || {})[i]; return x && x.t > 0 ? [x.t, x.j || 0] : null; }));
      abrirJogador(r.nome, r.feitas ? r.pos : 0, perfilJogador(todos, chaves.indexOf(r.key), N), c.fases.map(f => f.nome));
    });
    caixa.appendChild(d);
  });
  if (encerrado) aviso('#lbAviso', 'Prazo encerrado. Esse é o resultado final.', '');
}
$('#lbEntrarBtn').onclick = async () => {
  if (!exigirNome('#lbNome', '#lbAviso')) return;
  const c = CP.camp; if (!c) return;
  try{
    const jogs = await nuvem(CP.db, 'GET', 'p/' + CP.id) || {}, k = cpKey();
    if (!jogs[k]){
      if (c.fim && Date.now() > c.fim){ aviso('#lbAviso', 'O prazo já acabou.', 'erro'); return; }
      if (Object.keys(jogs).length >= c.max){ aviso('#lbAviso', 'Este campeonato já está com todas as vagas preenchidas.', 'erro'); return; }
      await nuvem(CP.db, 'PUT', `p/${CP.id}/${k}`, {n: cpNome, ts: Date.now()});
    }
    lembrarCamp(CP.id, CP.db, c.nome, cpMeus.some(x => x.id === CP.id && x.org));
    await atualizarLobby(); aviso('#lbAviso', '');
  }catch(e){ aviso('#lbAviso', msgNuvem(e), 'erro'); }
};
$('#lbSouOrgBtn').onclick = () => { $('#lbSouOrgForm').hidden = !$('#lbSouOrgForm').hidden; };
$('#lbSenhaOk').onclick = async () => {
  const c = CP.camp; if (!c) return;
  try{
    await authEntrar(c.org, $('#lbSenha').value, false);
    if (cpAuth.uid !== c.uid){ esquecerAuth(); aviso('#lbAviso', 'Essa conta de organizador não é a dona deste campeonato.', 'erro'); return; }
    $('#lbSenha').value = ''; aviso('#lbAviso', 'Pronto: você está como organizador neste aparelho.', 'ok'); renderLobby();
  }catch(e){ aviso('#lbAviso', msgNuvem(e), 'erro'); }
};
$('#lbEditar').onclick = () => { if (CP.camp && souDono()){ fechar('lobby'); abrirCriar(CP.camp); } };
$('#lbExcluir').onclick = async () => {
  const c = CP.camp; if (!c || !souDono()) return;
  if (!confirm(tr('Excluir o campeonato "{nome}"? O ranking e todos os resultados serão apagados e não dá para desfazer.', {nome: c.nome}))) return;
  try{
    const token = await tokenOrganizador();
    if (!token){ renderLobby(); aviso('#lbAviso', 'A sessão de organizador acabou. Entre com a senha de novo.', 'erro'); return; }
    await nuvem(CP.db, 'DELETE', 'p/' + CP.id, undefined, token);
    await nuvem(CP.db, 'DELETE', 'c/' + CP.id, undefined, token);
    cpMeus = cpMeus.filter(x => x.id !== CP.id); store.set('cpmeus', cpMeus);
    clearInterval(CP.timer); fechar('lobby'); toast('Campeonato excluído.');
  }catch(e){ aviso('#lbAviso', msgNuvem(e), 'erro'); }
};
$('#lbAtualizar').onclick = async () => { aviso('#lbAviso', 'Atualizando…'); const msgAtu = $('#lbAviso').textContent; await atualizarLobby(); if ($('#lbAviso').textContent === msgAtu) aviso('#lbAviso', ''); };
$('#lbConvidar').onclick = () => {
  const c = CP.camp; if (!c) return;
  compartilhar('Shape Puzzle — campeonato', tr('Venha disputar o campeonato "{nome}" no Shape Puzzle! {fases}, ganha quem for mais rápido. Código: {id}', {nome: c.nome, fases: qtd(c.fases.length, ' fase', ' fases'), id: CP.id}), urlConvite(CP.id, CP.db));
};
function jogarFaseCamp(i){
  const c = CP.camp, f = c.fases[i]; if (!f) return;
  if (c.fim && Date.now() > c.fim){ toast('O prazo deste campeonato acabou.'); return; }
  fecharTodos();
  carregar({k: 'x', camp: CP.id, db: CP.db, campNome: c.nome, idx: i, total: c.fases.length, modo: c.modo, fim: c.fim, nome: f.nome, text: f.text});
  toast('Valendo! O tempo já está correndo e as dicas ficam desligadas.');
}
/* ---- resultado ---- */
async function cpEnviarResultado(c, res){
  const p = {id: c.camp, db: c.db, key: cpKey(), idx: c.idx, t: res.t, j: res.j, modo: c.modo};
  if (c.fim && Date.now() > c.fim) return tr('O prazo acabou: este resultado não entra no ranking.');
  try{
    const r = await cpEnviarUm(p);
    return tr(r === 'ok' ? 'Resultado enviado! Veja a sua posição no ranking.'
      : p.modo === 'primeira' ? 'Neste campeonato vale só o primeiro resultado de cada fase.' : 'Você já tinha um tempo melhor nesta fase — ele continua valendo.');
  }catch(e){
    if (e.cod === 'rede' || e.cod === 'tempo'){ cpPend.push(p); store.set('cppend', cpPend); return tr('Sem conexão: guardei o seu resultado e envio quando voltar.'); }
    return tr('Não consegui enviar: {m}', {m: tr(msgNuvem(e))});
  }
}
function vitoriaCamp(c, res, add){
  cpEnviarResultado(c, res).then(msg => { $('#winTexto').textContent = msg; });
  const proxima = c.idx + 1 < c.total && CP.camp && CP.id === c.camp && CP.camp.fases[c.idx + 1];
  if (proxima) add('Próxima fase do campeonato', 'pri', () => setTimeout(() => jogarFaseCamp(c.idx + 1), 50));
  add('Ver ranking', proxima ? '' : 'pri', () => setTimeout(() => abrirLobby(c.camp, c.db), 50), 'trophy');
}


