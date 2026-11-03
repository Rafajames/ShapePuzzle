/* ---- desfazer: tira do tabuleiro a última peça encaixada (e devolve à seleção) ---- */
const podeDesfazer = () => !S.venceu && S.hist.some(i => S.jogo.mapa.has(i));
function atualizarDesfazer(){ const b = $('#btnDesfazer'); if (b) b.disabled = !podeDesfazer(); }
function acaoDesfazer(){
  if (S.venceu || S.drag) return;
  let idu = 0;
  while (S.hist.length){ const i = S.hist.pop(); if (S.jogo.mapa.has(i)){ idu = i; break; } }
  if (!idu){ atualizarDesfazer(); return; }
  let p = null;
  for (let y = 0; y < S.n && !p; y++) for (let x = 0; x < S.n && !p; x++) if (S.jogo.grade[y][x] === idu) p = remover(S.jogo, x, y);
  if (!p){ atualizarDesfazer(); return; }
  limparDica(); devolver(p); S.sel = p;
  S.ultimaIdu = S.hist.length ? S.hist[S.hist.length - 1] : 0;
  anunciar(tr('Última peça desfeita.')); Som.pegar(); vibrar(10); renderBoard(); renderReserva(); renderDica(); renderStats(); atualizarGhostHover();
}

/* ---- dica (em degraus: 1) qual peça, 2) onde ela vai, 3) oferece a solução inteira) ---- */
function limparDica(){
  clearTimeout(S.dicaTimer);
  S.dicaCels.forEach(c => c.classList.remove('dica', 'alerta')); S.dicaCels = [];
  if (S.dicaPeca){ S.dicaPeca = 0; document.querySelectorAll('#reserva .pw.dicaP').forEach(w => w.classList.remove('dicaP')); }
}
const assinaturaDica = () => S.hist.join(',') + '|' + S.jogo.mapa.size + '|' + S.jogo.reserva.map(p => p.uid).join(',');
function acaoDica(){
  if (S.venceu || S.drag || S.sol) return;
  if (semDica(S.cur)){ toast(S.cur.k === 'r' ? 'Dicas ficam desligadas na corrida.' : 'Dicas ficam desligadas nos campeonatos.'); return; }
  const sig = assinaturaDica(), nivel = S.dicaSig === sig ? S.dicaNivel : 0;
  limparDica();
  const r = dicaDe(S.jogo);
  if (r.tipo === 'ok'){
    const varias = visiveis(S.jogo).length > 1;
    /* Degrau 3: já mostrou a peça e o lugar — oferece a solução. */
    if (nivel >= 2){ abrir('solucao'); return; }
    S.dicaSig = sig;
    /* Degrau 1: só a peça (não conta como dica para estrelas e recorde). */
    if (nivel === 0 && varias){
      S.dicaNivel = 1; S.dicaPeca = r.peca.uid; Som.pegar(); iniciaTempo();
      selecionar(r.peca);
      document.querySelectorAll('#reserva .pw').forEach(w => w.classList.toggle('dicaP', w.dataset.uid == r.peca.uid));
      toast('Use a peça marcada. Toque em Dica de novo para ver onde ela vai.');
      anunciar(tr('Dica: use {peca}. Aperte Dica de novo para ver o lugar.', {peca: descPeca(r.peca)}));
      S.dicaTimer = setTimeout(limparDica, 6000);
      return;
    }
    /* Degrau 2: o lugar. */
    S.dicaNivel = 2;
    if (S.dicaConta !== sig){ S.dicaConta = sig; S.dicas++; }
    iniciaTempo(); Som.dica();
    for (let i = 0; i < r.o.length; i++) for (let k = 0; k < r.o[0].length; k++){
      if (!r.o[i][k]) continue;
      const c = cellEl(r.px + k, r.py + i); c.style.setProperty('--c', COR[r.peca.id]); c.classList.add('dica'); S.dicaCels.push(c);
    }
    selecionar(r.peca); renderStats();
    toast(matchMedia('(pointer:coarse)').matches ? 'A peça selecionada vai nesse lugar. Dois toques giram e deslizar o dedo espelha.' : 'A peça selecionada vai nesse lugar. Gire/espelhe até encaixar.');
    anunciar(tr('Dica: {peca}. Encaixe com o canto superior esquerdo na linha {y}, coluna {x}.', {peca: descPeca(r.peca), y: r.py + 1, x: r.px + 1}));
  } else {
    const idu = S.ultimaIdu && S.jogo.mapa.has(S.ultimaIdu) ? S.ultimaIdu : 0;
    if (idu) for (let y = 0; y < S.n; y++) for (let x = 0; x < S.n; x++) if (S.jogo.grade[y][x] === idu){ const c = cellEl(x, y); c.classList.add('alerta'); S.dicaCels.push(c); }
    Som.invalido();
    toast(r.tipo === 'demorou' ? 'Não consegui calcular essa dica agora. Tente tirar uma peça.'
        : 'Com as peças atuais não há solução — tire alguma (a última colocada está destacada).');
  }
  S.dicaTimer = setTimeout(limparDica, 3800);
}

/* ---- solução animada: mostra todas as peças no lugar, uma de cada vez, sem mexer no jogo ---- */
function pararSolucao(){
  if (!S.sol) return;
  clearInterval(S.sol.timer);
  S.sol.cels.forEach(e => e.remove());
  S.sol = null; renderDica();
}
function acaoSolucao(){
  if (S.venceu || ehCamp(S.cur)) return;
  limparDica(); pararSolucao();
  const r = solucaoDe(S.jogo);
  if (r.tipo !== 'ok'){ Som.invalido(); toast(r.tipo === 'demorou' ? 'Não consegui calcular a solução agora. Tente tirar uma peça.' : 'Com as peças atuais não há solução — tire alguma.'); return; }
  if (!S.solVista){ S.solVista = true; S.dicas++; renderStats(); }
  iniciaTempo();
  const total = r.passos.length;
  S.sol = {cels: [], i: 0, timer: 0};
  anunciar(tr('Mostrando a solução, peça por peça.'));
  const passo = () => {
    if (!S.sol) return;
    if (S.sol.i >= total){
      clearInterval(S.sol.timer);
      $('#dica').textContent = tr('Esta é a solução. Toque em qualquer lugar para voltar ao jogo.');
      anunciar(tr('Solução completa. Aperte qualquer tecla para voltar ao jogo.')); return;
    }
    const q = r.passos[S.sol.i++];
    for (let i = 0; i < q.o.length; i++) for (let k = 0; k < q.o[0].length; k++){
      if (!q.o[i][k]) continue;
      const el = mk('i', 'solp'); el.style.setProperty('--c', COR[q.peca.id]); el.dataset.s = q.peca.id;
      cellEl(q.px + k, q.py + i).appendChild(el); S.sol.cels.push(el);
    }
    Som.encaixar();
    $('#dica').textContent = tr('Solução: peça {a} de {b}. Toque em qualquer lugar para parar.', {a: S.sol.i, b: total});
    anunciar(tr('Solução, passo {a} de {b}: {peca}. Canto superior esquerdo na linha {y}, coluna {x}.', {a: S.sol.i, b: total, peca: descPeca(q.peca), y: q.py + 1, x: q.px + 1}));
  };
  passo();
  S.sol.timer = setInterval(passo, 900);
}
/* Qualquer toque ou tecla encerra a animação (e não aciona mais nada por baixo). */
let solEngole = -1e9;
['pointerdown', 'keydown'].forEach(tipo => document.addEventListener(tipo, e => {
  if (!S.sol) return;
  pararSolucao(); solEngole = performance.now();
  e.stopPropagation(); if (tipo === 'pointerdown') e.preventDefault();
}, true));
document.addEventListener('click', e => { if (performance.now() - solEngole < 500){ e.stopPropagation(); e.preventDefault(); } }, true);

