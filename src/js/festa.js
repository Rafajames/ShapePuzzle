/* ======================= Festa: confetes e fogos de artifício =======================
   Uma tela transparente por cima de tudo, só por alguns segundos, quando a última peça é encaixada.
   "Menos animação" (acessibilidade) desliga. Não bloqueia toques. */
const Festa = (() => {
  let cv = null, raf = 0;
  function parar(){ cancelAnimationFrame(raf); raf = 0; if (cv){ cv.remove(); cv = null; } }
  function iniciar(){
    if (a11y.mov || document.hidden) return;
    parar();
    cv = document.createElement('canvas'); cv.id = 'festa'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const cores = [...Object.values(COR), '#ffffff', '#ffd84d', '#ff7ab8'];
    const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[(Math.random() * a.length) | 0];
    const conf = [], fogos = [], fagulhas = [];
    const escala = Math.min(1.3, Math.max(.7, Math.min(W, H) / 700));
    /* confetes: dois canhões nos cantos de baixo + uma chuva leve do alto */
    for (let lado = 0; lado < 2; lado++) for (let i = 0; i < 55; i++){
      const dir = lado ? -1 : 1, a = rnd(.9, 1.35);
      conf.push({x: lado ? W + 4 : -4, y: H * rnd(.6, .85), vx: dir * Math.cos(a) * rnd(9, 20) * escala, vy: -Math.sin(a) * rnd(11, 22) * escala, w: rnd(6, 11), h: rnd(9, 16), r: rnd(0, 6.28), vr: rnd(-.3, .3), cor: pick(cores), atraso: rnd(0, .25), osc: rnd(0, 6.28)});
    }
    for (let i = 0; i < 50; i++) conf.push({x: rnd(0, W), y: rnd(-H * .5, -10), vx: rnd(-1, 1), vy: rnd(1.5, 4), w: rnd(6, 10), h: rnd(8, 14), r: rnd(0, 6.28), vr: rnd(-.2, .2), cor: pick(cores), atraso: rnd(.6, 2.2), osc: rnd(0, 6.28)});
    /* fogos: foguete sobe e explode em faíscas */
    [.15, .55, 1, 1.45, 1.95, 2.5].forEach(t => fogos.push({t, x: W * rnd(.18, .82), alvo: H * rnd(.14, .42), y: H + 10, estado: 0, cor: pick(cores)}));
    const explodir = f => {
      const n = Math.round(70 * Math.min(1.2, escala)), cor2 = pick(cores), forma = Math.random();
      for (let i = 0; i < n; i++){
        const a = i / n * 6.2832 + rnd(-.05, .05), v = (forma < .4 ? 1 : rnd(.4, 1)) * rnd(3.2, 6.4) * escala;
        fagulhas.push({x: f.x, y: f.y, px: f.x, py: f.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 1, dec: rnd(.011, .018), cor: i % 4 === 0 ? cor2 : f.cor});
      }
    };
    const T0 = performance.now(); let antes = T0;
    function quadro(agora){
      const dt = Math.min(2.5, (agora - antes) / 16.67); antes = agora;
      const seg = (agora - T0) / 1000;
      g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
      /* confetes */
      for (const c of conf){
        if (seg < c.atraso) continue;
        c.vy += .38 * dt; c.vx *= Math.pow(.985, dt); c.vy *= Math.pow(.992, dt); c.x += (c.vx + Math.sin(seg * 3 + c.osc) * .6) * dt; c.y += c.vy * dt; c.r += c.vr * dt;
        if (c.y > H + 20) continue;
        g.save(); g.translate(c.x, c.y); g.rotate(c.r); g.scale(1, Math.cos(seg * 5 + c.osc)); g.fillStyle = c.cor; g.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); g.restore();
      }
      /* fogos */
      g.globalCompositeOperation = 'lighter';
      for (const f of fogos){
        if (seg < f.t || f.estado === 2) continue;
        if (f.estado === 0){
          f.y -= (H * .018 + 4) * dt; g.fillStyle = '#ffe9a8'; g.fillRect(f.x - 1.5, f.y, 3, 10);
          if (f.y <= f.alvo){ f.estado = 2; explodir(f); }
        }
      }
      for (const s of fagulhas){
        if (s.vida <= 0) continue;
        s.px = s.x; s.py = s.y; s.vy += .07 * dt; s.vx *= Math.pow(.985, dt); s.vy *= Math.pow(.985, dt); s.x += s.vx * dt; s.y += s.vy * dt; s.vida -= s.dec * dt;
        g.globalAlpha = Math.max(0, s.vida); g.strokeStyle = s.cor; g.lineWidth = 2.2; g.beginPath(); g.moveTo(s.px, s.py); g.lineTo(s.x, s.y); g.stroke();
      }
      g.globalAlpha = 1;
      if (seg < 5.5) raf = requestAnimationFrame(quadro); else parar();
    }
    raf = requestAnimationFrame(quadro);
  }
  return {iniciar, parar, ativa: () => !!cv};
})();
