/* ======================= Avatares estilo anime (personagens originais do jogo) =======================
   Desenhos 16×16 em pixel art. '.' = fundo (aparece a cor ou a textura do fundo escolhido). */
const BASE_COR = {W: '#ffffff', m: '#c2456a', B: '#ff9db5'};
const AV_ANIME = [
  {nome: 'Ninja da Névoa', cor: {H: '#23252e', h: '#3a3d4a', S: '#f2c9a0', E: '#1d2433', A: '#8a93a6', P: '#dfe5ee', M: '#2b3550', O: '#2b3550'}, px: [
    '....H..H..H.....', '...HH.HH.HH.H...', '...HHHHHHHHHH...', '..HHHHHHHHHHHH..', '..HHHHhHHhHHHH..', '..AAAAPPPPAAAA..', '..HSSSSSSSSSSHA.', '..HSSSSSSSSSSH.A',
    '..HSEESSSSEESH..', '..HSEWSSSSEWSH..', '..MMMMMMMMMMMM..', '...MMMMMMMMMM...', '....MMMMMMMM....', '.....MMMMMM.....', '...OOOOOOOOOO...', '..OOOOOOOOOOOO..']},
  {nome: 'Menina-gato', cor: {H: '#f07ab0', h: '#d95a95', i: '#ffd1e3', S: '#ffe0c4', E: '#6b2d8f', O: '#6b5bd6', A: '#ffd84d'}, px: [
    '..HH........HH..', '..HiH......HiH..', '..HiiHHHHHHiiH..', '..HHHHHHHHHHHH..', '..HHHHHHHHHHHH..', '..HHHhHHHHhHHH..', '..HHSSSSSSSSHH..', '..HSSSSSSSSSSH..',
    '..HSEESSSSEESH..', '..HSEWSSSSEWSH..', '..HBSSSSSSSSBH..', '..HSSSSmmSSSSH..', '..HHSSSSSSSSHH..', '..HH.OSSSSO.HH..', '..HOOOOAAOOOOH..', '..OOOOOOOOOOOO..']},
  {nome: 'Samurai Errante', cor: {H: '#1b1b22', h: '#3a2a22', A: '#c2263a', S: '#e9b88e', E: '#2a1a12', m: '#8a3a2a', O: '#b3262f', o: '#2d2d3a'}, px: [
    '.......HH.......', '.......HH.......', '......AHHA......', '....HHHHHHHH....', '...HHHHHHHHHH...', '..HHHHHHHHHHHH..', '..HHSSSSSSSSHH..', '..HShhSSSShhSH..',
    '..HSEESSSSEESH..', '..HSEWSSSSEWSH..', '..HSSSSSSSSSSH..', '...SSSSmmSSSS...', '....SSSSSSSS....', '...OoOSSSSOoO...', '..OOOoOOOOoOOO..', '.OOOOOoOOoOOOOO.']},
  {nome: 'Aprendiz de Magia', cor: {A: '#3e63dd', P: '#ffd84d', H: '#8a5a2b', S: '#ffe0c4', E: '#2f6b3a', O: '#5a3fb0'}, px: [
    '........AA......', '.......AAA......', '......AAAA......', '.....AAAAAA.....', '....AAAAAAAA....', '.AAAPPPPPPPPAAA.', '..HHSSSSSSSSHH..', '..HSSSSSSSSSSH..',
    '..HSEESSSSEESH..', '..HSEWSSSSEWSH..', '..HBSSSSSSSSBH..', '..HSSSSmmSSSSH..', '..HHSSSSSSSSHH..', '..HH.OOSSOO.HH..', '...OOOOPOOOOO...', '..OOOOOOOOOOOO..']},
  {nome: 'Piloto de Robô', cor: {A: '#eef2f7', P: '#e5484d', V: '#3fd0ff', H: '#6b3d1f', S: '#f2c9a0', E: '#1f3b73', m: '#a3443a', O: '#2f4a8a'}, px: [
    '....AAAAAAAA....', '...AAAAAAAAAA...', '..AAAAPPAAAAAA..', '..AAVVVVVVVVAA..', '..AVVVVVVVVVVA..', '..AAHHHHHHHHAA..', '..AHSSSSSSSSHA..', '..ASSSSSSSSSSA..',
    '..ASEESSSSEESA..', '..ASEWSSSSEWSA..', '..ASSSSSSSSSSA..', '..AASSSmmSSSAA..', '...AASSSSSSAA...', '....OOSSSSOO....', '..OOOPOOOOPOOO..', '..OOOOOOOOOOOO..']},
  {nome: 'Espadachim de Prata', cor: {H: '#e8edf2', h: '#a9b5c2', S: '#f2c9a0', E: '#2b6fc2', R: '#d14b4b', m: '#a3443a', O: '#22242c', o: '#6b1f2a'}, px: [
    '..H....H....H...', '..HH..HHH..HH...', '..HHHHHHHHHHHH..', '.HHHHHHHHHHHHHH.', '..HHHHhHHhHHHH..', '.HHHHHHHHHHHHHH.', '..HHSHSSSHSSHH..', '..HShhSSSShhSH..',
    '..HSEESSSSEESH..', '..HSEWSSSSEWSH..', '..HSSSSSSSSRSH..', '...SSSSmmSSRS...', '....SSSSSSSS....', '.....OSSSSO.....', '...OOOOooOOOO...', '..OOOOOooOOOOO..']},
  {nome: 'Garota Mágica', cor: {H: '#ffd84d', S: '#ffe6cf', E: '#d6409f', A: '#ffffff', P: '#e5484d', O: '#ff8cc6', o: '#ffffff'}, px: [
    '................', '....HHHHHHHH....', '...HHHAPPAHHH...', '..HHHHAAAAHHHH..', '..HHHHHHHHHHHH..', '.HHHHHHHHHHHHHH.', 'HHHHSSSSSSSSHHHH', 'HHHSSSSSSSSSSHHH',
    'HH.SEESSSSEES.HH', 'HH.SEWSSSSEWS.HH', 'HH.BSSSSSSSSB.HH', 'HH..SSSmmSSS..HH', 'HH...SSSSSS...HH', '.H...OPSSPO...H.', '....OOOOOOOO....', '...OOOoOOoOOO...']},
  {nome: 'Espírito-raposa', cor: {A: '#f28b30', i: '#fff3e0', H: '#f4f1ea', S: '#ffe6cf', E: '#c9461b', R: '#e5484d', O: '#b3262f', o: '#ffd84d'}, px: [
    '..A..........A..', '..AA........AA..', '..AiA......AiA..', '..AiiHHHHHHiiA..', '..HHHHHHHHHHHH..', '..HHHHHHHHHHHH..', '..HHSSHSSHSSHH..', '..HSSSSSSSSSSH..',
    '..HSEESSSSEESH..', '..HSEWSSSSEWSH..', '..HSRSSSSSSRSH..', '..HSSSSmmSSSSH..', '..HHSSSSSSSSHH..', '..HH.OSSSSO.HH..', '..HOOOOooOOOOH..', '..OOOOOooOOOOO..']},
  {nome: 'Dragãozinho', cor: {A: '#f3e3c3', H: '#3fa45b', h: '#2d7a43', S: '#e9c9a3', E: '#e0a000', R: '#3fa45b', m: '#8a3a2a', O: '#2d7a43', o: '#f3e3c3'}, px: [
    '..A..........A..', '..AA........AA..', '...AA......AA...', '....AHHHHHHA....', '...HHHHHHHHHH...', '..HHHHHHHHHHHH..', '..HHHSSSSSSHHH..', '..HSSSSSSSSSSH..',
    '..HSEESSSSEESH..', '..HSEWSSSSEWSH..', '..HSSRSSSSRSSH..', '..HSSSSmmSSSSH..', '...SSSSSSSSSS...', '...O.OSSSSO.O...', '..OOOOOOOOOOOO..', '.OOOoOOOOOOoOOO.']},
  {nome: 'Rei das Sombras', cor: {A: '#7a1f2b', H: '#4b2a6b', h: '#2e1a44', S: '#f0d8e6', E: '#e5162f', m: '#6b1f2a', O: '#1a1220', o: '#b3262f'}, px: [
    '.A............A.', '.AA..........AA.', '..AA.HHHHHH.AA..', '...AHHHHHHHHA...', '..HHHHHHHHHHHH..', '..HHHHhHHhHHHH..', '..HHSHSSSSHSHH..', '..HShhSSSShhSH..',
    '..HSEESSSSEESH..', '..HSEWSSSSEWSH..', '..HSSSSSSSSSSH..', '..HSSSSmmSSSSH..', '.OHHSSSSSSSSHHO.', '.OOO.oSSSSo.OOO.', '.OOOooooooooOOO.', 'OOOOooooooooOOOO']},
  {nome: 'Anjo da Aurora', cor: {A: '#ffd84d', H: '#ffe08a', S: '#ffe6cf', E: '#3e8fd6', w: '#c9d6ee', O: '#8fb7ff'}, px: [
    '....AAAAAAAA....', '...A........A...', '....AAAAAAAA....', '....HHHHHHHH....', '...HHHHHHHHHH...', '..HHHHHHHHHHHH..', '..HHSSSSSSSSHH..', '..HSSSSSSSSSSH..',
    '..HSEESSSSEESH..', '..HSEWSSSSEWSH..', '..HBSSSSSSSSBH..', '..HSSSSmmSSSSH..', 'wwHHSSSSSSSSHHww', 'www..OSSSSO..www', 'wwwwOOOOOOOOwwww', '.wwOOOOOOOOOOww.']},
  {nome: 'Androide', cor: {H: '#c9d1dc', h: '#9aa6b5', S: '#e9eef3', E: '#2fe3ff', R: '#8fa0b3', m: '#7a8a9c', A: '#5d6b7c', P: '#2fe3ff', O: '#3a4656'}, px: [
    '................', '....HHHHHHHH....', '...HHHHHHHHHH...', '..HHHHHHHHHHHH..', '..HHHhHHHHhHHH..', '..HHHHHHHHHHHH..', '..HHSSSSSSSSHH..', '..HSSSSSSSSSSH..',
    '..HSEESSSSEESH..', '..HSEESSSSEESH..', '..HRSSSSSSSSRH..', '..HRSSSmmSSSRH..', '..HHSSSSSSSSHH..', '..H.APSSSSPA.H..', '..AAAAAPPAAAAA..', '..OOOOOOOOOOOO..']}
];
/* SVG de um avatar anime (n = 1..12); semFundo: deixa transparente para a textura do fundo aparecer */
function svgAnime(n, semFundo){
  const a = AV_ANIME[n - 1] || AV_ANIME[0], cor = Object.assign({}, BASE_COR, a.cor), porCor = {};
  a.px.forEach((linha, y) => { for (let x = 0; x < 16; x++){ const c = linha[x]; if (c !== '.' && cor[c]) (porCor[cor[c]] = porCor[cor[c]] || []).push(`M${x} ${y}h1v1h-1z`); } });
  const fundo = semFundo ? '' : '<rect width="16" height="16" fill="#dcecff"/>';
  return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${fundo}${Object.keys(porCor).map(c => `<path fill="${c}" d="${porCor[c].join('')}"/>`).join('')}</svg>`;
}
