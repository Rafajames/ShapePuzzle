/* ---- compartilhar ---- */
const urlBase = () => NATIVO ? SITE : location.origin + location.pathname;
const urlFase = (text, nome) => urlBase() + '#f=' + b64u(text) + '&n=' + encodeURIComponent(nome);
async function copiar(t){
  let ok = false;
  try{ await navigator.clipboard.writeText(t); ok = true; }catch(e){}
  if (!ok){
    const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0;left:0;top:0';
    document.body.appendChild(a); a.select(); try{ ok = document.execCommand('copy'); }catch(e){} a.remove();
  }
  if (ok) toast('Copiado! É só colar numa conversa.');
  else { toast('Não consegui copiar sozinho: selecione o link e copie.'); const l = $('#shLink'); if (l) l.select(); }
  return ok;
}
/* Painel próprio: funciona igual no celular e no computador (o compartilhar do sistema, sozinho, falha em muitos PCs). */
let SH = null;
function abrirCompartilhar(titulo, texto, url){
  titulo = tr(titulo); texto = tr(texto);
  SH = {titulo, texto, url};
  $('#shTitulo').textContent = titulo; $('#shTexto').textContent = texto; $('#shLink').value = url;
  const msg = encodeURIComponent(texto + '\n' + url);
  $('#shWpp').href = 'https://wa.me/?text=' + msg;
  $('#shTg').href = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(texto);
  $('#shMail').href = 'mailto:?subject=' + encodeURIComponent(titulo) + '&body=' + msg;
  $('#shMais').hidden = !navigator.share;
  alternarQR(false);
  abrir('share');
}
function compartilhar(titulo, texto, url){ abrirCompartilhar(titulo, texto, url); }
function desenharQR(url){
  const cv = $('#shQRCanvas');
  const qr = qrcode(0, url.length > 700 ? 'L' : 'M'); qr.addData(url); qr.make();
  const n = qr.getModuleCount(), q = 4, px = 8, tam = (n + q * 2) * px;
  cv.width = cv.height = tam;
  const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, tam, tam); c.fillStyle = '#000';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) c.fillRect((x + q) * px, (y + q) * px, px, px);
}
function alternarQR(mostrar){
  const box = $('#shQRBox'), b = $('#shQR');
  if (mostrar){
    try{ desenharQR(SH.url); }catch(e){ toast('Esse link é grande demais para virar QR code. Use copiar ou WhatsApp.'); return; }
  }
  box.hidden = !mostrar; b.setAttribute('aria-expanded', mostrar);
  b.lastChild.textContent = tr(mostrar ? 'Esconder QR code' : 'Mostrar QR code');
  if (mostrar) anunciar(tr('QR code na tela. Aponte a câmera de outro celular.'));
}
$('#shQR').onclick = () => alternarQR($('#shQRBox').hidden);
$('#solVer').onclick = () => { fechar('solucao'); setTimeout(acaoSolucao, 250); };
$('#solLugar').onclick = () => { fechar('solucao'); S.dicaNivel = 1; acaoDica(); };
$('#solFechar').onclick = () => fechar('solucao');
$('#shCopiar').onclick = () => copiar(SH.texto + '\n' + SH.url);
$('#shCopiarLink').onclick = () => copiar(SH.url);
$('#shLink').onclick = e => e.target.select();
$('#shMais').onclick = async () => { try{ await navigator.share({title: SH.titulo, text: SH.texto, url: SH.url}); }catch(e){} };
function sequencia(){
  const d = new Date(); let n = 0;
  if (!dias[fmtData(d)]) d.setDate(d.getDate() - 1);
  while (dias[fmtData(d)]){ n++; d.setDate(d.getDate() - 1); }
  return n;
}
function lerLink(){
  const h = new URLSearchParams(location.hash.slice(1)), f = h.get('f');
  if (!f) return null;
  try{
    const text = deb64u(f);
    if (!faseValida(text)) throw new Error('inválida');
    const nome = (h.get('n') || 'fase compartilhada').slice(0, 30);
    history.replaceState(null, '', location.pathname + location.search);
    return {k: 't', nome, text, shared: true};
  }catch(e){ toast('Link de fase inválido'); return null; }
}
window.addEventListener('hashchange', () => { const l = lerLink(); if (l){ fecharTodos('ov-splash'); carregar(l); toast('Fase compartilhada aberta'); } });

