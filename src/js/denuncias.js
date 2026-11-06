/* ======================= Denunciar e bloquear =======================
   Qualquer pessoa pode denunciar um jogador (apelido, avatar) ou um campeonato. A denúncia vai para "den" no banco,
   onde só o dono do jogo lê (pelo console do Firebase). Bloquear é só neste aparelho: o nome e o avatar somem dos rankings. */
let bloq = store.get('bloq', {});                 /* {chave: nome} */
let denunciados = store.get('denunciados', []);   /* "tipo:alvo" já denunciados (uma vez basta) */
/* a chave de um jogador: começo do id da conta (salas gerais e ranking) ou a chave do nome (salas entre amigos) */
const chaveBloq = k => String(k || '').slice(0, 24);
const bloqueado = k => !!k && Object.prototype.hasOwnProperty.call(bloq, chaveBloq(k));
const Den = {alvo: null};
/* botão "⋯" que abre denunciar/bloquear para uma linha de ranking */
function botaoDenuncia(alvo){
  const b = icBtn('dots', tr('Denunciar ou bloquear {nome}', {nome: alvo.nome}), e => { e.stopPropagation(); abrirDenuncia(alvo); });
  b.classList.add('rkMais'); b.onkeydown = e => e.stopPropagation();
  return b;
}
/* alvo = {tipo: 'jogador'|'camp', chave, nome, sala?, av?, mold?, fun?} */
function abrirDenuncia(alvo){
  Den.alvo = alvo;
  const jog = alvo.tipo === 'jogador';
  $('#dnTitulo').textContent = tr(jog ? 'Denunciar ou bloquear' : 'Denunciar campeonato');
  $('#dnAv').textContent = ''; if (jog) $('#dnAv').appendChild(avatarEl(visualDe(alvo), 40));
  $('#dnNome').textContent = alvo.nome;
  $('#dnBloqBox').hidden = !jog;
  document.querySelectorAll('[name=dnMot]').forEach((r, i) => { r.checked = i === 0; });
  $('#dnMotTrapaca').hidden = !jog;
  const ja = denunciados.includes(alvo.tipo + ':' + chaveBloq(alvo.chave));
  $('#dnEnviar').disabled = ja;
  aviso('#dnAviso', ja ? 'Você já denunciou. Obrigado!' : '');
  renderBloq();
  abrir('denuncia');
}
function renderBloq(){
  const a = Den.alvo; if (!a || a.tipo !== 'jogador') return;
  const b = bloqueado(a.chave);
  $('#dnBloquear').lastChild.textContent = ' ' + tr(b ? 'Desbloquear' : 'Bloquear');
  $('#dnBloqTxt').textContent = tr(b ? 'Essa pessoa está bloqueada neste aparelho.' : 'O nome e o avatar dessa pessoa deixam de aparecer para você nos rankings.');
}
async function enviarDenuncia(){
  const a = Den.alvo; if (!a) return;
  const motivo = ([...document.querySelectorAll('[name=dnMot]')].find(r => r.checked) || {}).value || 'outro';
  $('#dnEnviar').disabled = true; aviso('#dnAviso', 'Enviando…');
  try{
    let tk = null, por = '';
    if (conta){ try{ tk = await contaToken(); if (tk) por = conta.uid; }catch(e){} }
    await nuvem(cpDb, 'POST', 'den', {tipo: a.tipo, alvo: chaveBloq(a.chave), sala: a.sala || '', nome: String(a.nome || '').slice(0, 40), motivo, ts: Date.now(), por}, tk || undefined);
    denunciados = [...denunciados, a.tipo + ':' + chaveBloq(a.chave)].slice(-300); store.set('denunciados', denunciados);
    aviso('#dnAviso', 'Denúncia enviada. Obrigado! A moderação vai analisar.', 'ok');
  }catch(e){ $('#dnEnviar').disabled = false; aviso('#dnAviso', msgNuvem(e), 'erro'); }
}
function alternarBloqueio(){
  const a = Den.alvo; if (!a || a.tipo !== 'jogador') return;
  const k = chaveBloq(a.chave);
  if (bloqueado(k)) delete bloq[k]; else bloq[k] = String(a.nome || '').slice(0, 20);
  store.set('bloq', bloq); renderBloq();
  aviso('#dnAviso', bloqueado(k) ? 'Bloqueado. Você não vai mais ver essa pessoa nos rankings.' : 'Desbloqueado.', 'ok');
  atualizarListasBloq();
}
/* redesenha o que estiver aberto (ranking geral, sala, lista de bloqueados) */
function atualizarListasBloq(){
  if ($('#ov-lobby').classList.contains('on') && CP.camp) renderLobby();
  if ($('#ov-rank').classList.contains('on') && Rk.ultimo) renderRanking(Rk.ultimo);
  if ($('#ov-conta').classList.contains('on')) montarBloqueados();
}
/* lista de bloqueados na tela Meu perfil */
function montarBloqueados(){
  const ks = Object.keys(bloq), l = $('#cnBloqLista'); l.textContent = '';
  $('#cnSecBloq').hidden = !ks.length;
  $('#cnTitBloq').textContent = tr('Jogadores bloqueados') + ' (' + ks.length + ')';
  ks.forEach(k => {
    const d = mk('div', 'cust');
    d.append(mk('span', '', bloq[k] || k), icBtn('close', tr('Desbloquear') + ': ' + (bloq[k] || k), () => { delete bloq[k]; store.set('bloq', bloq); montarBloqueados(); atualizarListasBloq(); }));
    l.appendChild(d);
  });
}
$('#dnEnviar').onclick = enviarDenuncia;
$('#dnBloquear').onclick = alternarBloqueio;
$('#lbDenunciar').onclick = () => { const c = CP.camp; if (c) abrirDenuncia({tipo: 'camp', chave: CP.id, nome: c.nome, sala: CP.id}); };
