/* ======================= Fases além das 50 =======================
   Geradas na hora (solução única) em segundo plano e guardadas no aparelho. Como a semente só depende do número da fase, todo mundo recebe as mesmas. */
let fasesGer = store.get('fasesger', {});
const GerB = {pend: {}, abrindo: false};
const fasesVisiveis = () => fasesVisiveisDe(prog.max, BUILTIN.length, modoTeste);
function guardarFaseGer(i, text){
  fasesGer[i] = text;
  const ks = Object.keys(fasesGer).map(Number);
  if (ks.length > 250) ks.sort((a, b) => a - b).slice(0, ks.length - 250).forEach(k => delete fasesGer[k]);   // as antigas são refeitas se precisar
  store.set('fasesger', fasesGer);
}
function gerarFaseGer(i){
  if (fasesGer[i]) return Promise.resolve(fasesGer[i]);
  if (GerB.pend[i]) return GerB.pend[i];
  const p = (async () => {
    try{
      for (let t = 0; t < 10; t++){
        const f = await Gerador.gerar(seedFaseB(i, t), opcoesFaseB(i));
        if (f && f.unica){ guardarFaseGer(i, f.text); return f.text; }
      }
    }catch(e){}
    return null;
  })();
  GerB.pend[i] = p; p.then(() => { delete GerB.pend[i]; });
  return p;
}
/* abre a fase gerada (mostrando "gerando…" se ainda não estiver pronta). soParado: só troca se a pessoa ainda não mexeu em nada. */
async function abrirFaseGer(cur, manter, soParado){
  if (GerB.abrindo) return;
  GerB.abrindo = true; mostrarGerando(true);
  const texto = await gerarFaseGer(cur.i);
  mostrarGerando(false); GerB.abrindo = false;
  if (!texto){ toast('Não consegui gerar uma fase agora. Tente de novo.'); return; }
  if (soParado && (S.jog > 0 || !S.cur || S.cur.k !== 'b')) return;
  carregar(cur, manter); renderInicio();
}
/* enquanto a pessoa joga uma fase, a próxima já vai sendo preparada */
function prepararProximaGer(i){ if (i >= FASES_FIXAS && i < LIMITE_FASES && !fasesGer[i] && Gerador.emSegundoPlano) gerarFaseGer(i); }
