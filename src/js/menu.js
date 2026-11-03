/* ---- botões do topo / ferramentas ---- */
$('#btnGirar').onclick = acaoGirar;
$('#btnFlip').onclick = acaoFlip;
$('#btnDica').onclick = acaoDica;
$('#btnDesfazer').onclick = acaoDesfazer;
$('#btnReset').onclick = () => { if (ehCamp(S.cur)){ carregar(S.cur, true); toast('Tabuleiro limpo. O tempo do campeonato continua correndo.'); } else carregar(S.cur); };
$('#btnMenu').onclick = () => abrirMenu();
function iconeMusica(){
  const b = $('#btnMusica'); b.classList.toggle('off', !Som.musica());
  b.innerHTML = ic(Som.musica() ? 'note' : 'noteoff');
  b.setAttribute('aria-pressed', Som.musica());
}
$('#btnMusica').onclick = () => { Som.setMusica(!Som.musica()); iconeMusica(); $('#chkMusica').checked = Som.musica(); };
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => fechar(b.dataset.close));
document.querySelectorAll('.ov').forEach(o => o.addEventListener('pointerdown', e => { if (e.target === o && o.id !== 'ov-splash' && o.id !== 'ov-win') o.classList.remove('on'); }));
$('#btnJogar').onclick = () => { Som.iniciar(); aplicarHumor(); fechar('splash'); iconeMusica(); if (CP.convite){ const c = CP.convite; CP.convite = null; abrirLobby(c.id, c.db); }
  if (OFF.pendente){ const id = OFF.pendente; OFF.pendente = null; abrirOffV(id); } };

/* ---- menu ---- */
function renderDiario(){
  const hoje = dataHoje(), feito = dias[hoje], seq = sequencia();
  $('#diaSub').textContent = dataCurta(hoje) + ' · ' + tr('um desafio novo por dia') + (seq ? ' · 🔥 ' + qtd(seq, ' dia', ' dias') : '');
  $('#diaTag').textContent = feito ? '✓ ' + fmtTempo(feito.t) : tr('Jogar');
  const ch = semanaDe(hoje), feitoS = sem[ch], sq = sequenciasSemanas(sem, hoje).atual;
  $('#semSub').textContent = nomeSemana(ch) + ' · ' + tr('um desafio difícil por semana') + (sq ? ' · 🔥 ' + qtd(sq, ' semana', ' semanas') : '');
  $('#semTag').textContent = feitoS ? '✓ ' + fmtTempo(feitoS.t) : tr('Jogar');
  $('#corrSub').textContent = corr.melhor ? tr('Recorde: {n}', {n: qtd(corr.melhor, ' fase', ' fases')}) : tr('Quantas fases em 3 minutos?');
}
function abrirMenu(){
  const t = $('#tiles'); t.innerHTML = '';
  BUILTIN.forEach((f, i) => {
    const feito = prog.done.includes(i), trancada = i > prog.max && !modoTeste;
    const b = mk('button', 'tile' + (feito ? ' done' : '') + (trancada ? ' lock' : '') + (S.cur && S.cur.k === 'b' && S.cur.i === i ? ' atual' : ''));
    b.disabled = trancada;
    b.innerHTML = `<span>${i + 1}</span>` + (feito ? ic('check') : '') + (trancada ? ic('lock') : '') + (feito && estrelasFase[i] ? `<span class="est" aria-hidden="true">${'★'.repeat(estrelasFase[i])}</span>` : '');
    b.setAttribute('aria-label', tr('Fase ' + (i + 1)) + (feito ? ', ' + tr('concluída') + (estrelasFase[i] ? ', ' + tr(estrelasFase[i] === 1 ? '1 estrela de 3' : estrelasFase[i] + ' estrelas de 3') : '') : '') + (trancada ? ', ' + tr('bloqueada') : ''));
    b.onclick = () => { fechar('menu'); carregar({k: 'b', i}); };
    t.appendChild(b);
  });
  renderDiario(); renderCustom(); atualizarInstalar(); renderTeste();
  $('#chkMusica').checked = Som.musica(); $('#chkSfx').checked = Som.sfx(); $('#rngVol').value = Math.round(Som.volume() * 100);
  $('#selHumor').value = humorPref;
  $('#selPecas').value = String(pecasPref);
  $('#chkVibra').checked = vibraOn; $('#rowVibra').hidden = !navigator.vibrate;
  renderAtualizacao(); msgAtualizacao('');
  $('#selIdioma').value = lang; $('#selTema').value = tema; $('#chkDalt').checked = !!a11y.dalt; $('#chkCont').checked = !!a11y.cont; $('#chkTexto').checked = !!a11y.texto; $('#chkMov').checked = !!a11y.mov;
  abrir('menu');
}
function renderCustom(){
  const l = $('#customList'); l.innerHTML = '';
  if (!custom.length){ l.innerHTML = '<p class="vazio2">' + tr('Você ainda não criou nenhuma fase.') + '</p>'; return; }
  custom.forEach((f, i) => {
    const r = mk('div', 'cust'); r.append(mk('span', '', f.nome));
    const add = (icone, label, fn) => r.appendChild(icBtn(icone, tr(label) + ': ' + f.nome, fn, tr(label)));
    add('play', 'Jogar', () => { fechar('menu'); carregar({k: 'c', i}); });
    add('share', 'Compartilhar', () => compartilhar('Shape Puzzle', `Tente a fase "${f.nome}" que eu criei no Shape Puzzle!`, urlFase(f.text, f.nome)));
    add('download', 'Exportar', () => baixar(f.nome, f.text));
    add('trash', 'Apagar', () => { if (confirm(tr('Apagar a fase "{nome}"?', {nome: f.nome}))){ custom.splice(i, 1); store.set('custom', custom); if (S.cur.k === 'c') carregar({k: 'b', i: 0}); renderCustom(); } });
    l.appendChild(r);
  });
}
$('#btnDia').onclick = () => {
  fechar('menu'); toast('Preparando a fase do dia…');
  setTimeout(() => carregar({k: 'd', data: dataHoje()}), 30);
};
$('#chkMusica').onchange = e => { Som.setMusica(e.target.checked); iconeMusica(); };
const salvarA11y = (k, v) => { a11y[k] = v; store.set('a11y', a11y); aplicarA11y(); aplicarHumor(); };
$('#selTema').onchange = e => { tema = e.target.value; store.set('tema', tema); aplicarTema(); aplicarHumor(); anunciar(tr('Tema alterado.')); };
if (mqClaro.addEventListener) mqClaro.addEventListener('change', () => { if (tema === 'auto') aplicarHumor(); });
$('#chkDalt').onchange = e => salvarA11y('dalt', e.target.checked);
$('#chkCont').onchange = e => salvarA11y('cont', e.target.checked);
$('#chkTexto').onchange = e => salvarA11y('texto', e.target.checked);
$('#chkMov').onchange = e => salvarA11y('mov', e.target.checked);
$('#selIdioma').onchange = e => {
  lang = e.target.value; store.set('lang', lang); aplicarIdioma();
  renderTudo(); renderDiario(); renderCustom(); abrirMenu(); if (window.atualizarTuto) atualizarTuto();
};
$('#chkVibra').onchange = e => { vibraOn = e.target.checked; store.set('vibra', vibraOn); if (vibraOn) vibrar(30); };
$('#chkSfx').onchange = e => Som.setSfx(e.target.checked);
$('#rngVol').oninput = e => Som.setVolume(e.target.value / 100);
$('#selPecas').onchange = e => { pecasPref = e.target.value === 'auto' ? 'auto' : +e.target.value; store.set('pecas', pecasPref); aplicarPecas(); toast(pecasPref === 'auto' ? 'Peças por vez: automático, de acordo com a fase.' : pecasPref === 99 ? 'Agora todas as peças aparecem de uma vez.' : 'Agora aparecem ' + pecasPref + ' peças por vez.'); };
$('#selHumor').onchange = e => { humorPref = e.target.value; store.set('humor', humorPref); aplicarHumor(); };
function renderTeste(){ const b = $('#btnTeste'); b.lastChild.textContent = tr(modoTeste ? 'Sair do modo de teste' : 'Modo de teste'); }
$('#btnTeste').onclick = () => {
  if (modoTeste){ modoTeste = false; store.set('teste', false); renderTeste(); abrirMenu(); renderTitulo(); toast('Modo de teste desligado.'); return; }
  $('#tsSenha').value = ''; aviso('#tsAviso', ''); fechar('menu'); abrir('teste'); setTimeout(() => $('#tsSenha').focus(), 50);
};
async function entrarTeste(){
  if (!(window.crypto && crypto.subtle)){ aviso('#tsAviso', 'Este navegador não permite conferir a senha aqui (precisa de conexão segura, https).', 'erro'); return; }
  const h = await hashSenha($('#tsSenha').value);
  if (h !== TESTE_HASH){ aviso('#tsAviso', 'Senha incorreta.', 'erro'); return; }
  modoTeste = true; store.set('teste', true); fechar('teste'); renderTeste(); renderTitulo(); abrirMenu(); toast('Modo de teste ligado: todas as fases liberadas.');
}
$('#tsEntrar').onclick = entrarTeste;
$('#tsSenha').addEventListener('keydown', e => { if (e.key === 'Enter') entrarTeste(); });
$('#btnZerar').onclick = () => { if (confirm(tr('Zerar o progresso das fases? (Seus recordes e fases criadas continuam salvos.)'))){ prog = {max: 0, done: []}; store.set('prog', prog); carregar({k: 'b', i: 0}); abrirMenu(); } };
$('#btnCriar').onclick = () => { fechar('menu'); abrirEditor(); };
$('#btnCamp').onclick = () => { fechar('menu'); abrirCamps(); };
$('#btnImportar').onclick = () => $('#fileImp').click();
$('#btnCompJogo').onclick = () => compartilhar('Shape Puzzle', 'Joga esse quebra-cabeça comigo: Shape Puzzle!', urlBase());
$('#fileImp').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const texto = await f.text();
  if (!faseValida(texto)){ toast('Arquivo de fase inválido'); return; }
  salvarCustom(f.name.replace(/\.txt$/i, '').slice(0, 30) || 'fase-importada', texto);
  renderCustom(); toast('Fase importada');
};
function salvarCustom(nome, text){
  const i = custom.findIndex(f => f.nome === nome);
  if (i >= 0) custom[i] = {nome, text}; else custom.push({nome, text});
  store.set('custom', custom);
}
function baixar(nome, texto){
  const a = mk('a');
  a.href = URL.createObjectURL(new Blob([texto], {type: 'text/plain'}));
  a.download = (nome || 'fase') + '.txt'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---- instalar como app ---- */
let promptInstalar = null;
const emApp = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const ehIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function atualizarInstalar(){
  const mostrarBtn = !!promptInstalar && !emApp(), mostrarIOS = ehIOS() && !emApp() && !promptInstalar;
  $('#btnInstalar').hidden = !mostrarBtn; $('#dicaIOS').hidden = !mostrarIOS;
  $('#blocoInstalar').hidden = !(mostrarBtn || mostrarIOS);
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); promptInstalar = e; atualizarInstalar(); });
window.addEventListener('appinstalled', () => { promptInstalar = null; atualizarInstalar(); toast('Jogo instalado!'); });
$('#btnInstalar').onclick = async () => {
  if (!promptInstalar) return;
  promptInstalar.prompt();
  try{ await promptInstalar.userChoice; }catch(e){}
  promptInstalar = null; atualizarInstalar();
};
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});


