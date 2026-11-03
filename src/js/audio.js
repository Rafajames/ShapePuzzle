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
  },
  /* um clima para cada tema (menu → Som → Estilo → "Música do tema", ou escolhendo o clima direto) */
  noite: {   /* tema Escuro */
    bpm: 58, padV: 0.045, filtro: 600, tipo: 'sine', decay: 3.2, prob: [0.4, 0.28, 0.16], pulso: false, send: 0.7,
    acordes: [
      {bass:40, pad:[55,59,62,66], arp:[59,62,64,67,71,74,76]},   // Em9
      {bass:36, pad:[55,59,62,64], arp:[59,62,64,67,71,72,76]},   // Cmaj9
      {bass:43, pad:[55,59,62,69], arp:[59,62,67,69,71,74,79]},   // Gadd9
      {bass:38, pad:[54,57,62,64], arp:[57,62,64,66,69,74,76]}    // D6/9
    ]
  },
  manha: {   /* tema Claro */
    bpm: 92, padV: 0.022, filtro: 2600, tipo: 'triangle', decay: 1.4, harm: 4, harmV: 0.18, prob: [0.85, 0.62, 0.42], pulso: false, send: 0.45,
    acordes: [
      {bass:43, pad:[55,59,62,67], arp:[62,67,71,74,79,83,86]},   // G
      {bass:38, pad:[54,57,62,66], arp:[62,66,69,74,78,81,86]},   // D
      {bass:40, pad:[55,59,64,67], arp:[64,67,71,76,79,83,86]},   // Em
      {bass:36, pad:[55,60,64,67], arp:[64,67,72,76,79,84,88]}    // C
    ]
  },
  mare: {   /* tema Oceano: ondas suaves por cima dos acordes */
    bpm: 48, padV: 0.045, filtro: 800, tipo: 'sine', decay: 3.6, prob: [0.36, 0.22, 0.14], pulso: false, send: 0.75, ondas: true,
    acordes: [
      {bass:38, pad:[57,61,64,66], arp:[62,64,66,69,73,76,78]},   // Dmaj9
      {bass:35, pad:[59,62,66,69], arp:[62,64,66,69,71,74,76]},   // Bm9
      {bass:43, pad:[59,62,66,69], arp:[62,66,67,69,71,74,78]},   // Gmaj7#11
      {bass:45, pad:[57,61,64,66], arp:[61,64,66,69,73,76,78]}    // A6sus
    ]
  },
  mata: {   /* tema Floresta: sanfona de polegar (kalimba) em escala pentatônica */
    bpm: 78, padV: 0.028, filtro: 1600, tipo: 'triangle', decay: 1.6, harm: 5, harmV: 0.15, prob: [0.8, 0.6, 0.4], pulso: false, send: 0.5,
    acordes: [
      {bass:41, pad:[57,60,65,69], arp:[60,62,65,67,69,72,74]},   // F
      {bass:48, pad:[55,60,64,67], arp:[60,62,64,67,69,72,74]},   // C
      {bass:38, pad:[57,60,65,69], arp:[62,65,67,69,72,74,77]},   // Dm
      {bass:46, pad:[58,62,65,69], arp:[58,62,65,67,70,74,77]}    // Bb
    ]
  },
  entardecer: {   /* tema Pôr do sol: jazz suave */
    bpm: 70, padV: 0.035, filtro: 1100, tipo: 'triangle', decay: 2, prob: [0.62, 0.45, 0.3], pulso: true, send: 0.6,
    acordes: [
      {bass:41, pad:[57,60,64,67], arp:[60,64,65,67,69,72,76]},   // Fmaj9
      {bass:40, pad:[55,59,62,67], arp:[59,62,64,67,71,74,76]},   // Em7
      {bass:38, pad:[57,60,64,65], arp:[62,65,67,69,72,74,76]},   // Dm9
      {bass:48, pad:[55,59,64,67], arp:[60,64,67,71,72,76,79]}    // Cmaj7
    ]
  },
  chip: {   /* tema Retrô: ondas quadradas, baixo triangular e chiado de percussão */
    bpm: 128, padV: 0.012, filtro: 3500, tipo: 'square', decay: 0.35, harm: 2, harmV: 0, plV: 0.5, prob: [0.95, 0.8, 0.7], pulso: true,
    padTipos: [['square', 0], ['square', 7]], baixoTipo: 'triangle', baixoV: 0.12, pulsoTipo: 'triangle', send: 0.12, fb: 0.2, atk: 0.003,
    perc: {tipo: 'ruido', f: 6500, v: 0.035, cada: 4, dur: 0.05},
    acordes: [
      {bass:40, pad:[52,55,59], arp:[64,67,71,76,79,83,88]},   // Em
      {bass:48, pad:[52,55,60], arp:[64,67,72,76,79,84,88]},   // C
      {bass:43, pad:[55,59,62], arp:[62,67,71,74,79,83,86]},   // G
      {bass:50, pad:[54,57,62], arp:[62,66,69,74,78,81,86]}    // D
    ]
  },
  madeira: {   /* tema Madeira: marimba e toquinhos de madeira */
    bpm: 84, padV: 0.02, filtro: 1800, tipo: 'sine', decay: 0.9, harm: 4, harmV: 0.35, prob: [0.75, 0.55, 0.38], pulso: false, send: 0.4,
    perc: {tipo: 'tom', f: 620, v: 0.03, cada: 4, dur: 0.05},
    acordes: [
      {bass:45, pad:[57,60,64], arp:[64,67,69,72,74,76,79]},   // Am
      {bass:43, pad:[55,59,62], arp:[62,64,67,69,71,74,76]},   // G
      {bass:41, pad:[53,57,60], arp:[60,62,65,67,69,72,74]},   // F
      {bass:40, pad:[52,57,59], arp:[59,62,64,67,69,71,74]}    // E sus
    ]
  }
};
const Som = (() => {
  let ctx = null, out = null, reverbIn = null, sfxBus = null, sess = null, timer = null, nextT = 0, step = 0, mi = 2;
  let musicaOn = store.get('musica', true), sfxOn = store.get('sfx', true), vol = store.get('vol', 0.55);
  let humorDesejado = 'calma', ruidoBuf = null;
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
      (M.padTipos || [['triangle', -5], ['sine', 5]]).forEach(([tipo, det]) => {
        const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = mtof(n); o.detune.value = det;
        o.connect(f); o.start(t); o.stop(t + dur + 2.7);
      });
      f.connect(g); g.connect(bus);
    }
  }
  function baixo(ch, t){
    const bus = sess.bus, dur = 16 * sess.E, o = ctx.createOscillator(), g = ctx.createGain();
    const bv = sess.M.baixoV || 0.1;
    o.type = sess.M.baixoTipo || 'sine'; o.frequency.value = mtof(ch.bass);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(bv, t + 1.0);
    g.gain.setValueAtTime(bv, t + dur - 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.5);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 1.7);
  }
  function pulso(ch, t){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = sess.M.pulsoTipo || 'sine'; o.frequency.value = mtof(ch.bass + 12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.075, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(sess.bus); o.start(t); o.stop(t + 0.3);
  }
  function pluck(m, t, v){
    const M = sess.M;
    const g = ctx.createGain(), o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o1.type = M.tipo; o1.frequency.value = mtof(m);
    o2.type = 'sine'; o2.frequency.value = mtof(m) * (M.harm || 2); g2.gain.value = M.harmV === undefined ? 0.3 : M.harmV;
    v *= M.plV || 1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + (M.atk || 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t + M.decay);
    o1.connect(g); o2.connect(g2); g2.connect(g);
    g.connect(sess.bus);
    const ds = ctx.createGain(); ds.gain.value = 0.45; g.connect(ds); ds.connect(sess.delayIn);
    o1.start(t); o2.start(t); o1.stop(t + M.decay + 0.1); o2.stop(t + M.decay + 0.1);
  }
  function passo(s, t){
    const M = sess.M, ch = M.acordes[Math.floor(s / 16) % M.acordes.length], pos = s % 16;
    if (pos === 0){ pad(ch, t); baixo(ch, t); if (M.ondas) ondas(t); if (mi >= ch.arp.length) mi = ch.arp.length - 1; }
    if (M.perc && pos % M.perc.cada === 0) percussao(t);
    if (M.pulso && pos % 2 === 0) pulso(ch, t);
    if (pos >= 14 && Math.random() < 0.6) return;
    const prob = pos % 4 === 0 ? M.prob[0] : pos % 2 === 0 ? M.prob[1] : M.prob[2];
    if (Math.random() < prob){
      const passos = [-2, -1, -1, 0, 1, 1, 2];
      mi = Math.max(0, Math.min(ch.arp.length - 1, mi + passos[(Math.random() * passos.length) | 0]));
      pluck(ch.arp[mi], t + Math.random() * 0.02, 0.05 + Math.random() * 0.06);
    }
  }
  /* chiado curto (percussão de 8 bits) ou toquinho de madeira */
  function percussao(t){
    const P = sess.M.perc, g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(P.v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + P.dur);
    if (P.tipo === 'ruido'){
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(); s.buffer = ruido(); f.type = 'highpass'; f.frequency.value = P.f;
      s.connect(f); f.connect(g); s.start(t); s.stop(t + P.dur + 0.02);
    } else {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(P.f, t); o.frequency.exponentialRampToValueAtTime(P.f * 0.55, t + P.dur);
      o.connect(g); o.start(t); o.stop(t + P.dur + 0.02);
    }
    g.connect(sess.bus);
  }
  /* onda do mar: ruído suave que sobe e desce a cada acorde */
  function ondas(t){
    const dur = 16 * sess.E, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruido(); s.loop = true; f.type = 'lowpass'; f.Q.value = 0.4;
    f.frequency.setValueAtTime(300, t); f.frequency.linearRampToValueAtTime(1100, t + dur * 0.5); f.frequency.linearRampToValueAtTime(300, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03, t + dur * 0.5); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sess.bus); s.start(t); s.stop(t + dur + 0.1);
  }
  function ruido(){
    if (!ruidoBuf){ ruidoBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = ruidoBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    return ruidoBuf;
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
    const send = ctx.createGain(); send.gain.value = M.send === undefined ? 0.5 : M.send; bus.connect(send); send.connect(reverbIn);
    const dl = ctx.createDelay(2); dl.delayTime.value = E * (M.delayMul || 1.5);
    const fb = ctx.createGain(); fb.gain.value = M.fb === undefined ? 0.38 : M.fb;
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

