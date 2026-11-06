// Confere uma tradução nova. Uso: node tests/conferir-idioma.js fr   (ou: node tests/conferir-idioma.js todos)
// Verifica src/idiomas/<l>.js (mesmas chaves do en.js, mesmos {marcadores} e tags HTML, nada vazio),
// src/paginas/<l>.html (mesmas marcas, {L}, ids e mensagens do pt.html) e docs/loja/<l>.md (limites da Play Store).
const fs = require('fs'), path = require('path'), R = path.join(__dirname, '..');
const lerDict = l => { const s = fs.readFileSync(path.join(R, 'src/idiomas', l + '.js'), 'utf8'); return Object.values(eval('({' + s + '})'))[0]; };
const marcas = t => (String(t).match(/\{\w+\}/g) || []).sort().join();
const tags = t => (String(t).match(/<\/?[a-z]+/gi) || []).map(x => x.toLowerCase()).sort().join();
function conferir(l){
  const erros = [], en = lerDict('en');
  let d; try{ d = lerDict(l); }catch(e){ return ['idiomas/' + l + '.js não abre: ' + e.message]; }
  for (const k of Object.keys(en)){
    if (!(k in d)){ erros.push('falta: ' + k); continue; }
    if (typeof d[k] !== 'string' || !d[k].trim()) erros.push('vazio: ' + k);
    else { if (marcas(d[k]) !== marcas(k)) erros.push('marcadores diferentes: ' + k + ' → ' + d[k]); if (tags(d[k]) !== tags(k)) erros.push('tags HTML diferentes: ' + k + ' → ' + d[k]); }
  }
  for (const k of Object.keys(d)) if (!(k in en)) erros.push('chave a mais (não existe no jogo): ' + k);
  const pp = path.join(R, 'src/paginas', l + '.html');
  if (fs.existsSync(pp)){
    const pt = fs.readFileSync(path.join(R, 'src/paginas/pt.html'), 'utf8'), s = fs.readFileSync(pp, 'utf8');
    for (const m of ['<!--nome:', '<!--privacidade-->', '<!--termos-->', '<!--excluir-->', '<!--mensagens-->']) if (!s.includes(m)) erros.push('página: falta a marca ' + m);
    const cnt = (t, x) => t.split(x).length - 1;
    for (const x of ['{L}', 'id="msg-{L}"', 'id="entrar-{L}"', 'id="apagar-{L}"', '<h1>', '<h2>', 'github.com/Rafajames/ShapePuzzle/issues']) if (cnt(s, x) !== cnt(pt, x)) erros.push('página: quantidade diferente de ' + x + ' (' + cnt(s, x) + ' x ' + cnt(pt, x) + ')');
    try{ const a = JSON.parse(s.split('<!--mensagens-->')[1]), b = JSON.parse(pt.split('<!--mensagens-->')[1]); if (Object.keys(a).sort().join() !== Object.keys(b).sort().join()) erros.push('página: mensagens com chaves diferentes'); }
    catch(e){ erros.push('página: mensagens não são JSON válido'); }
  } else erros.push('falta src/paginas/' + l + '.html');
  const pl = path.join(R, 'docs/loja', l + '.md');
  if (fs.existsSync(pl)){
    const s = fs.readFileSync(pl, 'utf8'), sec = s.split(/^## /m).slice(1).map(x => x.slice(x.indexOf('\n') + 1).trim());
    if (sec.length < 3) erros.push('loja: precisa de título, descrição curta e completa');
    else { if ([...sec[0]].length > 30) erros.push('loja: título com mais de 30 caracteres: ' + sec[0]); if ([...sec[1]].length > 80) erros.push('loja: descrição curta com mais de 80 caracteres'); if ([...sec[2]].length > 4000) erros.push('loja: descrição completa com mais de 4000 caracteres'); }
  } else erros.push('falta docs/loja/' + l + '.md');
  return erros;
}
const alvo = process.argv[2];
const langs = alvo === 'todos' ? fs.readdirSync(path.join(R, 'src/idiomas')).map(f => f.replace('.js', '')).filter(l => l !== 'en') : [alvo];
let ruim = 0;
for (const l of langs){ const e = conferir(l); console.log(l + ': ' + (e.length ? e.length + ' problema(s)' : 'ok')); e.slice(0, 40).forEach(x => console.log('  - ' + x)); ruim += e.length; }
process.exit(ruim ? 1 : 0);
