/* ======================= Atualização do jogo =======================
   VERSAO: aumente a cada publicação (AAAA.MM.DD.N). O jogo compara com a do index.html que está no ar. */
const VERSAO = '2026.11.05.5';
const numVersao = v => String(v).split('.').map(n => parseInt(n, 10) || 0);
function versaoMaior(a, b){ const x = numVersao(a), y = numVersao(b); for (let i = 0; i < Math.max(x.length, y.length); i++){ const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0; } return false; }
const Upd = {nova: null, ultimo: 0, dispensada: ''};
async function versaoRemota(){
  const r = await fetch(location.pathname + '?chk=' + Date.now(), {cache: 'no-store'});
  if (!r.ok) throw new Error('http ' + r.status);
  const m = (await r.text()).match(/const VERSAO = '([^']+)'/);
  if (!m) throw new Error('sem versão');
  return m[1];
}
/* Devolve 'nova' | 'atual' | 'erro'. Em modo silencioso só mostra o aviso quando há versão nova. */
async function verificarAtualizacao(silencioso){
  Upd.ultimo = Date.now();
  let v;
  try{ v = await versaoRemota(); }catch(e){ return 'erro'; }
  if (versaoMaior(v, VERSAO)){
    Upd.nova = v;
    if (!silencioso || Upd.dispensada !== v) mostrarAvisoAtualizacao();
    return 'nova';
  }
  Upd.nova = null; $('#upd').hidden = true;
  return 'atual';
}
function textoAvisoAtualizacao(){
  return tr('Tem uma versão nova do jogo.') + (S && S.jog > 0 && !S.venceu ? ' ' + tr('A fase em andamento recomeça ao atualizar.') : '');
}
function mostrarAvisoAtualizacao(){
  $('#updTxt').textContent = textoAvisoAtualizacao(); $('#upd').hidden = false;
  anunciar(tr('Tem uma versão nova do jogo.'));
}
async function aplicarAtualizacao(){
  if (S.cur && ehCamp(S.cur) && !S.venceu){ toast('Termine o campeonato antes de atualizar.'); return; }
  try{
    await fetch(location.pathname, {cache: 'reload'});                      // atualiza o cache do navegador
    if ('caches' in window){ const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); }
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (reg) await reg.update();
  }catch(e){}
  location.reload();
}
function renderAtualizacao(){
  $('#verTxt').textContent = tr('Versão {v}', {v: VERSAO});
  const b = $('#btnAtualizar'); b.lastChild.textContent = tr(Upd.nova ? 'Atualizar agora' : 'Verificar atualizações');
}
function msgAtualizacao(txt, cls){ const m = $('#updMsg'); m.textContent = txt ? tr(txt) : ''; m.className = cls || ''; }
$('#btnAtualizar').onclick = async () => {
  if (Upd.nova){ aplicarAtualizacao(); return; }
  const b = $('#btnAtualizar'); b.disabled = true; msgAtualizacao('Procurando…');
  const r = await verificarAtualizacao(false); b.disabled = false;
  if (r === 'nova'){ msgAtualizacao('Versão nova encontrada! Toque em Atualizar agora.', 'ok'); renderAtualizacao(); }
  else if (r === 'atual') msgAtualizacao('Você já está com a versão mais recente.', 'ok');
  else msgAtualizacao('Não deu para verificar agora. Confira a conexão com a internet.', 'erro');
};
$('#updSim').onclick = aplicarAtualizacao;
$('#updNao').onclick = () => { Upd.dispensada = Upd.nova || ''; $('#upd').hidden = true; };
if (location.protocol.startsWith('http')){
  setTimeout(() => verificarAtualizacao(true), 5000);
  setInterval(() => verificarAtualizacao(true), 30 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - Upd.ultimo > 10 * 60 * 1000) verificarAtualizacao(true); });
}

