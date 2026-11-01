// Confere os dicionários de tradução (inglês e espanhol) sem abrir o navegador.
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const bloco = html.split('/*DICT-START*/')[1].split('/*DICT-END*/')[0];
const win = {}; new Function('window', bloco)(win);
const D = win.DICT;
let ok = true; const falha = m => { ok = false; console.log('FALHA:', m); };
const ph = s => (s.match(/\{\w+\}/g) || []).sort().join(',');
const tags = s => (s.match(/<\/?[a-z]+>/g) || []).join('');
const en = D.en, es = D.es;
const chaves = Object.keys(en);
console.log('entradas:', chaves.length);
if (JSON.stringify(chaves) !== JSON.stringify(Object.keys(es))) falha('en e es têm chaves diferentes');
for (const k of chaves){
  for (const [nome, d] of [['en', en], ['es', es]]){
    const v = d[k];
    if (typeof v !== 'string' || !v.trim()) { falha(`${nome}: vazio para "${k}"`); continue; }
    if (ph(k) !== ph(v)) falha(`${nome}: marcadores {..} diferentes em "${k}" -> "${v}"`);
    if (tags(k) !== tags(v)) falha(`${nome}: tags HTML diferentes em "${k}"`);
    if (/[ãõç]/.test(v) && !/Português/.test(v)) falha(`${nome}: sobrou português em "${v}"`);
  }
  if (k === en[k] && !/^(Link|Ranking|Volume|Música|WhatsApp|Telegram|Idioma|Cor|Estilo|Todas|Importar \.txt|Exportar \.txt|de \{n\}|Fácil \(5×5\)|Difícil|Calma|Animada|Entrar|Editar|Abrir|Exportar|Fase|Jogar)/.test(k) && k.length > 20) falha(`en igual ao português: "${k}"`);
}
// Todo texto passado para tr(...), toast(...) ou aviso(...) no código precisa ter tradução.
const codigo = html.slice(html.indexOf('<script>', html.indexOf('/*DICT-END*/')));
const faltando = new Set();
const entrada = new Set(chaves);
function conferir(s){
  s = s.replace(/\\'/g, "'").replace(/\\n/g, '\n');
  if (!/[A-Za-zÀ-ÿ]{3,}/.test(s)) return;
  if (s !== s.trim() || s.startsWith('<') || /^(aria-|ov-|btn|\(pointer|2-digit|Shape Puzzle$)/.test(s)) return;   /* pedaços de frases: o teste no navegador confere */
  if (entrada.has(s)) return;
  // modelo com marcadores: troca números e textos soltos por {..}
  const casa = chaves.some(k => /\{\w+\}/.test(k) && new RegExp('^' + k.split(/\{\w+\}/).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('([\\s\\S]+?)') + '$').test(s));
  if (!casa) faltando.add(s);
}
const linhas = codigo.split('\n');
for (const ln of linhas){
  if (!/\b(toast|tr|aviso)\(/.test(ln)) continue;
  for (const m of ln.matchAll(/'((?:[^'\\]|\\.)*)'/g)){
    const s = m[1];
    if (/^(#|\.|[a-z]+:|erro|ok|giro|flip)/.test(s) && !/\s/.test(s)) continue;
    if (/^[#.][\w\s.#-]*$/.test(s) || /^\w+$/.test(s) && s === s.toLowerCase() && !chaves.includes(s)) continue;
    conferir(s);
  }
}
// textos montados com `...${}...` dentro de tr()/toast()
for (const m of codigo.matchAll(/(?:toast|tr)\(\s*`((?:[^`\\]|\\.)*)`/g)) conferir(m[1].replace(/\$\{[^}]*\}/g, '0'));
if (faltando.size){ falha('sem tradução (' + faltando.size + '):\n  ' + [...faltando].join('\n  ')); }
console.log(ok ? 'IDIOMAS: TUDO OK' : 'IDIOMAS: COM FALHAS');
process.exit(ok ? 0 : 1);
