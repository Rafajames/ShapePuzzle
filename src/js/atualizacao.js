/* ======================= Atualização do jogo =======================
   VERSAO: aumente a cada publicação (AAAA.MM.DD.N). O jogo compara com a do index.html que está no ar. */
const VERSAO = '2026.11.06.7';
const numVersao = v => String(v).split('.').map(n => parseInt(n, 10) || 0);
function versaoMaior(a, b){ const x = numVersao(a), y = numVersao(b); for (let i = 0; i < Math.max(x.length, y.length); i++){ const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0; } return false; }
const Upd = {nova: null, html: '', ultimo: 0, dispensada: ''};
/* No site, compara com o index.html publicado. No app, com o do site público: o app baixa a versão nova e guarda. */
async function versaoRemota(){
  const r = await fetch((NATIVO ? SITE + 'index.html' : location.pathname) + '?chk=' + Date.now(), {cache: 'no-store'});
  if (!r.ok) throw new Error('http ' + r.status);
  const html = await r.text(), m = html.match(/const VERSAO = '([^']+)'/);
  if (!m) throw new Error('sem versão');
  if (NATIVO) Upd.html = html;
  return m[1];
}
/* App: a versão baixada fica no IndexedDB; o carregador do app abre a mais nova entre ela e a que veio no app. */
const guardarJogoBaixado = (v, html) => new Promise((ok, erro) => {
  const r = indexedDB.open('shapepuzzle-app', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('jogo');
  r.onerror = () => erro(r.error);
  r.onsuccess = () => { const t = r.result.transaction('jogo', 'readwrite'); t.objectStore('jogo').put({v, html, ts: Date.now()}, 'html'); t.oncomplete = () => ok(); t.onerror = () => erro(t.error); };
});
const jogoInteiro = (html, v) => html.length > 100000 && html.includes("const VERSAO = '" + v + "'") && /<\/html>\s*$/.test(html);
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
  if (NATIVO){
    try{
      if (!Upd.html || !jogoInteiro(Upd.html, Upd.nova)) await versaoRemota();
      if (!jogoInteiro(Upd.html, Upd.nova)) throw new Error('download incompleto');
      msgAtualizacao('Baixando a versão nova…'); await guardarJogoBaixado(Upd.nova, Upd.html);
    }catch(e){ msgAtualizacao('Não deu para baixar agora. Confira a conexão com a internet.', 'erro'); toast('Não deu para baixar agora. Confira a conexão com a internet.'); return; }
    location.reload(); return;
  }
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

