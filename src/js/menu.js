/* ---- botões do topo / ferramentas ---- */
$('#btnGirar').onclick = acaoGirar;
$('#btnFlip').onclick = acaoFlip;
$('#btnDica').onclick = acaoDica;
$('#btnDesfazer').onclick = acaoDesfazer;
$('#btnReset').onclick = () => { if (ehCamp(S.cur)){ carregar(S.cur, true); toast('Tabuleiro limpo. O tempo do campeonato continua correndo.'); } else carregar(S.cur); };
$('#btnMenu').onclick = () => abrirMenu();
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => fechar(b.dataset.close));
document.querySelectorAll('.ov').forEach(o => o.addEventListener('pointerdown', e => { if (e.target === o && o.id !== 'ov-splash' && o.id !== 'ov-win') o.classList.remove('on'); }));
function sairDaAbertura(){ Som.iniciar(); aplicarHumor(); fechar('splash'); }
$('#btnJogar').onclick = () => { sairDaAbertura(); if (CP.convite){ const c = CP.convite; CP.convite = null; abrirLobby(c.id, c.db); }
  if (OFF.pendente){ const id = OFF.pendente; OFF.pendente = null; abrirOffV(id); } };
/* atalhos da tela inicial: se há um convite esperando, ele vem primeiro */
const atalhoInicio = fn => () => { if (CP.convite || OFF.pendente) return $('#btnJogar').onclick(); sairDaAbertura(); fn(); };
$('#hDia').onclick = atalhoInicio(() => $('#btnDia').onclick());
$('#hSem').onclick = atalhoInicio(() => $('#btnSem').onclick());
$('#hInf').onclick = atalhoInicio(() => $('#btnInf').onclick());
$('#hCamp').onclick = atalhoInicio(() => $('#btnCamp').onclick());
$('#hEst').onclick = atalhoInicio(() => $('#btnEst').onclick());
$('#hMenu').onclick = atalhoInicio(() => abrirMenu());
const irInicio = () => { fecharTodos('ov-splash'); renderInicio(); $('#ov-splash').classList.add('on'); };
$('#btnInicio').onclick = irInicio; $('#btnCasa').onclick = irInicio;
/* Tela inicial: a próxima fase em destaque (miniatura, progresso, Continuar), a fase do dia e os outros modos. */
function renderInicio(){
  if (window.__pronto){ renderConta(); renderPosicao(); }
  renderDiaInicio(); renderMissoesInicio(); renderNatalInicio();
  if (!S.jogo) return;
  const volta = prog.done.length > 0 || !!andamento, c = S.cur, j = S.jogo;
  $('#jogarTxt').textContent = tr(volta ? 'Continuar' : 'Jogar');
  const sub = $('#jogarSub');
  const txt = !volta ? '' : c && c.k === 'b' ? tr('Fase ' + (c.i + 1)) : c && c.k === 'u' ? '' : tr('Sua fase em andamento');
  sub.textContent = txt; sub.hidden = !txt;
  $('#hRotulo').textContent = tr(!volta ? 'Comece aqui' : j.mapa.size || (c && c.k !== 'b') ? 'Em andamento' : 'Próxima fase');
  $('#hDesc').textContent = volta ? S.n + '×' + S.n + ' · ' + qtd(j.total, ' peça', ' peças') : tr('Preencha todo o tabuleiro com as peças.');
  const est = c && c.k === 'b' ? estrelasFase[c.i] || 0 : 0, he = $('#hEstr');
  he.hidden = !est;
  if (est){
    he.innerHTML = [1, 2, 3].map(n => ic('star').replace('class="i"', 'class="i' + (n <= est ? ' on' : '') + '"')).join('');
    he.setAttribute('aria-label', tr(est === 1 ? '1 estrela de 3' : est + ' estrelas de 3')); he.setAttribute('role', 'img');
  }
  const total = fasesVisiveis(), feitas = Math.min(prog.done.length, total);
  $('#hProg').hidden = !volta;
  $('#hProgTxt').textContent = tr('{a} de {b}', {a: feitas, b: total});
  $('#hProgBar').style.width = Math.round(feitas / Math.max(1, total) * 100) + '%';
  miniTabuleiro();
}
/* miniatura do tabuleiro atual: peças já encaixadas e as estrelas que faltam cobrir */
function miniTabuleiro(){
  const m = $('#hMini'), j = S.jogo; m.textContent = ''; m.style.setProperty('--n', S.n);
  for (let y = 0; y < S.n; y++) for (let x = 0; x < S.n; x++){
    const idu = j.grade[y][x], est = j.gab[y][x], c = mk('i');
    if (idu){ const p = j.mapa.get(idu); c.className = 'f'; c.style.setProperty('--c', COR[p ? p.id : 1]); }
    else if (est){ c.className = 's'; c.style.setProperty('--c', COR[est]); }
    m.appendChild(c);
  }
}
/* cartão da fase do dia: data, sequência, contagem até a meia-noite e o prêmio */
function renderDiaInicio(){
  const agora = new Date(), hoje = dataHoje(), feito = dias[hoje], seq = sequencia();
  let mes = '';
  try{ mes = agora.toLocaleDateString(document.documentElement.lang || undefined, {month: 'short'}).replace('.', ''); }catch(e){}
  $('#hDiaMes').textContent = mes; $('#hDiaNum').textContent = String(agora.getDate()).padStart(2, '0');
  $('#hDiaSeq').textContent = seq ? '🔥 ' + qtd(seq, ' dia', ' dias') + ' · ' : '';
  const b = $('#hDia'); b.classList.toggle('feito', !!feito); b.dataset.hoje = hoje;
  $('#hDiaPremio').textContent = feito ? '' : '+' + BONUS_DIA + ' ★';
  $('#hDiaTag').textContent = feito ? '✓ ' + fmtTempo(feito.t) : tr('Jogar');
  relogioDia();
}
function relogioDia(){
  const a = new Date(), meia = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 1), s = Math.max(0, Math.floor((meia - a) / 1000));
  const t = String(Math.floor(s / 3600)).padStart(2, '0') + ':' + String(Math.floor(s / 60) % 60).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  $('#hDiaRel').textContent = tr(dias[dataHoje()] ? 'nova em {t}' : 'termina em {t}', {t});
}
setInterval(() => {
  if (!$('#ov-splash').classList.contains('on') || document.hidden) return;
  if ($('#hDia').dataset.hoje !== dataHoje()) renderDiaInicio(); else relogioDia();
}, 1000);

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
  for (let i = 0, total = fasesVisiveis(); i < total; i++){
    const feito = prog.done.includes(i), trancada = i > prog.max && !modoTeste;
    const b = mk('button', 'tile' + (feito ? ' done' : '') + (trancada ? ' lock' : '') + (S.cur && S.cur.k === 'b' && S.cur.i === i ? ' atual' : ''));
    b.disabled = trancada;
    b.innerHTML = `<span>${i + 1}</span>` + (feito ? ic('check') : '') + (trancada ? ic('lock') : '') + (feito && estrelasFase[i] ? `<span class="est" aria-hidden="true">${'★'.repeat(estrelasFase[i])}</span>` : '');
    b.setAttribute('aria-label', tr('Fase ' + (i + 1)) + (feito ? ', ' + tr('concluída') + (estrelasFase[i] ? ', ' + tr(estrelasFase[i] === 1 ? '1 estrela de 3' : estrelasFase[i] + ' estrelas de 3') : '') : '') + (trancada ? ', ' + tr('bloqueada') : ''));
    b.onclick = () => { fechar('menu'); carregar({k: 'b', i}); };
    t.appendChild(b);
  }
  renderDiario(); renderCustom(); atualizarInstalar(); renderTeste();
  $('#chkMusica').checked = Som.musica(); $('#chkSfx').checked = Som.sfx(); $('#rngVol').value = Math.round(Som.volume() * 100);
  $('#selHumor').value = humorPref;
  $('#selPecas').value = String(pecasPref);
  $('#chkVibra').checked = vibraOn; $('#rowVibra').hidden = !navigator.vibrate; renderLembretes();
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
$('#chkMusica').onchange = e => Som.setMusica(e.target.checked);
const salvarA11y = (k, v) => { a11y[k] = v; store.set('a11y', a11y); aplicarA11y(); aplicarHumor(); };
$('#selTema').onchange = e => { tema = e.target.value; store.set('tema', tema); aplicarTema(); aplicarHumor(); anunciar(tr('Tema alterado.')); };
if (mqClaro.addEventListener) mqClaro.addEventListener('change', () => { if (tema === 'auto') aplicarHumor(); });
$('#chkDalt').onchange = e => salvarA11y('dalt', e.target.checked);
$('#chkCont').onchange = e => salvarA11y('cont', e.target.checked);
$('#chkTexto').onchange = e => salvarA11y('texto', e.target.checked);
$('#chkMov').onchange = e => salvarA11y('mov', e.target.checked);
Object.entries(IDIOMAS).sort((a, b) => a[1].localeCompare(b[1], 'pt')).forEach(([l, nome]) => { const o = mk('option', '', nome); o.value = l; $('#selIdioma').appendChild(o); });
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
  const mostrarBtn = !NATIVO && !!promptInstalar && !emApp(), mostrarIOS = !NATIVO && ehIOS() && !emApp() && !promptInstalar;
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
if (!NATIVO && 'serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});



/* ---- Voltar do aparelho (deslizar da borda ou botão voltar): volta uma tela, nunca fecha o jogo ----
   Guardamos sempre uma entrada extra no histórico; quando o aparelho "volta", fechamos a janela de cima
   (ou voltamos à tela inicial) e guardamos a entrada de novo. */
function armarVoltar(){ try{ history.pushState({sp: 1}, '', location.href); }catch(e){} }
function voltarUmaTela(){
  const abertos = [...document.querySelectorAll('.ov.on')].filter(o => o.id !== 'ov-splash').sort((a, b) => (b._ordem || 0) - (a._ordem || 0));
  if (abertos.length){
    const o = abertos[0], x = o.querySelector('[data-close]');
    if (x && !x.hidden) x.click(); else o.classList.remove('on');
    return true;
  }
  if (!$('#ov-splash').classList.contains('on')){ irInicio(); return true; }
  return false;     /* já está na tela inicial: fica nela */
}
addEventListener('popstate', () => {
  if (location.hash.length > 1) return;     /* abrir um link do jogo (fase, convite) não é "voltar" */
  voltarUmaTela(); armarVoltar();
});
/* No app Android, o botão voltar do aparelho chega pelo plugin App: volta uma tela e nunca fecha o jogo. */
if (NATIVO && window.Capacitor.Plugins && window.Capacitor.Plugins.App){
  try{ window.Capacitor.Plugins.App.addListener('backButton', () => { voltarUmaTela(); }); }catch(e){}
}
