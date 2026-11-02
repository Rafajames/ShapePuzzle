/* ======================= Áudio (tudo gerado por código) ======================= */
const HUMORES = {
  calma: {
    bpm: 66, padV: 0.035, filtro: 900, tipo: 'triangle', decay: 2.2, prob: [0.7, 0.5, 0.3], pulso: false,
    acordes: [
      {bass:45, pad:[57,60,64,67], arp:[64,67,69,72,76,79,81]},   // Am7
      {bass:41, pad:[53,57,60,64], arp:[60,64,65,69,72,76,77]},   // Fmaj7
      {bass:48, pad:[55,60,64,71], arp:[64,67,71,72,76,79,83]},   // Cmaj7
      {bass:43, pad:[55,59,62,64], arp:[62,64,67,71,74,76,79]}    // G6
    ]
  },
  animada: {
    bpm: 100, padV: 0.03, filtro: 1500, tipo: 'triangle', decay: 1.1, prob: [0.88, 0.7, 0.5], pulso: true,
    acordes: [
      {bass:48, pad:[55,60,64,67], arp:[60,64,67,72,76,79,84]},   // C
      {bass:43, pad:[55,59,62,67], arp:[62,67,71,74,79,83,86]},   // G
      {bass:45, pad:[57,60,64,69], arp:[60,64,69,72,76,81,84]},   // Am
      {bass:41, pad:[53,57,60,65], arp:[60,65,69,72,77,81,84]}    // F
    ]
  },
  noturna: {
    bpm: 54, padV: 0.04, filtro: 700, tipo: 'sine', decay: 3, prob: [0.5, 0.34, 0.2], pulso: false,
    acordes: [
      {bass:38, pad:[53,57,60,64], arp:[62,65,69,72,76,77,81]},   // Dm9
      {bass:46, pad:[58,62,65,69], arp:[62,65,69,70,74,77,81]},   // Bbmaj7
      {bass:43, pad:[55,58,62,65], arp:[62,65,67,70,74,77,79]},   // Gm9
      {bass:45, pad:[57,62,64,67], arp:[62,64,67,69,74,76,79]}    // A7sus
    ]
  }
};
const Som = (() => {
  let ctx = null, out = null, reverbIn = null, sfxBus = null, sess = null, timer = null, nextT = 0, step = 0, mi = 2;
  let musicaOn = store.get('musica', true), sfxOn = store.get('sfx', true), vol = store.get('vol', 0.55);
  let humorDesejado = 'calma';
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function impulso(seg = 3, decay = 2.6){
    const sr = ctx.sampleRate, len = Math.floor(sr * seg), b = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++){ const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  function init(){
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try{ ctx = new AC(); }catch(e){ ctx = null; return false; }
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    out = ctx.createGain(); out.gain.value = 0.9; out.connect(comp); comp.connect(ctx.destination);
    const conv = ctx.createConvolver(); conv.buffer = impulso();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    const wet = ctx.createGain(); wet.gain.value = 0.55;
    reverbIn = ctx.createGain(); reverbIn.connect(conv); conv.connect(lp); lp.connect(wet); wet.connect(out);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(out);
    const sr = ctx.createGain(); sr.gain.value = 0.25; sfxBus.connect(sr); sr.connect(reverbIn);
    return true;
  }

  function pad(ch, t){
    const M = sess.M, bus = sess.bus, dur = 16 * sess.E;
    for (const n of ch.pad){
      const g = ctx.createGain(), f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = M.filtro; f.Q.value = 0.3;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(M.padV, t + Math.min(2.2, dur * 0.4));
      g.gain.setValueAtTime(M.padV, t + dur - 0.2);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 2.5);
      [['triangle', -5], ['sine', 5]].forEach(([tipo, det]) => {
        const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = mtof(n); o.detune.value = det;
        o.connect(f); o.start(t); o.stop(t + dur + 2.7);
      });
      f.connect(g); g.connect(bus);
    }
  }
  function baixo(ch, t){
    const bus = sess.bus, dur = 16 * sess.E, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = mtof(ch.bass);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.1, t + 1.0);
    g.gain.setValueAtTime(0.1, t + dur - 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.5);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 1.7);
  }
  function pulso(ch, t){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = mtof(ch.bass + 12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.075, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(sess.bus); o.start(t); o.stop(t + 0.3);
  }
  function pluck(m, t, v){
    const M = sess.M;
    const g = ctx.createGain(), o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o1.type = M.tipo; o1.frequency.value = mtof(m);
    o2.type = 'sine'; o2.frequency.value = mtof(m) * 2; g2.gain.value = 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + M.decay);
    o1.connect(g); o2.connect(g2); g2.connect(g);
    g.connect(sess.bus);
    const ds = ctx.createGain(); ds.gain.value = 0.45; g.connect(ds); ds.connect(sess.delayIn);
    o1.start(t); o2.start(t); o1.stop(t + M.decay + 0.1); o2.stop(t + M.decay + 0.1);
  }
  function passo(s, t){
    const M = sess.M, ch = M.acordes[Math.floor(s / 16) % M.acordes.length], pos = s % 16;
    if (pos === 0){ pad(ch, t); baixo(ch, t); if (mi >= ch.arp.length) mi = ch.arp.length - 1; }
    if (M.pulso && pos % 2 === 0) pulso(ch, t);
    if (pos >= 14 && Math.random() < 0.6) return;
    const prob = pos % 4 === 0 ? M.prob[0] : pos % 2 === 0 ? M.prob[1] : M.prob[2];
    if (Math.random() < prob){
      const passos = [-2, -1, -1, 0, 1, 1, 2];
      mi = Math.max(0, Math.min(ch.arp.length - 1, mi + passos[(Math.random() * passos.length) | 0]));
      pluck(ch.arp[mi], t + Math.random() * 0.02, 0.05 + Math.random() * 0.06);
    }
  }
  function agendar(){
    if (!ctx || !sess) return;
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.7){ passo(step, nextT); nextT += sess.E; step++; }
  }
  function iniciarMusica(h){
    if (!ctx || timer) return;
    const M = HUMORES[h] || HUMORES.calma, E = 60 / M.bpm / 2;
    const bus = ctx.createGain(); bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(vol * 0.5, ctx.currentTime + 2);
    bus.connect(out);
    const send = ctx.createGain(); send.gain.value = 0.5; bus.connect(send); send.connect(reverbIn);
    const dl = ctx.createDelay(2); dl.delayTime.value = E * 1.5;
    const fb = ctx.createGain(); fb.gain.value = 0.38;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2200;
    const delayIn = ctx.createGain();
    delayIn.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(bus);
    sess = {bus, send, nodes: [dl, fb, dlp, delayIn], delayIn, M, E, humor: h};
    nextT = ctx.currentTime + 0.15; step = 0; mi = 2;
    timer = setInterval(agendar, 120); agendar();
  }
  function pararMusica(){
    if (timer){ clearInterval(timer); timer = null; }
    const s = sess; sess = null;
    if (!s) return;
    s.bus.gain.cancelScheduledValues(ctx.currentTime);
    s.bus.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    setTimeout(() => { try{ s.bus.disconnect(); s.send.disconnect(); s.nodes.forEach(n => n.disconnect()); }catch(e){} }, 1200);
  }

  function tom(f, o = {}){
    if (!ctx || !sfxOn) return;
    const {f2 = null, tipo = 'sine', dur = 0.12, vol: v = 0.2, t = 0, atk = 0.004} = o;
    const t0 = ctx.currentTime + t, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = tipo; osc.frequency.setValueAtTime(f, t0);
    if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(sfxBus); osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  return {
    iniciar(){ if (!init()) return; ctx.resume(); if (musicaOn) iniciarMusica(humorDesejado); },
    musica: () => musicaOn,
    sfx: () => sfxOn,
    volume: () => vol,
    humorAtual: () => sess ? sess.humor : humorDesejado,
    setMusica(on){
      musicaOn = on; store.set('musica', on);
      if (!ctx) return;
      if (on){ ctx.resume(); iniciarMusica(humorDesejado); } else pararMusica();
    },
    aplicarHumor(h){
      humorDesejado = HUMORES[h] ? h : 'calma';
      if (!ctx || !musicaOn) return;
      if (sess && sess.humor === humorDesejado) return;
      pararMusica(); iniciarMusica(humorDesejado);
    },
    setSfx(on){ sfxOn = on; store.set('sfx', on); },
    setVolume(v){ vol = v; store.set('vol', v); if (sess) sess.bus.gain.setTargetAtTime(v * 0.5, ctx.currentTime, 0.05); },
    pegar:   () => tom(520, {f2:760, dur:.08, vol:.12}),
    girar:   () => tom(420, {f2:620, dur:.07, vol:.10, tipo:'triangle'}),
    flip:    () => tom(620, {f2:420, dur:.07, vol:.10, tipo:'triangle'}),
    soltar:  () => tom(500, {f2:300, dur:.10, vol:.10}),
    invalido:() => tom(190, {f2:130, dur:.16, vol:.07, tipo:'sawtooth'}),
    dica(){ tom(784, {dur:.35, vol:.12, tipo:'triangle'}); tom(1175, {t:.09, dur:.45, vol:.10, tipo:'triangle'}); },
    encaixar(){ tom(300, {dur:.14, vol:.22}); tom(450, {t:.05, dur:.2, vol:.18}); tom(110, {f2:70, dur:.12, vol:.25}); },
    vitoria(){ [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => { tom(f, {tipo:'triangle', dur:1.1, vol:.16, t:i * .11}); tom(f * 2, {dur:.8, vol:.04, t:i * .11}); }); }
  };
})();

