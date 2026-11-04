/* ======================= Fase de tutorial =======================
   Uma fase pequena e guiada, antes da Fase 1: arrastar, girar e espelhar. Aparece sozinha na primeira vez e pode ser revista no menu. */
const TUTORIAL = {k: 'u', nome: 'Tutorial', text: 'FILA: 6\nGABARITO:\n1,1,1,1,1\n6,6,16,16,16\n6,6,11,11,16\n1,1,6,11,11\n1,1,6,6,6\nPECAS_CUSTOM:\n6:0-0;1-0;0-1;1-1;\n1:0-0;0-1;0-2;0-3;0-4;\n11:1-2;0-1;1-1;0-0;\n16:0-1;1-1;2-1;0-0;\n1:0-0;1-0;0-1;1-1;\n6:0-2;1-2;0-1;0-0;\n'};
/* o que a pessoa já fez nesta tentativa; o passo atual é o primeiro que falta */
const Tut = {colocou: false, girou: false, espelhou: false};
const tutorialAtivo = () => !!S.cur && S.cur.k === 'u' && !S.venceu;
const passoTutorial = () => !Tut.colocou ? 0 : !Tut.girou ? 1 : !Tut.espelhou ? 2 : 3;
function tutorialTexto(){
  const toque = matchMedia('(pointer:coarse)').matches;
  return [
    toque ? 'Passo 1: arraste uma peça até o quadro, ou toque nela e depois numa casa. Cada peça vai na região da sua cor.' : 'Passo 1: arraste uma peça até o quadro, ou clique nela e depois numa casa. Cada peça vai na região da sua cor.',
    toque ? 'Passo 2: algumas peças precisam girar. Toque na peça e use Girar (ou dois toques rápidos nela).' : 'Passo 2: algumas peças precisam girar. Clique na peça e use Girar (ou aperte R).',
    toque ? 'Passo 3: a peça amarela precisa ser espelhada. Toque nela e use Espelhar (ou deslize o dedo fora dela).' : 'Passo 3: a peça amarela precisa ser espelhada. Clique nela e use Espelhar (ou aperte T).',
    'Pronto, você já sabe o básico! Complete o quadro. Se errar, toque numa peça já colocada para tirá-la, ou use Desfazer.'
  ][passoTutorial()];
}
/* chamado quando a pessoa coloca, gira ou espelha uma peça */
function tutorialEvento(ev){
  if (!tutorialAtivo() || Tut[ev]) return;
  Tut[ev] = true; renderDica();
  if (ev === 'espelhou') toast('Muito bem!');
}
function abrirTutorial(){
  Tut.colocou = Tut.girou = Tut.espelhou = false;
  fecharTodos('ov-splash'); carregar(Object.assign({}, TUTORIAL));
}
function tutorialFeito(){
  tuto = {sel: true, giro: true, esp: true, fim: true}; store.set('tuto', tuto);
}
$('#btnTuto').onclick = abrirTutorial;
