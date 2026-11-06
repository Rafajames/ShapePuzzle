/* ======================= Evento de Natal: calendário de 1 a 25 de dezembro ======================= */
/* Cada dia abre uma porta com uma fase especial. Vencer a fase dá estrelas (e, em alguns dias, um presente).
   As portas que ficaram para trás podem ser abertas até o fim de dezembro. No modo de teste dá para ver tudo antes. */
const hojeEvento = () => modoTeste ? new Date().getFullYear() + '-12-25' : dataHoje();
const natalAtivo = () => eventoAtivo('natal', hojeEvento());
const anoNatal = () => +hojeEvento().slice(0, 4);
const cacheNatal = {};
function faseNatal(ano, dia){
  const k = ano + '-' + dia;
  if (!cacheNatal[k]){ const f = gerarFase(ano * 10000 + 1225 * 37 + dia * 101, {minEstrelas: 6}); cacheNatal[k] = {nome: 'natal ' + k, text: f.text}; }
  return cacheNatal[k];
}
const portaAberta = (ano, dia) => cart.g[natalChave(ano, dia)] !== undefined;
function renderNatalInicio(){
  const b = $('#hNatal'), on = natalAtivo();
  b.hidden = !on; $('#ov-splash').classList.toggle('natal', on && !a11y.mov);
  if (!on) return;
  const ano = anoNatal(), hoje = natalDiaHoje(hojeEvento()), feitas = Array.from({length: NATAL_DIAS}, (_, i) => i + 1).filter(d => portaAberta(ano, d)).length;
  const hojeFeita = hoje && portaAberta(ano, hoje);
  $('#hNatalSub').textContent = tr('{a} de {b} portas abertas', {a: feitas, b: NATAL_DIAS});
  $('#hNatalTag').textContent = hojeFeita ? '✓' : tr('Dia {n}', {n: hoje});
  b.classList.toggle('feito', !!hojeFeita);
}
function abrirNatal(){
  const g = $('#ntGrade'); g.textContent = '';
  const ano = anoNatal(), hoje = natalDiaHoje(hojeEvento());
  for (let dia = 1; dia <= NATAL_DIAS; dia++){
    const feita = portaAberta(ano, dia), libera = dia <= hoje, premio = NATAL_PREMIOS[dia];
    const b = mk('button', 'ntPorta' + (feita ? ' ok' : '') + (dia === hoje && !feita ? ' hoje' : '') + (!libera ? ' fechada' : '') + (premio ? ' presente' : ''));
    b.type = 'button'; b.disabled = !libera;
    b.appendChild(mk('b', '', String(dia)));
    if (feita) b.insertAdjacentHTML('beforeend', ic('check'));
    else if (premio) b.insertAdjacentHTML('beforeend', ic('gift'));
    else if (!libera) b.insertAdjacentHTML('beforeend', ic('lock'));
    else b.appendChild(mk('small', '', '+' + NATAL_EST(dia) + ' ★'));
    b.setAttribute('aria-label', tr('Dia {n}', {n: dia}) + ', ' + (feita ? tr('aberta') : !libera ? tr('ainda fechada') : '+' + NATAL_EST(dia) + ' ★') + (premio ? ', ' + tr('presente: {nome}', {nome: nomeItem(premio)}) : ''));
    if (libera) b.onclick = () => { fechar('natal'); sairDaAbertura(); carregar({k: 'n', ano, dia}); };
    g.appendChild(b);
  }
  const prox = Object.keys(NATAL_PREMIOS).map(Number).find(d => !portaAberta(ano, d));
  $('#ntInfo').textContent = prox ? tr('Próximo presente no dia {n}: {nome}.', {n: prox, nome: nomeItem(NATAL_PREMIOS[prox])}) + ' ' + tr('Em dezembro, o fundo Luzes de Natal fica à venda em Meu perfil.')
    : tr('Você abriu todos os presentes. Feliz Natal!');
  abrir('natal');
}
/* fase vencida: abre a porta (uma vez) e devolve o ganho para a tela de vitória */
function vitoriaNatal(c){
  const r = abrirPortaNatal(cart, c.ano, c.dia);
  if (!r.nova) return null;
  guardarCart(r.cart); contaAgendar(5000); renderConta();
  return r;
}
$('#hNatal').onclick = () => { if (CP.convite || OFF.pendente) return $('#btnJogar').onclick(); abrirNatal(); };
