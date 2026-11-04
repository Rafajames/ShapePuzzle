/* ======================= Modo infinito =======================
   Fases novas geradas na hora (solução única), em segundo plano para o jogo não travar. */
const NIVEIS_INF = {
  facil: {nome: 'Fácil', desc: '5×5, com muitas estrelas-guia', fila: 6, o: {n: 5, minEstrelas: 14}},
  medio: {nome: 'Médio', desc: '5×5, com poucas estrelas-guia', fila: 5, o: {n: 5, minEstrelas: 7}},
  dificil: {nome: 'Difícil', desc: '6×6, com poucas estrelas-guia', fila: 5, o: {n: 6, pMin: 9, pMax: 11, minEstrelas: 10, fila: 3}},
  mestre: {nome: 'Mestre', desc: '7×7, o mais desafiador', fila: 5, o: {n: 7, pMin: 12, pMax: 15, minEstrelas: 9, fila: 2}}
};
const MODOS_INF = ['crescente', 'facil', 'medio', 'dificil', 'mestre'];
const nivelInf = (modo, num) => modo !== 'crescente' ? modo : num < 5 ? 'facil' : num < 10 ? 'medio' : num < 15 ? 'dificil' : 'mestre';
const Gerador = (() => {
  let w = null, id = 0, falhou = false; const pend = new Map();
  function iniciar(){
    if (w || falhou) return;
    try{
      const fonte = [...document.scripts].map(x => x.textContent).find(t => t.includes('// ==LOGIC-START=='));
      const logica = fonte.split('// ==LOGIC-START==')[1].split('// ==LOGIC-END==')[0];
      const blob = new Blob([logica + '\nonmessage = e => { let f = null; try{ f = gerarFase(e.data.seed, e.data.opts); }catch(err){} postMessage({id: e.data.id, f: f}); };'], {type: 'text/javascript'});
      w = new Worker(URL.createObjectURL(blob));
      w.onmessage = e => { const r = pend.get(e.data.id); if (r){ pend.delete(e.data.id); r(e.data.f); } };
      w.onerror = () => { falhou = true; w = null; pend.forEach(r => r(undefined)); pend.clear(); };
    }catch(e){ falhou = true; w = null; }
  }
  return {
    get emSegundoPlano(){ iniciar(); return !!w; },
    gerar(seed, opts){
      iniciar();
      return new Promise(res => {
        if (w){ const i = ++id; pend.set(i, f => f === undefined ? res(gerarFase(seed, opts)) : res(f)); w.postMessage({id: i, seed, opts}); }
        else setTimeout(() => res(gerarFase(seed, opts)), 40);
      });
    }
  };
})();
const Inf = {prox: null, gerando: false};
let infAtual = store.get('infatual', null);
/* semente imprevisível (o navegador sorteia de verdade): cada campeonato recebe fases que ninguém mais tem */
const novaSeed = () => { try{ return 1 + crypto.getRandomValues(new Uint32Array(1))[0] % 999999998; }catch(e){ return 1 + Math.floor(Math.random() * 999999998); } };
async function gerarNivelInf(modo, num, seed){
  const nivel = nivelInf(modo, num);
  for (let t = 0; t < 4; t++){
    const sd = seed && t === 0 ? seed : novaSeed();
    const f = await Gerador.gerar(sd, NIVEIS_INF[nivel].o);
    if (f && f.unica) return {k: 'i', modo, nivel, num, seed: sd, nome: 'Infinito ' + (num + 1), text: f.text};
  }
  return null;
}
function mostrarGerando(on){
  const g = $('#ger'); clearTimeout(mostrarGerando.t);
  if (!on){ g.hidden = true; return; }
  mostrarGerando.t = setTimeout(() => { $('#gerTxt').textContent = tr('Gerando uma fase nova…'); g.hidden = false; }, 250);
}
async function jogarInfinito(modo){
  if (Inf.gerando) return;
  Inf.gerando = true; mostrarGerando(true);
  const num = inf.feitas[modo] || 0;
  let fase = null;
  try{
    if (Inf.prox && Inf.prox.modo === modo && Inf.prox.num === num) fase = await Inf.prox.p;
    Inf.prox = null;
    if (!fase) fase = await gerarNivelInf(modo, num, infAtual && infAtual.modo === modo && infAtual.num === num ? infAtual.seed : 0);
  }catch(e){ fase = null; }
  mostrarGerando(false); Inf.gerando = false;
  if (!fase){ toast('Não consegui gerar uma fase agora. Tente de novo.'); return; }
  fecharTodos('ov-splash');
  store.set('infmodo', modo);
  infAtual = {modo, num, seed: fase.seed}; store.set('infatual', infAtual);
  carregar(fase);
  if (Gerador.emSegundoPlano) Inf.prox = {modo, num: num + 1, p: gerarNivelInf(modo, num + 1, 0)};
}
function registrarInf(c, t, j, est){
  if (c.num !== (inf.feitas[c.modo] || 0)) return;           // repetir a mesma fase não conta de novo
  inf.feitas[c.modo] = c.num + 1;
  const p = inf.porNivel[c.nivel] = inf.porNivel[c.nivel] || {n: 0, t: 0, est: 0, e3: 0};
  p.n++; p.est += est; if (est === 3) p.e3++;
  if (!S.dicas && (!p.t || t < p.t)) p.t = t;
  store.set('inf', inf); infAtual = null; store.set('infatual', null);
}
function abrirInf(){
  const l = $('#infLista'); l.innerHTML = '';
  const ultimo = store.get('infmodo', 'medio');
  MODOS_INF.forEach(m => {
    const n = inf.feitas[m] || 0, b = mk('button', 'infop' + (m === ultimo ? ' ult' : ''));
    const nome = m === 'crescente' ? 'Crescente' : NIVEIS_INF[m].nome, desc = m === 'crescente' ? 'Começa fácil e sobe a cada 5 fases' : NIVEIS_INF[m].desc;
    b.innerHTML = '<span class="dtx"><b></b><small></small></span><span class="qt"></span>';
    b.querySelector('b').textContent = tr(nome); b.querySelector('small').textContent = tr(desc);
    const feitas = n ? qtd(n, ' feita', ' feitas') : '';
    b.querySelector('.qt').textContent = feitas;
    b.setAttribute('aria-label', tr(nome) + ', ' + tr(desc) + (n ? ', ' + feitas : ''));
    b.onclick = () => jogarInfinito(m);
    l.appendChild(b);
  });
  abrir('inf');
}
$('#btnInf').onclick = abrirInf;

