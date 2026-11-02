const TAM = 5;
const COR = {1:'#00beff', 6:'#28e628', 11:'#ff3296', 16:'#ffc800'};
const CORES_IDS = [1, 6, 11, 16];

/* Mesma leitura do GerenciadorJogo.reconstruirMatriz (inclui o regex de números com sinal). */
function reconstruirMatriz(dados){
  const nums = (dados.match(/-?\d+/g) || []).map(s => parseInt(s, 10) | 0);
  const pts = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2){
    const x = nums[i], y = nums[i+1];
    pts.push([x, y]);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  if (!pts.length) return [[1]];
  const m = Array.from({length: maxY - minY + 1}, () => Array(maxX - minX + 1).fill(0));
  for (const [x, y] of pts) m[y - minY][x - minX] = 1;
  return m;
}

function parseFase(texto){
  const linhasG = [], pecas = [];
  let modo = '', fila = 0;
  for (let linha of String(texto).split(/\r?\n/)){
    linha = linha.trim();
    if (!linha) continue;
    const up = linha.toUpperCase();
    const mf = /^FILA:\s*(\d+)$/.exec(up);
    if (mf){ fila = parseInt(mf[1], 10) || 0; continue; }
    if (up === 'GABARITO:'){ modo = 'g'; continue; }
    if (up.startsWith('PECAS')){ modo = 'p'; continue; }
    if (modo === 'g'){
      linhasG.push(linha.split(',').map(v => parseInt(v.trim(), 10) || 0));
    } else if (modo === 'p' && linha.includes(':')){
      const i = linha.indexOf(':');
      const id = parseInt(linha.slice(0, i).trim(), 10);
      if (!(id in COR)) continue;
      pecas.push({id, formato: reconstruirMatriz(linha.slice(i + 1).trim())});
    }
  }
  /* O tamanho vem da própria fase (5×5 nas clássicas; 6×6 e 7×7 nas novas). */
  const n = Math.min(9, Math.max(TAM, linhasG.length, linhasG.length ? linhasG[0].length : 0));
  const gab = Array.from({length: n}, (_, y) => Array.from({length: n}, (_, x) => (linhasG[y] && linhasG[y][x]) || 0));
  return {gab, pecas, n, fila};
}

function girar(f){
  const R = f.length, C = f[0].length;
  const n = Array.from({length: C}, () => Array(R).fill(0));
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) n[j][R - 1 - i] = f[i][j];
  return n;
}
function inverter(f){ return f.map(r => r.slice().reverse()); }

let _uid = 1;
const FILA_PADRAO = 4;   /* fases fora da lista (do dia, criadas, compartilhadas) mostram 4 peças por vez */
/* Fases da lista: começam com 6 peças à vista e vão diminuindo até 3 (fases com "FILA:" própria mantêm a delas). */
const filaDaFase = i => i < 10 ? 6 : i < 20 ? 5 : i < 30 ? 4 : 3;
function novoJogo(texto, filaPadrao = FILA_PADRAO){
  const {gab, pecas, n, fila: filaFase} = parseFase(texto);
  const filaAuto = !filaFase && pecas.length > filaPadrao, fila = filaFase || (filaAuto ? filaPadrao : 0);
  return {
    n, fila, filaAuto, filaFixa: !!filaFase, total: pecas.length,
    gab,
    grade: Array.from({length: n}, () => Array(n).fill(0)),
    mapa: new Map(),
    contador: 1000,
    reserva: pecas.map(p => ({uid: _uid++, id: p.id, formato: p.formato.map(r => r.slice())}))
  };
}
/* Peças visíveis: todas, ou só as `fila` primeiras quando a fase usa o modo "em fila". */
const visiveis = j => j.fila ? j.reserva.slice(0, j.fila) : j.reserva;

function podeColocar(j, f, px, py){
  for (let i = 0; i < f.length; i++) for (let k = 0; k < f[0].length; k++){
    if (!f[i][k]) continue;
    const ax = px + k, ay = py + i;
    if (ax < 0 || ax >= j.n || ay < 0 || ay >= j.n || j.grade[ay][ax] !== 0) return false;
  }
  return true;
}
function colocar(j, p, px, py){
  const idu = j.contador++;
  j.mapa.set(idu, p);
  for (let i = 0; i < p.formato.length; i++) for (let k = 0; k < p.formato[0].length; k++)
    if (p.formato[i][k]) j.grade[py + i][px + k] = idu;
  j.reserva = j.reserva.filter(q => q !== p);
  return idu;
}
function remover(j, x, y){
  const idu = j.grade[y][x];
  if (idu < 1000) return null;
  const p = j.mapa.get(idu);
  j.mapa.delete(idu);
  for (let i = 0; i < j.n; i++) for (let k = 0; k < j.n; k++) if (j.grade[i][k] === idu) j.grade[i][k] = 0;
  return p || null;
}
function concluido(j){
  for (let y = 0; y < j.n; y++) for (let x = 0; x < j.n; x++){
    const cor = j.gab[y][x];
    if (cor !== 0){
      const idu = j.grade[y][x];
      if (idu === 0) return false;
      const p = j.mapa.get(idu);
      if (p && p.id !== cor) return false;
    }
    if (j.grade[y][x] === 0) return false;
  }
  return true;
}

/* ---------- Editor: gera o mesmo formato .txt do EditorFases.java (com o modo Médio corrigido) ---------- */
function gerarTexto(grid, dif){
  const vis = Array.from({length: TAM}, () => Array(TAM).fill(false));
  const pecas = [];
  const dfs = (x, y, cor, pts) => {
    if (x < 0 || x >= TAM || y < 0 || y >= TAM || vis[y][x] || grid[y][x] !== cor) return;
    vis[y][x] = true; pts.push({x, y});
    dfs(x + 1, y, cor, pts); dfs(x - 1, y, cor, pts); dfs(x, y + 1, cor, pts); dfs(x, y - 1, cor, pts);
  };
  for (let y = 0; y < TAM; y++) for (let x = 0; x < TAM; x++){
    if (grid[y][x] && !vis[y][x]){ const pts = []; dfs(x, y, grid[y][x], pts); pecas.push({cor: grid[y][x], pts}); }
  }
  const gab = Array.from({length: TAM}, () => Array(TAM).fill(0));
  for (const p of pecas){
    if (dif === 0) p.pts.forEach(q => gab[q.y][q.x] = p.cor);
    else if (dif === 2){ const q = p.pts[0]; gab[q.y][q.x] = p.cor; }
    else { const a = p.pts[0], b = p.pts[p.pts.length - 1]; gab[a.y][a.x] = p.cor; gab[b.y][b.x] = p.cor; }
  }
  let t = 'GABARITO:\n' + gab.map(r => r.join(',')).join('\n') + '\nPECAS_CUSTOM:\n';
  for (const p of pecas){
    const o = p.pts[0];
    t += p.cor + ':' + p.pts.map(q => (q.x - o.x) + '-' + (q.y - o.y) + ';').join('') + '\n';
  }
  return t;
}
function faseValida(texto){
  const {pecas, n: lado} = parseFase(texto);
  if (!pecas.length) return false;
  let n = 0;
  for (const p of pecas) for (const r of p.formato) for (const v of r) n += v ? 1 : 0;
  return n === lado * lado;
}

/* ---------- Solver (poda por estrela) ---------- */
function orientacoes(f){
  const vistos = new Set(), out = [];
  let g = f;
  for (let fl = 0; fl < 2; fl++){
    for (let r = 0; r < 4; r++){
      const k = JSON.stringify(g);
      if (!vistos.has(k)){ vistos.add(k); out.push(g); }
      g = girar(g);
    }
    g = inverter(g);
  }
  return out;
}
const chaveCanon = f => orientacoes(f).map(o => JSON.stringify(o)).sort()[0];

/* occ: matriz NxN (verdadeiro = casa ocupada). Conta soluções até `limite`. */
function buscar(occ, pecas, gab, limite, maxNos){
  const g = occ.map(r => r.map(v => v ? 1 : 0));
  const N = occ.length;
  const n = pecas.length, usado = Array(n).fill(false);
  const ori = pecas.map(p => orientacoes(p.formato));
  const chave = pecas.map(p => p.id + '|' + chaveCanon(p.formato));
  let cont = 0, nos = 0, estourou = false, primeira = null;
  const atual = [];
  const rec = () => {
    if (cont >= limite || estourou) return;
    if (++nos > maxNos){ estourou = true; return; }
    let ey = -1, ex = -1;
    for (let y = 0; y < N && ey < 0; y++) for (let x = 0; x < N; x++) if (!g[y][x]){ ey = y; ex = x; break; }
    if (ey < 0){ cont++; if (!primeira) primeira = atual.slice(); return; }
    const vistas = new Set();
    for (let k = 0; k < n; k++){
      if (usado[k] || vistas.has(chave[k])) continue;
      vistas.add(chave[k]);
      const id = pecas[k].id;
      for (const o of ori[k]){
        const px = ex - o[0].indexOf(1), py = ey;
        let ok = true;
        for (let i = 0; i < o.length && ok; i++) for (let j = 0; j < o[0].length; j++){
          if (!o[i][j]) continue;
          const ax = px + j, ay = py + i;
          if (ax < 0 || ax >= N || ay >= N || g[ay][ax] || (gab[ay][ax] && gab[ay][ax] !== id)){ ok = false; break; }
        }
        if (!ok) continue;
        for (let i = 0; i < o.length; i++) for (let j = 0; j < o[0].length; j++) if (o[i][j]) g[py + i][px + j] = 1;
        usado[k] = true; atual.push({k, o, px, py});
        rec();
        atual.pop(); usado[k] = false;
        for (let i = 0; i < o.length; i++) for (let j = 0; j < o[0].length; j++) if (o[i][j]) g[py + i][px + j] = 0;
        if (cont >= limite || estourou) return;
      }
    }
  };
  rec();
  return {n: cont, nos, estourou, primeira};
}

/* Dica: resolve a partir do estado atual e devolve uma peça da reserva com seu lugar. */
function dicaDe(j){
  for (let y = 0; y < j.n; y++) for (let x = 0; x < j.n; x++){
    const idu = j.grade[y][x], est = j.gab[y][x];
    if (idu && est){ const p = j.mapa.get(idu); if (p && p.id !== est) return {tipo: 'conflito'}; }
  }
  const occ = j.grade.map(r => r.map(v => v !== 0));
  const r = buscar(occ, j.reserva, j.gab, 1, 400000);
  if (!r.primeira) return {tipo: r.estourou ? 'demorou' : 'impossivel'};
  const cobre = c => { for (let i = 0; i < c.o.length; i++) for (let k = 0; k < c.o[0].length; k++) if (c.o[i][k] && j.gab[c.py + i][c.px + k]) return true; return false; };
  /* Em fila, a dica é sempre sobre a peça da vez (a primeira da fila). */
  const esc = j.fila ? (r.primeira.find(c => c.k === 0) || r.primeira[0]) : (r.primeira.find(cobre) || r.primeira[0]);
  return {tipo: 'ok', peca: j.reserva[esc.k], o: esc.o, px: esc.px, py: esc.py};
}

/* Solução inteira, para mostrar peça por peça. Parte do que já está no tabuleiro; se aquilo não leva
   a lugar nenhum, mostra a solução do zero (com todas as peças). Não altera o jogo. */
function solucaoDe(j){
  const passosDe = (r, lista) => r.primeira.map(c => ({peca: lista[c.k], o: c.o, px: c.px, py: c.py}));
  let conflito = false;
  for (let y = 0; y < j.n && !conflito; y++) for (let x = 0; x < j.n; x++){
    const idu = j.grade[y][x], est = j.gab[y][x];
    if (idu && est){ const p = j.mapa.get(idu); if (p && p.id !== est){ conflito = true; break; } }
  }
  let demorou = false;
  if (!conflito && j.reserva.length){
    const r = buscar(j.grade.map(l => l.map(v => v !== 0)), j.reserva, j.gab, 1, 400000);
    if (r.primeira) return {tipo: 'ok', zero: false, passos: passosDe(r, j.reserva)};
    demorou = r.estourou;
  }
  const todas = [...j.mapa.values(), ...j.reserva];
  const r = buscar(j.grade.map(l => l.map(() => false)), todas, j.gab, 1, 600000);
  if (r.primeira) return {tipo: 'ok', zero: true, passos: passosDe(r, todas)};
  return {tipo: demorou || r.estourou ? 'demorou' : 'impossivel'};
}

/* ---------- Gerador determinístico de fases ---------- */
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function embaralhar(arr, rng){
  for (let i = arr.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}
function gerarTiling(rng, n = TAM, pMin = 6, pMax = 9){
  for (let tent = 0; tent < 300; tent++){
    const dono = Array.from({length: n}, () => Array(n).fill(-1));
    const pecas = []; let ok = true;
    for (let y = 0; y < n && ok; y++) for (let x = 0; x < n && ok; x++){
      if (dono[y][x] >= 0) continue;
      const r = rng(), alvo = r < 0.12 ? 2 : r < 0.5 ? 3 : r < 0.96 ? 4 : 5;
      const cel = [[x, y]]; dono[y][x] = pecas.length;
      while (cel.length < alvo){
        const cand = [];
        for (const [cx, cy] of cel) for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && nx < n && ny >= 0 && ny < n && dono[ny][nx] < 0 && !cand.some(c => c[0] === nx && c[1] === ny)) cand.push([nx, ny]);
        }
        if (!cand.length) break;
        const c = cand[Math.floor(rng() * cand.length)];
        dono[c[1]][c[0]] = pecas.length; cel.push(c);
      }
      if (cel.length < 2) ok = false;
      pecas.push(cel);
    }
    if (ok && pecas.length >= pMin && pecas.length <= pMax) return pecas;
  }
  return null;
}
/* Gera uma fase com solução única e o mínimo de estrelas que mantém essa unicidade. */
function gerarFase(seed, opts = {}){
  const minEstrelas = opts.minEstrelas || 0;
  const n = opts.n || TAM, pMin = opts.pMin || 6, pMax = opts.pMax || 9, fila = opts.fila || 0;
  const orc = opts.orc || 80000, orcMed = opts.orcMed || 600000, leitura = opts.ordem === 'leitura';
  const rng = mulberry32(seed);
  const vazio = Array.from({length: n}, () => Array(n).fill(false));
  for (let t = 0; t < 600; t++){
    const tl = gerarTiling(rng, n, pMin, pMax); if (!tl) continue;
    const saco = [];
    const cor = tl.map(() => { if (!saco.length) saco.push(...embaralhar(CORES_IDS.slice(), rng)); return saco.pop(); });
    if (new Set(cor).size < 3) continue;
    const cheio = Array.from({length: n}, () => Array(n).fill(0));
    tl.forEach((cel, i) => cel.forEach(([cx, cy]) => { cheio[cy][cx] = cor[i]; }));
    const ordemPecas = leitura ? tl.map((_, i) => i) : embaralhar(tl.map((_, i) => i), rng);
    const linhas = ordemPecas.map(i => {
      const [x0, y0] = tl[i][0];
      return cor[i] + ':' + tl[i].map(([cx, cy]) => (cx - x0) + '-' + (cy - y0) + ';').join('');
    });
    const pecas = parseFase('PECAS_CUSTOM:\n' + linhas.join('\n')).pecas;
    const r0 = buscar(vazio, pecas, cheio, 2, orc);
    if (r0.n !== 1 || r0.estourou) continue;
    const gab = cheio.map(r => r.slice());
    let estrelas = n * n;
    const cels = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) cels.push([x, y]);
    for (const [cx, cy] of embaralhar(cels, rng)){
      if (estrelas <= minEstrelas) break;
      const v = gab[cy][cx]; gab[cy][cx] = 0;
      const r = buscar(vazio, pecas, gab, 2, orc);
      if (r.n !== 1 || r.estourou) gab[cy][cx] = v; else estrelas--;
    }
    const med = buscar(vazio, pecas, gab, 2, orcMed);
    const text = (fila ? 'FILA: ' + fila + '\n' : '') + 'GABARITO:\n' + gab.map(r => r.join(',')).join('\n') + '\nPECAS_CUSTOM:\n' + linhas.join('\n') + '\n';
    const um = opts.medir ? buscar(vazio, pecas, gab, 1, 3e6) : null;
    return {text, estrelas, nos: med.nos, pecas: pecas.length, seed, n, fila, unica: med.n === 1 && !med.estourou, nosPrimeira: um ? um.nos : 0};
  }
  return null;
}

