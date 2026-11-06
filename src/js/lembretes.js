/* ======================= Lembretes no celular (só no app Android) ======================= */
/* Um aviso por dia, no horário escolhido, lembrando da fase do dia (e da sequência). Tudo é agendado no próprio aparelho:
   não há servidor nem dados enviados. Sempre que o jogo abre ou a fase do dia é feita, os próximos 7 dias são reagendados. */
const LEMB_IDS = [1, 2, 3, 4, 5, 6, 7];
let lemb = Object.assign({on: true, hora: 19, pediu: false}, store.get('lemb', {}));
const pluginLemb = () => NATIVO && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
const guardarLemb = () => store.set('lemb', lemb);
function textoLembrete(d, hoje, seq){
  const ds = fmtData(d);
  if (eventoAtivo('natal', ds) && +ds.slice(8, 10) <= NATAL_DIAS) return tr('Uma porta nova do Calendário de Natal abriu! 🎄');
  if (seq > 0 && fmtData(d) === hoje) return tr('Não perca sua sequência de {n} dias 🔥 A fase do dia está esperando.', {n: seq});
  return tr('Sua fase do dia está esperando. Ganhe +{n} ★ e cumpra as missões do dia!', {n: BONUS_DIA});
}
async function agendarLembretes(){
  const ln = pluginLemb(); if (!ln) return;
  try{
    await ln.cancel({notifications: LEMB_IDS.map(id => ({id}))});
    if (!lemb.on) return;
    const p = await ln.checkPermissions(); if (p.display !== 'granted') return;
    const agora = new Date(), hoje = dataHoje(), seq = sequencia(), lista = [];
    LEMB_IDS.forEach((id, i) => {
      const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + i, lemb.hora, 0, 0);
      if (d <= agora) return;
      if (i === 0 && dias[hoje]) return;                    /* hoje já jogou: não precisa lembrar */
      lista.push({id, title: 'Shape Puzzle', body: textoLembrete(d, hoje, seq), schedule: {at: d, allowWhileIdle: true}, isExactNotification: false});
    });
    if (lista.length) await ln.schedule({notifications: lista});
  }catch(e){}
}
/* pede a permissão uma vez, depois de a pessoa já ter vencido algumas fases (não logo ao abrir o app) */
async function pedirLembretes(forcar){
  const ln = pluginLemb(); if (!ln || (lemb.pediu && !forcar)) return;
  lemb.pediu = true; guardarLemb();
  try{ const r = await ln.requestPermissions(); if (r.display !== 'granted' && forcar){ lemb.on = false; guardarLemb(); } }catch(e){}
  renderLembretes(); agendarLembretes();
}
async function renderLembretes(){
  const ln = pluginLemb(); $('#rowLemb').hidden = !ln; if (!ln) return;
  $('#chkLemb').checked = lemb.on; $('#selLembHora').value = String(lemb.hora); $('#selLembHora').disabled = !lemb.on;
  let txt = '';
  try{ const p = await ln.checkPermissions(); if (lemb.on && p.display === 'denied') txt = tr('As notificações estão bloqueadas para o Shape Puzzle nas configurações do celular.'); }catch(e){}
  $('#lembAviso').textContent = txt;
}
$('#chkLemb').onchange = e => { lemb.on = e.target.checked; guardarLemb(); if (lemb.on) pedirLembretes(true); else { renderLembretes(); agendarLembretes(); } };
$('#selLembHora').onchange = e => { lemb.hora = +e.target.value || 19; guardarLemb(); agendarLembretes(); };
if (pluginLemb()){ agendarLembretes(); document.addEventListener('visibilitychange', () => { if (document.hidden) agendarLembretes(); }); }
