/* ======================= Início ======================= */
/* Tamanho do tabuleiro: o maior que ainda deixa a tela inteira visível, sem rolar. */
function ajustar(){
  const r = document.documentElement.style;
  const pos = v => { S.cell = v; r.setProperty('--cell', v + 'px'); r.setProperty('--mini', Math.round(v * 0.5) + 'px'); fitFileiras(); };
  pos(30); void document.body.offsetWidth;   /* encolhe antes de medir: um tabuleiro largo demais faz o celular alargar a janela */
  const c0 = Math.max(30, Math.min(96, Math.floor((Math.min(innerWidth, 560) - 32) / S.n)));
  const cheio = () => document.documentElement.scrollHeight > innerHeight;
  const achar = (compacto, min) => { document.body.classList.toggle('compacto', compacto); let c = c0; pos(c); while (c > min && cheio()){ c -= 2; pos(c); } return c; };
  const normal = achar(false, 30), normalCheio = cheio();
  if (normalCheio || normal < 38){      /* tela baixa: tenta o modo compacto e fica com o que der o tabuleiro maior */
    const comp = achar(true, 22), compCabe = !cheio();
    if (compCabe && (normalCheio || comp > normal)) return;
    achar(false, 30);
  }
}
addEventListener('scroll', () => atualizarTuto(), true);
addEventListener('resize', () => { ajustar(); atualizarTuto(); });
pintarIcones();
registrarI18n(); aplicarIdioma(); prepararDialogos();
aplicarA11y();
ajustar(); window.__pronto = true;
montarBoard();
(() => {
  const l = $('#logo');
  [[[[1,1],[1,0]], 1], [[[1,1,1],[0,1,0]], 11], [[[1,0],[1,1]], 6], [[[1,1],[1,0]], 16]].forEach(([f, id]) => l.appendChild(pecaEl(f, id, 'mini')));
})();
iconeMusica();
OFF.pendente = lerLinkOff();
const linkInicial = OFF.pendente ? null : lerLink();
if (linkInicial) $('#splashMsg').hidden = false;
if (OFF.pendente){ $('#splashMsg').textContent = tr('Você recebeu um campeonato sem internet! Toque em Jogar para abrir.'); $('#splashMsg').hidden = false; }
if (CP.convite){ $('#splashMsg').textContent = tr('Você foi convidado para um campeonato! Toque em Jogar para ver.'); $('#splashMsg').hidden = false; }
const andamento = linkInicial ? null : lerAndamento();
const primeiraVez = !linkInicial && !andamento && !OFF.pendente && !CP.convite && !tuto.fim && !prog.done.length;
if (primeiraVez) abrirTutorial(); else carregar(linkInicial || (andamento && andamento.cur) || {k: 'b', i: Math.min(prog.max, Math.max(0, BUILTIN.length - 1))});
if (andamento && retomarAndamento(andamento) && !CP.convite){ $('#splashMsg').textContent = tr('Sua fase em andamento foi guardada. Toque em Jogar para continuar.'); $('#splashMsg').hidden = false; }
renderInicio();
window.__sp = {S, carregar, tentarColocar, dicaDe, gerarFase, BUILTIN, urlFase};
