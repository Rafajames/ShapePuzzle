/* ======================= Backup do progresso ======================= */
const BK = {pend: null};
const dadosAtuais = () => ({prog, est: estrelasFase, rec: recs, dias, sem, corr, custom, stats: Est, inf,
  cfg: {lang, tema, a11y, humor: humorPref, pecas: pecasPref, vibra: vibraOn, musica: Som.musica(), sfx: Som.sfx(), vol: Som.volume()}});
const envelopeBackup = dados => ({app: 'shapepuzzle', v: 1, criado: new Date().toISOString(), versao: VERSAO, dados: dados || dadosAtuais()});
const bytesParaB64u = u8 => { let b = ''; for (let i = 0; i < u8.length; i += 8192) b += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const b64uParaBytes = t => { t = t.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; const b = atob(t), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
const passar = async (u8, stream) => new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer());
async function codigoBackup(dados){
  const json = JSON.stringify(envelopeBackup(dados));
  let bytes = new TextEncoder().encode(json), z = '';
  if (typeof CompressionStream !== 'undefined'){ try{ bytes = await passar(bytes, new CompressionStream('deflate-raw')); z = 'z'; }catch(e){ bytes = new TextEncoder().encode(json); z = ''; } }
  return 'SP1' + z + '.' + somaTexto(json) + '.' + bytesParaB64u(bytes);
}
/* Aceita o código ou o conteúdo de um arquivo .json. Devolve {dados, criado} ou {erro}. */
async function lerBackup(texto){
  texto = String(texto || '').trim();
  if (!texto) return {erro: 'Cole o código ou escolha um arquivo primeiro.'};
  if (texto.length > 2e6) return {erro: 'Esse texto é grande demais para ser um backup.'};
  let env;
  try{
    if (texto[0] === '{') env = JSON.parse(texto);
    else {
      const m = /^SP1(z?)\.([0-9a-f]{8})\.([A-Za-z0-9_-]+)$/.exec(texto.replace(/\s+/g, ''));
      if (!m) return {erro: 'Esse código não parece um backup do Shape Puzzle.'};
      let bytes = b64uParaBytes(m[3]);
      if (m[1]) bytes = await passar(bytes, new DecompressionStream('deflate-raw'));
      const json = new TextDecoder().decode(bytes);
      if (somaTexto(json) !== m[2]) return {erro: 'O código está incompleto ou foi alterado. Copie de novo, inteiro.'};
      env = JSON.parse(json);
    }
  }catch(e){ return {erro: 'O código está incompleto ou foi alterado. Copie de novo, inteiro.'}; }
  return limparBackup(env);
}
function abrirBackup(){
  BK.pend = null; $('#bkResumo').hidden = true; $('#bkCola').value = ''; avisoBk('');
  $('#bkCodigo').value = '…';
  codigoBackup().then(c => { $('#bkCodigo').value = c; });
  abrir('backup');
}
function avisoBk(msg, cls){ const a = $('#bkAviso'); a.textContent = msg ? tr(msg) : ''; a.className = 'aviso' + (cls ? ' ' + cls : ''); }
async function conferirBackup(){
  BK.pend = null; $('#bkResumo').hidden = true; avisoBk('');
  const r = await lerBackup($('#bkCola').value);
  if (r.erro){ avisoBk(r.erro, 'erro'); return; }
  BK.pend = r.dados;
  const x = resumoBackup(r.dados), partes = [];
  partes.push(tr(x.fases === 1 ? '1 fase concluída' : '{n} fases concluídas', {n: x.fases}), tr(x.estrelas === 1 ? '1 estrela' : '{n} estrelas', {n: x.estrelas}),
    tr(x.recordes === 1 ? '1 recorde' : '{n} recordes', {n: x.recordes}));
  if (x.criadas) partes.push(tr(x.criadas === 1 ? '1 fase criada' : x.criadas + ' fases criadas'));
  if (x.dias) partes.push(tr(x.dias === 1 ? '1 dia da fase do dia' : x.dias + ' dias da fase do dia'));
  if (x.semanas) partes.push(tr(x.semanas === 1 ? '1 semana do desafio da semana' : x.semanas + ' semanas do desafio da semana'));
  if (x.infinito) partes.push(tr('modo infinito: {n} fases', {n: x.infinito}));
  $('#bkTxt').textContent = (r.criado ? tr('Backup de {data}:', {data: r.criado.split('-').reverse().join('/')}) + ' ' : '') + partes.join(' · ') + '.';
  $('#bkResumo').hidden = false;
}
function gravarBackup(d, comCfg, limpar, msg){
  restaurando = true;
  const grava = (k, v) => { if (v !== undefined) store.set(k, v); else if (limpar){ try{ localStorage.removeItem('shapepuzzle.' + k); }catch(e){} } };
  if (d.prog) d.prog = {max: Math.min(d.prog.max, LIMITE_FASES - 1), done: d.prog.done.filter(i => i < LIMITE_FASES)};
  grava('prog', d.prog); grava('est', d.est); grava('rec', d.rec); grava('dias', d.dias); grava('sem', d.sem); grava('corr', d.corr); grava('custom', d.custom); grava('stats', d.stats); grava('inf', d.inf);
  if (limpar){ store.set('infatual', null); store.set('andamento', null); }
  if (comCfg && d.cfg){
    const c = d.cfg;
    if (c.lang) store.set('lang', c.lang); if (c.tema) store.set('tema', c.tema); if (c.a11y) store.set('a11y', Object.assign({}, a11y, c.a11y));
    if (c.humor) store.set('humor', c.humor); if (c.pecas !== undefined) store.set('pecas', c.pecas);
    ['vibra', 'musica', 'sfx', 'vol'].forEach(k => { if (c[k] !== undefined) store.set(k, c[k]); });
  }
  toast(msg || 'Backup restaurado! Reiniciando o jogo…');
  setTimeout(() => location.reload(), 1000);
}
function dadosLimpos(){ const r = limparBackup({app: 'shapepuzzle', v: 1, dados: dadosAtuais()}); return r.dados || {}; }
$('#btnBackup').onclick = abrirBackup;
$('#bkCopiar').onclick = async () => { const c = $('#bkCodigo').value; if (c && c !== '…'){ await copiar(c); toast('Código copiado! Guarde onde quiser (ou mande para você mesmo).'); } };
$('#bkCodigo').onclick = e => e.target.select();
$('#bkBaixar').onclick = () => {
  const blob = new Blob([JSON.stringify(envelopeBackup(), null, 1)], {type: 'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'shapepuzzle-backup-' + dataHoje() + '.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
$('#bkArqBtn').onclick = () => $('#bkArq').click();
$('#bkArq').onchange = e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (f.size > 2e6){ avisoBk('Esse arquivo é grande demais para ser um backup.', 'erro'); return; }
  const rd = new FileReader();
  rd.onload = () => { $('#bkCola').value = String(rd.result); conferirBackup(); };
  rd.onerror = () => avisoBk('Não consegui ler esse arquivo.', 'erro');
  rd.readAsText(f);
};
$('#bkConferir').onclick = conferirBackup;
$('#bkJuntar').onclick = () => { if (!BK.pend) return; gravarBackup(juntarDados(dadosLimpos(), BK.pend), false, false); };
$('#bkSubst').onclick = () => {
  if (!BK.pend) return;
  if (confirm(tr('Substituir todo o progresso e os ajustes deste aparelho pelo do backup?'))) gravarBackup(JSON.parse(JSON.stringify(BK.pend)), true, true);
};

