/* ======================= Avatares em vetor (personagens originais do jogo) =======================
   Cada avatar é montado em camadas num quadro de 100×100: fundo, cabelo de trás, corpo, orelhas, rosto, cabelo da frente e acessórios.
   Ids fixos (p1–p24 e a1–a12) para que as compras e o perfil público continuem valendo. */
const PELE = {clara: '#ffe1c7', media: '#f2c39b', morena: '#c98d62', escura: '#8d5a3b', palida: '#f6e3ec', metal: '#dfe6ee', verde: '#9be07a'};
const escurecer = (hex, f) => { const n = parseInt(hex.slice(1), 16), c = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f))); return '#' + [16, 8, 0].map(s => c(s).toString(16).padStart(2, '0')).join(''); };
const espelharX = d => d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) => (100 - +x) + ' ' + y);

/* ---- peças ---- */
const CAB_TRAS = {
  longo: 'M21 52C19 27 34 15 50 15C66 15 81 27 79 52L82 92C70 97 30 97 18 92Z',
  medio: 'M22 52C20 27 34 16 50 16C66 16 80 27 78 52L79 74C70 79 30 79 21 74Z',
  rabo: 'M66 26C88 26 95 50 86 76C82 64 80 52 72 42Z',
  maria: 'M27 38C9 40 4 64 12 86C17 72 22 60 31 50Z',
  coque: 'M50 3A9 9 0 1 1 49.9 3Z'
};
const CAB_FRENTE = {
  curto: 'M25 53C22 30 35 19 50 19C65 19 78 30 75 53C73 45 70 39 66 36C63 41 57 42 53 38C50 42 44 43 40 39C36 43 30 44 27 42C26 46 25.5 49 25 53Z',
  espetado: 'M25 51C24 37 28 29 33 25L29 11L40 19L44 6L51 17L58 6L61 19L71 11L68 25C73 29 76 37 75 51C72 43 68 38 64 35C61 40 56 41 52 37C49 41 43 42 40 38C36 42 30 43 27 41Z',
  franja: 'M24 57C21 30 35 18 50 18C65 18 79 30 76 57L72 57C72 48 70 42 67 38L33 38C30 42 28 48 28 57Z',
  lateral: 'M25 54C22 30 36 18 52 18C69 19 79 32 75 54C72 42 64 35 54 34C45 34 36 39 30 47C28 49 26 51 25 54Z',
  repartido: 'M24 55C21 30 35 18 50 18C65 18 79 30 76 55C74 45 70 39 64 36C59 34 53 33 50 38C47 33 41 34 36 36C30 39 26 45 24 55Z',
  topete: 'M26 50C24 33 32 24 44 21C42 14 52 9 62 13C58 15 57 18 60 21C71 25 77 35 74 50C71 42 66 37 60 35C55 39 46 40 41 36C36 40 31 42 28 41Z'
};
const olho = (cx, cy, iris, estilo) => {
  if (estilo === 'feliz') return `<path d="M${cx - 4.5} ${cy + 1}Q${cx} ${cy - 4.5} ${cx + 4.5} ${cy + 1}" fill="none" stroke="#2a1d1a" stroke-width="2.2" stroke-linecap="round"/>`;
  const ry = estilo === 'serio' ? 4.2 : 5.6, rx = estilo === 'serio' ? 4 : 4.4;
  const brilho = estilo === 'brilho' ? `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 2}" ry="${ry + 2}" fill="${iris}" opacity=".35"/>` : '';
  return brilho + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#2a1d1a"/><ellipse cx="${cx}" cy="${cy + 1}" rx="${rx - 1}" ry="${ry - 1.4}" fill="${iris}"/>`
    + `<ellipse cx="${cx}" cy="${cy + 1.6}" rx="${rx - 2.4}" ry="${ry - 3}" fill="${escurecer(iris, .55)}"/>`
    + `<circle cx="${cx - 1.5}" cy="${cy - 1.9}" r="1.6" fill="#fff"/><circle cx="${cx + 1.6}" cy="${cy + 2}" r=".8" fill="#fff" opacity=".9"/>`
    + `<path d="M${cx - rx - .6} ${cy - ry + 1.8}Q${cx} ${cy - ry - 1.6} ${cx + rx + .6} ${cy - ry + 1.8}" fill="none" stroke="#2a1d1a" stroke-width="1.6" stroke-linecap="round"/>`;
};
const ORELHA = {
  gato: (c, i) => `<path d="M27 40L29 14L46 29Z" fill="${c}"/><path d="M31 35L32 21L41 29Z" fill="${i}"/>` + `<path d="${espelharX('M27 40L29 14L46 29Z')}" fill="${c}"/><path d="${espelharX('M31 35L32 21L41 29Z')}" fill="${i}"/>`,
  raposa: (c, i) => `<path d="M25 42L25 8L47 28Z" fill="${c}"/><path d="M29 36L29 16L41 28Z" fill="${i}"/>` + `<path d="${espelharX('M25 42L25 8L47 28Z')}" fill="${c}"/><path d="${espelharX('M29 36L29 16L41 28Z')}" fill="${i}"/>`,
  urso: (c, i) => `<circle cx="29" cy="29" r="9" fill="${c}"/><circle cx="29" cy="29" r="4.5" fill="${i}"/><circle cx="71" cy="29" r="9" fill="${c}"/><circle cx="71" cy="29" r="4.5" fill="${i}"/>`,
  coelho: (c, i) => `<ellipse cx="38" cy="14" rx="6" ry="16" fill="${c}" transform="rotate(-10 38 14)"/><ellipse cx="38" cy="15" rx="3" ry="11" fill="${i}" transform="rotate(-10 38 15)"/>`
    + `<ellipse cx="62" cy="14" rx="6" ry="16" fill="${c}" transform="rotate(10 62 14)"/><ellipse cx="62" cy="15" rx="3" ry="11" fill="${i}" transform="rotate(10 62 15)"/>`,
  cao: (c) => `<ellipse cx="24" cy="50" rx="8" ry="16" fill="${c}" transform="rotate(18 24 50)"/><ellipse cx="76" cy="50" rx="8" ry="16" fill="${c}" transform="rotate(-18 76 50)"/>`,
  redonda: (c, i) => `<circle cx="30" cy="33" r="6.5" fill="${c}"/><circle cx="30" cy="33" r="3.2" fill="${i}"/><circle cx="70" cy="33" r="6.5" fill="${c}"/><circle cx="70" cy="33" r="3.2" fill="${i}"/>`,
  pessoa: (c) => `<ellipse cx="26" cy="56" rx="4" ry="5.5" fill="${c}"/><ellipse cx="74" cy="56" rx="4" ry="5.5" fill="${c}"/>`
};
/* acessórios: cada um devolve SVG desenhado por cima do rosto (ou atrás, quando a chave termina em "Tras") */
const ACC = {
  asasTras: () => `<path d="M30 70C12 60 2 70 4 88C10 82 16 84 22 90C24 82 28 78 34 78Z" fill="#eef3ff" stroke="#c9d6ee"/><path d="${espelharX('M30 70C12 60 2 70 4 88C10 82 16 84 22 90C24 82 28 78 34 78Z')}" fill="#eef3ff" stroke="#c9d6ee"/>`,
  capaTras: c => `<path d="M14 100L22 66L50 74L78 66L86 100Z" fill="${c}"/><path d="M22 66L30 58L36 72Z M78 66L70 58L64 72Z" fill="${escurecer(c, .7)}"/>`,
  jubaTras: c => Array.from({length: 14}, (_, i) => { const a = i / 14 * Math.PI * 2; return `<circle cx="${50 + 30 * Math.cos(a)}" cy="${50 + 30 * Math.sin(a)}" r="11" fill="${c}"/>`; }).join('') + `<circle cx="50" cy="50" r="31" fill="${c}"/>`,
  aureola: () => `<ellipse cx="50" cy="10" rx="17" ry="5" fill="none" stroke="#ffd84d" stroke-width="3.2"/><ellipse cx="50" cy="10" rx="17" ry="5" fill="none" stroke="#fff6b0" stroke-width="1"/>`,
  chifres: c => `<path d="M33 30C27 22 26 12 31 5C33 14 38 20 41 25Z" fill="${c}"/><path d="${espelharX('M33 30C27 22 26 12 31 5C33 14 38 20 41 25Z')}" fill="${c}"/>`,
  chifresCurvos: c => `<path d="M31 33C20 30 14 18 18 6C20 16 28 22 37 25Z" fill="${c}"/><path d="${espelharX('M31 33C20 30 14 18 18 6C20 16 28 22 37 25Z')}" fill="${c}"/>`,
  chifreUnico: () => `<path d="M50 4L55 28L45 28Z" fill="#ffd84d"/><path d="M47 23L54 20M46 17L53 14M48 11L52 9" stroke="#e0a800" stroke-width="1.4"/>`,
  bandana: (c, p) => `<path d="M24 40C34 33 66 33 76 40L76 46C66 40 34 40 24 46Z" fill="${c}"/><rect x="42" y="35.5" width="16" height="8" rx="1.5" fill="${p || '#dfe5ee'}"/><path d="M76 42L88 38L86 46Z M76 44L86 52L80 54Z" fill="${c}"/>`,
  mascara: c => `<path d="M24 58C30 62 70 62 76 58C76 70 66 78 50 78C34 78 24 70 24 58Z" fill="${c}"/>`,
  chapeuMago: (c, p) => `<path d="M14 36C30 30 70 30 86 36C78 40 22 40 14 36Z" fill="${c}"/><path d="M28 34L52 0L74 34Z" fill="${c}"/><path d="M60 8C68 6 72 12 66 14" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/><path d="M29 31C42 27 60 27 72 31L71 35C60 31 42 31 30 35Z" fill="${p}"/><path d="M50 14l2 4l4 .5l-3 3l1 4l-4-2l-4 2l1-4l-3-3l4-.5Z" fill="${p}"/>`,
  capacete: (c, v) => `<path d="M20 56C18 28 32 14 50 14C68 14 82 28 80 56L76 56C76 36 66 25 50 25C34 25 24 36 24 56Z" fill="${c}"/><path d="M26 33C34 25 66 25 74 33L72 41C64 35 36 35 28 41Z" fill="${v}" opacity=".85"/><rect x="46" y="15" width="8" height="8" rx="2" fill="#e5484d"/>`,
  tiara: (c, p) => `<path d="M34 30L40 22L45 28L50 18L55 28L60 22L66 30C58 28 42 28 34 30Z" fill="${c}"/><circle cx="50" cy="25" r="2.6" fill="${p}"/>`,
  coroa: () => `<path d="M33 30L34 14L42 22L50 10L58 22L66 14L67 30Z" fill="#ffd84d" stroke="#d9a400" stroke-width="1.2"/><circle cx="50" cy="20" r="2.4" fill="#e5484d"/><circle cx="40" cy="26" r="1.7" fill="#3e8fd6"/><circle cx="60" cy="26" r="1.7" fill="#46a758"/>`,
  bone: c => `<path d="M24 42C24 22 36 16 50 16C64 16 76 22 76 42Z" fill="${c}"/><path d="M50 40C62 38 80 38 90 44C80 46 64 46 50 44Z" fill="${escurecer(c, .75)}"/><circle cx="50" cy="17" r="2.5" fill="${escurecer(c, .75)}"/>`,
  chapeuDetetive: c => `<ellipse cx="50" cy="34" rx="34" ry="6" fill="${escurecer(c, .8)}"/><path d="M28 34C28 18 38 12 50 12C62 12 72 18 72 34Z" fill="${c}"/><path d="M29 29C40 26 60 26 71 29L71 33C60 30 40 30 29 33Z" fill="#2a1d1a"/>`,
  bandanaPirata: c => `<path d="M24 44C22 24 36 17 50 17C64 17 78 24 76 44C64 38 36 38 24 44Z" fill="${c}"/><circle cx="36" cy="30" r="2" fill="#fff"/><circle cx="56" cy="27" r="2" fill="#fff"/><circle cx="66" cy="34" r="1.6" fill="#fff"/><path d="M76 40L88 46L82 50Z" fill="${c}"/>`,
  tapaOlho: () => `<path d="M26 42L74 66" stroke="#1b1b22" stroke-width="1.6"/><ellipse cx="60" cy="56" rx="6" ry="5.5" fill="#1b1b22"/>`,
  oculos: c => `<circle cx="40" cy="55" r="7.5" fill="rgba(255,255,255,.18)" stroke="${c}" stroke-width="2.2"/><circle cx="60" cy="55" r="7.5" fill="rgba(255,255,255,.18)" stroke="${c}" stroke-width="2.2"/><path d="M47.5 55H52.5M32.5 54L26 52M67.5 54L74 52" stroke="${c}" stroke-width="2"/>`,
  capaceteEspacial: () => `<circle cx="50" cy="52" r="34" fill="rgba(190,230,255,.22)" stroke="#e8eef6" stroke-width="4"/><path d="M30 34C36 26 44 23 52 23" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
  antena: (c, p) => `<path d="M50 24V9" stroke="${c}" stroke-width="2.5"/><circle cx="50" cy="8" r="4" fill="${p}"/>`,
  antenas: (c, p) => `<path d="M40 28L32 10M60 28L68 10" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="9" r="4" fill="${p}"/><circle cx="68" cy="9" r="4" fill="${p}"/>`,
  cicatriz: () => `<path d="M64 60L69 68M63 64L67 62M65.5 66L69.5 64" stroke="#c2423e" stroke-width="1.5" stroke-linecap="round"/>`,
  marcasRaposa: () => `<path d="M30 62L38 61M30 65L37 64" stroke="#e5484d" stroke-width="1.8" stroke-linecap="round"/><path d="${espelharX('M30 62L38 61M30 65L37 64')}" stroke="#e5484d" stroke-width="1.8" stroke-linecap="round"/>`,
  linhasRobo: () => `<path d="M29 64H36M64 64H71M33 44V48M67 44V48" stroke="#8fa0b3" stroke-width="1.4" stroke-linecap="round"/>`,
  listrasTigre: () => `<path d="M50 27L47 35L53 35Z M38 30L42 38M62 30L58 38 M26 56L33 57M26 61L32 60M74 56L67 57M74 61L68 60" stroke="#3b2416" stroke-width="2.4" stroke-linecap="round" fill="#3b2416"/>`,
  sininho: () => `<circle cx="50" cy="83" r="4" fill="#ffd84d" stroke="#d9a400"/><path d="M48 84H52" stroke="#9a6a00"/>`,
  golaAlta: c => `<path d="M30 78L36 66L50 76L64 66L70 78L50 86Z" fill="${c}"/>`,
  ombreiras: c => `<path d="M14 92C14 82 22 78 32 78L36 90Z" fill="${c}"/><path d="${espelharX('M14 92C14 82 22 78 32 78L36 90Z')}" fill="${c}"/>`,
  espinhos: c => `<path d="M44 20L48 12L52 20Z M54 19L58 12L61 21Z M35 23L37 15L42 22Z" fill="${c}"/>`
};
/* d = {pele, cab: [estiloFrente, cor], tras, olhos: [cor, estilo], roupa: [cor, cor2], orelha: [tipo, cor, interna], bicho: {...}, acc: [[nome, ...args]], fundo} */
function montarAvatar(d, semFundo){
  const pele = d.pele || PELE.clara, sombra = escurecer(pele, .9), cab = d.cab || [], corCab = cab[1] || '#3b2a20';
  const acc = (d.acc || []), tras = acc.filter(a => a[0].endsWith('Tras')), frente = acc.filter(a => !a[0].endsWith('Tras'));
  const r = [];
  if (!semFundo) r.push(`<rect width="100" height="100" fill="${d.fundo || '#dcecff'}"/>`);
  tras.forEach(a => r.push(ACC[a[0]](...a.slice(1))));
  (d.tras || []).forEach(t => { r.push(`<path d="${CAB_TRAS[t]}" fill="${corCab}"/>`); if (t === 'rabo' || t === 'maria') r.push(`<path d="${espelharX(CAB_TRAS[t])}" fill="${t === 'maria' ? corCab : 'none'}"/>`); });
  const [roupa, roupa2] = d.roupa || ['#5a6fd6', '#ffffff'];
  r.push(`<rect x="43" y="68" width="14" height="14" rx="3" fill="${sombra}"/>`);
  r.push(`<path d="M14 100C15 85 28 78 50 78C72 78 85 85 86 100Z" fill="${roupa}"/><path d="M40 78Q50 88 60 78" fill="none" stroke="${roupa2}" stroke-width="3"/>`);
  const b = d.bicho;
  const [tipoOr, corOr, intOr] = d.orelha || ['pessoa', pele];
  r.push(ORELHA[tipoOr](corOr || (b ? b.pelo : pele), intOr || '#ffb7c9'));
  if (d.robo) r.push(`<rect x="24" y="26" width="52" height="50" rx="14" fill="${d.robo}"/><rect x="29" y="40" width="42" height="24" rx="10" fill="#1c2733"/>`);
  else r.push(`<ellipse cx="50" cy="51" rx="25" ry="26" fill="${b ? b.pelo : pele}"/>`);
  if (b){
    if (b.mancha) r.push(`<ellipse cx="39" cy="55" rx="8" ry="10" fill="${b.mancha}" transform="rotate(20 39 55)"/><ellipse cx="61" cy="55" rx="8" ry="10" fill="${b.mancha}" transform="rotate(-20 61 55)"/>`);
    if (b.bochecha) r.push(`<ellipse cx="33" cy="64" rx="9" ry="7" fill="${b.bochecha}"/><ellipse cx="67" cy="64" rx="9" ry="7" fill="${b.bochecha}"/>`);
    r.push(`<ellipse cx="50" cy="65" rx="11" ry="8" fill="${b.focinho}"/><ellipse cx="50" cy="60.5" rx="3.6" ry="2.6" fill="${b.nariz || '#3a2a2a'}"/>`);
    r.push(`<path d="M50 63V65.5M50 65.5Q47 68.5 44.5 66.5M50 65.5Q53 68.5 55.5 66.5" fill="none" stroke="#3a2a2a" stroke-width="1.4" stroke-linecap="round"/>`);
    if (b.bigode) r.push(`<path d="M38 63L28 61M38 66L28 67M62 63L72 61M62 66L72 67" stroke="${b.bigode}" stroke-width="1.1" stroke-linecap="round"/>`);
  }
  const [iris, estilo] = d.olhos || ['#5a3a22', 'normal'];
  if (d.robo){ r.push(`<rect x="34" y="47" width="10" height="9" rx="3" fill="${iris}"/><rect x="56" y="47" width="10" height="9" rx="3" fill="${iris}"/><rect x="42" y="68" width="16" height="3" rx="1.5" fill="${escurecer(d.robo, .7)}"/>`); }
  else {
    r.push(olho(40, 54, iris, estilo), olho(60, 54, iris, estilo));
    if (d.sobr) r.push(`<path d="M34 ${d.sobr === 'brava' ? 43 : 45}L45 ${d.sobr === 'brava' ? 46 : 44.5}M66 ${d.sobr === 'brava' ? 43 : 45}L55 ${d.sobr === 'brava' ? 46 : 44.5}" stroke="${escurecer(corCab, .8)}" stroke-width="2.2" stroke-linecap="round"/>`);
    if (!b){
      r.push(`<ellipse cx="33" cy="63" rx="4" ry="2.2" fill="#ff8fa8" opacity="${d.blush === false ? 0 : .5}"/><ellipse cx="67" cy="63" rx="4" ry="2.2" fill="#ff8fa8" opacity="${d.blush === false ? 0 : .5}"/>`);
      r.push(d.boca === 'aberta' ? `<path d="M45.5 65Q50 72 54.5 65Z" fill="#9b2f3f"/>` : d.boca === 'reta' ? `<path d="M46.5 67H53.5" stroke="#8a4a3a" stroke-width="1.8" stroke-linecap="round"/>`
        : `<path d="M46 66Q50 69.5 54 66" fill="none" stroke="#8a4a3a" stroke-width="1.8" stroke-linecap="round"/>`);
    }
  }
  if (cab[0]) r.push(`<path d="${CAB_FRENTE[cab[0]]}" fill="${corCab}"/><path d="${CAB_FRENTE[cab[0]]}" fill="none" stroke="${escurecer(corCab, .78)}" stroke-width="1" opacity=".6"/>`);
  if ((d.tras || []).includes('coque')) r.push(`<path d="M42 12H58" stroke="${escurecer(corCab, .7)}" stroke-width="3" stroke-linecap="round"/>`);
  frente.forEach(a => r.push(ACC[a[0]](...a.slice(1))));
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${r.join('')}</svg>`;
}
const BICHO = (pelo, focinho, o) => Object.assign({pelo, focinho}, o);
/* nomes e desenhos. p1–p6 são livres; os demais seguem as categorias de logica-conta.js */
const AVATARES = {
  p1: {nome: 'Léo', cab: ['curto', '#4a2e1f'], olhos: ['#6b4a2a'], roupa: ['#3e8fd6', '#ffffff'], fundo: '#dff1ff'},
  p2: {nome: 'Bia', cab: ['franja', '#c8692c'], tras: ['rabo'], olhos: ['#3f7a3a'], roupa: ['#e5484d', '#ffffff'], fundo: '#ffe7e3'},
  p3: {nome: 'Gatinho', bicho: BICHO('#f2a65a', '#fff1df', {bigode: '#7a4b2a', nariz: '#e5738a'}), orelha: ['gato', '#f2a65a', '#ffc9d6'], olhos: ['#5bbf6a'], roupa: ['#46a758', '#fff'], fundo: '#e8f7e2'},
  p4: {nome: 'Cãozinho', bicho: BICHO('#d9b48a', '#fff4e6'), orelha: ['cao', '#8a5a3b'], olhos: ['#5a3a22'], roupa: ['#d9960b', '#fff'], fundo: '#fff3d6'},
  p5: {nome: 'Ursinho', bicho: BICHO('#a87452', '#e8c9a6'), orelha: ['urso', '#a87452', '#e8c9a6'], olhos: ['#3a2618'], roupa: ['#8e4ec6', '#fff'], fundo: '#efe4fb'},
  p6: {nome: 'Coelha', bicho: BICHO('#f4f1ee', '#ffffff', {nariz: '#e5738a', bigode: '#c9b8b0'}), orelha: ['coelho', '#f4f1ee', '#ffc9d6'], olhos: ['#d6409f'], roupa: ['#12a594', '#fff'], fundo: '#ffe9f3'},
  p7: {nome: 'Raposa', bicho: BICHO('#f07a2a', '#fff3e6', {bigode: '#8a3a12'}), orelha: ['raposa', '#f07a2a', '#fff3e6'], olhos: ['#d9960b'], roupa: ['#2f4a8a', '#fff'], fundo: '#fff0e0'},
  p8: {nome: 'Panda', bicho: BICHO('#ffffff', '#ffffff', {mancha: '#2b2b33'}), orelha: ['urso', '#2b2b33', '#4a4a55'], olhos: ['#5a3a22'], roupa: ['#46a758', '#fff'], fundo: '#e3f5e1'},
  p9: {nome: 'Sapinho', bicho: BICHO('#7ccf5a', '#c8f0a8', {bochecha: '#ffb3c1'}), orelha: ['redonda', '#7ccf5a', '#7ccf5a'], olhos: ['#2a1d1a', 'feliz'], roupa: ['#d9960b', '#fff'], fundo: '#e6f7ff'},
  p10: {nome: 'Leão', bicho: BICHO('#f2bd5a', '#fff1d6', {bigode: '#8a5a1f'}), orelha: ['redonda', '#f2bd5a', '#d98a3a'], olhos: ['#8a5a1f'], roupa: ['#b3262f', '#fff'], acc: [['jubaTras', '#b8662a']], fundo: '#fff3d6'},
  p11: {nome: 'Davi', pele: PELE.morena, cab: ['curto', '#1b1b22'], olhos: ['#4a2e1f'], roupa: ['#e5484d', '#fff'], acc: [['bone', '#2f4a8a']], fundo: '#ffe9d6'},
  p12: {nome: 'Lia', pele: PELE.clara, cab: ['repartido', '#2a1d1a'], tras: ['medio'], olhos: ['#3e63dd'], roupa: ['#8e4ec6', '#fff'], acc: [['oculos', '#3a2a5a']], fundo: '#ece6ff'},
  p13: {nome: 'Hamster', bicho: BICHO('#e8b98a', '#fff6ea', {bochecha: '#f6d2b0', nariz: '#e5738a', bigode: '#a8865a'}), orelha: ['redonda', '#e8b98a', '#ffc9d6'], olhos: ['#2a1d1a'], roupa: ['#3e8fd6', '#fff'], fundo: '#fff7e0'},
  p14: {nome: 'Astronauta', pele: PELE.media, cab: ['lateral', '#6b3d1f'], olhos: ['#2f6b9a'], roupa: ['#e8eef6', '#e5484d'], acc: [['capaceteEspacial']], fundo: '#1b2350'},
  p15: {nome: 'Tigre', bicho: BICHO('#f28c28', '#fff3e6', {bigode: '#3b2416'}), orelha: ['redonda', '#f28c28', '#fff3e6'], olhos: ['#3fa45b'], roupa: ['#1b1b22', '#f28c28'], acc: [['listrasTigre']], fundo: '#e6f7e8'},
  p16: {nome: 'Lobo', bicho: BICHO('#8a94a3', '#e9edf2', {bigode: '#3a4250'}), orelha: ['raposa', '#8a94a3', '#e9edf2'], olhos: ['#3fb7e6', 'serio'], roupa: ['#2b3550', '#8a94a3'], fundo: '#e1e8f2'},
  p17: {nome: 'Pirata', pele: PELE.media, cab: ['curto', '#3b2a20'], olhos: ['#4a2e1f', 'serio'], sobr: 'brava', boca: 'aberta', roupa: ['#1b1b22', '#e5484d'], acc: [['bandanaPirata', '#c2263a'], ['tapaOlho']], fundo: '#d8f0ff'},
  p18: {nome: 'Maga do Fogo', pele: PELE.escura, cab: ['franja', '#1b1b22'], tras: ['longo'], olhos: ['#e5484d'], roupa: ['#b3262f', '#ffd84d'], acc: [['tiara', '#ffd84d', '#ff6a00']], fundo: '#ffe3d6'},
  p19: {nome: 'Rainha', pele: PELE.clara, cab: ['repartido', '#f2d06b'], tras: ['longo'], olhos: ['#3e63dd'], roupa: ['#8e4ec6', '#ffd84d'], acc: [['coroa']], fundo: '#f3e9ff'},
  p20: {nome: 'Detetive', pele: PELE.media, cab: ['curto', '#4a2e1f'], olhos: ['#4a2e1f', 'serio'], boca: 'reta', roupa: ['#8a6a4a', '#e8dcc8'], acc: [['chapeuDetetive', '#8a6a4a']], fundo: '#efe6d6'},
  p21: {nome: 'Robozinho', robo: '#c9d4df', olhos: ['#2fe3ff'], roupa: ['#5d6b7c', '#2fe3ff'], acc: [['antena', '#8fa0b3', '#e5484d']], fundo: '#e3f3ff'},
  p22: {nome: 'Alien', pele: PELE.verde, olhos: ['#1b1b22', 'serio'], blush: false, roupa: ['#5b2ced', '#2be0ff'], acc: [['antenas', '#6fbf4a', '#ffd84d']], fundo: '#120a2e'},
  p23: {nome: 'Unicórnio', bicho: BICHO('#ffffff', '#fff4fb', {nariz: '#f2a6c4'}), orelha: ['raposa', '#ffffff', '#ffd1e6'], cab: ['lateral', '#c58bff'], olhos: ['#d6409f'], roupa: ['#ff8cc6', '#fff'], acc: [['chifreUnico']], fundo: '#e9f0ff'},
  p24: {nome: 'Dragão', bicho: BICHO('#46a758', '#c8f0a8', {nariz: '#2d7a43'}), orelha: ['redonda', '#46a758', '#2d7a43'], olhos: ['#e0a000', 'serio'], roupa: ['#2d7a43', '#ffd84d'], acc: [['chifres', '#f3e3c3'], ['espinhos', '#ffd84d']], fundo: '#fff3d6'},
  /* heróis estilo anime */
  a1: {nome: 'Ninja da Névoa', pele: PELE.media, cab: ['espetado', '#23252e'], olhos: ['#3a4a6a', 'serio'], sobr: 'brava', roupa: ['#2b3550', '#8a93a6'], acc: [['mascara', '#2b3550'], ['bandana', '#4a5266', '#dfe5ee']], fundo: '#d9e3f0'},
  a2: {nome: 'Menina-gato', pele: PELE.clara, cab: ['franja', '#f07ab0'], tras: ['medio'], orelha: ['gato', '#f07ab0', '#ffd1e3'], olhos: ['#8e4ec6'], boca: 'aberta', roupa: ['#6b5bd6', '#ffd84d'], acc: [['sininho']], fundo: '#fde7f2'},
  a3: {nome: 'Samurai Errante', pele: PELE.media, cab: ['repartido', '#1b1b22'], tras: ['coque'], olhos: ['#3a2a1f', 'serio'], sobr: 'brava', boca: 'reta', roupa: ['#b3262f', '#2d2d3a'], acc: [['ombreiras', '#2d2d3a']], fundo: '#f3e3d0'},
  a4: {nome: 'Aprendiz de Magia', pele: PELE.clara, cab: ['franja', '#8a5a2b'], tras: ['longo'], olhos: ['#3fa45b'], roupa: ['#5a3fb0', '#ffd84d'], acc: [['chapeuMago', '#3e63dd', '#ffd84d']], fundo: '#e7e9ff'},
  a5: {nome: 'Piloto de Robô', pele: PELE.media, cab: ['lateral', '#6b3d1f'], olhos: ['#2f5aa8'], boca: 'aberta', roupa: ['#2f4a8a', '#e5484d'], acc: [['capacete', '#eef2f7', '#3fd0ff']], fundo: '#dff3ff'},
  a6: {nome: 'Espadachim de Prata', pele: PELE.clara, cab: ['espetado', '#e8edf2'], olhos: ['#2b6fc2', 'serio'], sobr: 'brava', boca: 'reta', roupa: ['#22242c', '#6b1f2a'], acc: [['cicatriz']], fundo: '#2a2f45'},
  a7: {nome: 'Garota Mágica', pele: PELE.clara, cab: ['franja', '#ffd24d'], tras: ['maria'], olhos: ['#d6409f'], boca: 'aberta', roupa: ['#ff8cc6', '#ffffff'], acc: [['tiara', '#ffffff', '#e5484d']], fundo: '#ffe3f1'},
  a8: {nome: 'Espírito-raposa', pele: PELE.clara, cab: ['repartido', '#f4f1ea'], tras: ['longo'], orelha: ['raposa', '#f28b30', '#fff3e0'], olhos: ['#c9461b'], roupa: ['#b3262f', '#ffd84d'], acc: [['marcasRaposa']], fundo: '#2b1a2e'},
  a9: {nome: 'Dragãozinho', pele: '#ead2b0', cab: ['espetado', '#3fa45b'], olhos: ['#e0a000', 'serio'], roupa: ['#2d7a43', '#f3e3c3'], acc: [['chifres', '#f3e3c3']], fundo: '#fff3d6'},
  a10: {nome: 'Rei das Sombras', pele: PELE.palida, cab: ['repartido', '#4b2a6b'], tras: ['medio'], olhos: ['#e5162f', 'serio'], sobr: 'brava', boca: 'reta', blush: false, roupa: ['#1a1220', '#b3262f'], acc: [['capaTras', '#1a1220'], ['chifresCurvos', '#7a1f2b'], ['golaAlta', '#2e1a3a']], fundo: '#1b1230'},
  a11: {nome: 'Anjo da Aurora', pele: PELE.clara, cab: ['franja', '#ffe08a'], tras: ['longo'], olhos: ['#3e8fd6', 'feliz'], roupa: ['#ffffff', '#ffd84d'], acc: [['asasTras'], ['aureola']], fundo: '#fff4dc'},
  a12: {nome: 'Androide', pele: PELE.metal, cab: ['lateral', '#c9d1dc'], olhos: ['#2fe3ff', 'brilho'], blush: false, boca: 'reta', roupa: ['#3a4656', '#2fe3ff'], acc: [['linhasRobo']], fundo: '#18212c'}
};
const SVG_AV = {};
function svgAvatar(id, semFundo){
  const k = (AVATARES[id] ? id : 'p1') + (semFundo ? '_' : '');
  return SVG_AV[k] || (SVG_AV[k] = montarAvatar(AVATARES[id] || AVATARES.p1, semFundo));
}
