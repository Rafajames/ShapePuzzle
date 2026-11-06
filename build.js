#!/usr/bin/env node
// Monta o index.html a partir dos arquivos de src/. Uso: node build.js   (ou: node build.js --conferir)
// O index.html continua sendo UM arquivo só (é ele que o GitHub Pages publica); src/ é onde se edita.
const fs = require('fs'), path = require('path');
const raiz = __dirname, src = path.join(raiz, 'src');
const ler = (...p) => fs.readFileSync(path.join(src, ...p), 'utf8');
const semFim = t => t.endsWith('\n') ? t : t + '\n';

function montar() {
  return ler('pagina.html').split('\n').map(linha => {
    const m = linha.match(/^@@(\w+)\s*(.*)$/);
    if (!m) return linha;
    const [, tipo, resto] = m, nomes = resto.split(/\s+/).filter(Boolean);
    if (tipo === 'style') return '<style>\n' + nomes.map(n => semFim(ler('css', n))).join('') + '</style>';
    if (tipo === 'script') {
      // "=ALGO" vira a linha "// ==ALGO==": marcas que os testes e o gerador de fases usam para achar a lógica pura
      return '<script>\n' + nomes.map(n => n[0] === '=' ? '// ==' + n.slice(1) + '==\n' : semFim(ler('js', n))).join('') + '</script>';
    }
    if (tipo === 'idiomas' && nomes[0] === '*') nomes.splice(0, 1, ...fs.readdirSync(path.join(src, 'idiomas')).filter(f => f.endsWith('.js')).sort());
    if (tipo === 'idiomas') {
      // Os dicionários repetem as mesmas chaves (as frases em português): no index.html vão uma vez só, e cada idioma vira uma lista na mesma ordem.
      const dicts = Object.assign({}, ...nomes.map(n => eval('({' + ler('idiomas', n) + '})')));
      const K = Object.keys(dicts.en), V = Object.fromEntries(Object.entries(dicts).map(([l, d]) => [l, K.map(k => k in d ? d[k] : k)]));
      return '<script>\n/*DICT-START*/\nwindow.DICT = (function(){\nconst K = ' + JSON.stringify(K) + ';\nconst V = {\n'
        + Object.entries(V).map(([l, v]) => JSON.stringify(l) + ': ' + JSON.stringify(v)).join(',\n')
        + '\n};\nconst D = {}; for (const l in V) D[l] = Object.fromEntries(K.map((k, i) => [k, V[l][i]])); return D;\n})();\n/*DICT-END*/\n</script>';
    }
    throw new Error('Diretiva desconhecida em src/pagina.html: ' + linha);
  }).join('\n');
}

/* Páginas públicas (privacidade, termos, excluir conta): uma seção por idioma, a partir de src/paginas/<idioma>.html.
   Cada arquivo tem as marcas <!--nome: …-->, <!--privacidade-->, <!--termos-->, <!--excluir--> e <!--mensagens--> (JSON). */
function montarPaginas() {
  const dir = path.join(src, 'paginas');
  const idiomas = fs.readdirSync(dir).filter(f => /^[a-z]{2}(-[A-Z]{2})?\.html$/.test(f)).map(f => {
    const t = fs.readFileSync(path.join(dir, f), 'utf8'), l = f.replace('.html', '');
    const parte = (a, b) => t.split('<!--' + a + '-->')[1].split(b ? '<!--' + b + '-->' : /$^/)[0].trim().split('{L}').join(l);
    return {l, nome: t.match(/<!--nome: (.*?)-->/)[1], privacidade: parte('privacidade', 'termos'), termos: parte('termos', 'excluir'),
      excluir: parte('excluir', 'mensagens'), msg: JSON.parse(t.split('<!--mensagens-->')[1])};
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  const cab = fs.readFileSync(path.join(dir, '_cabecalho.html'), 'utf8'), lista = JSON.stringify(idiomas.map(i => i.l));
  const seletor = '<div class="top"><a href="./" class="mut">Shape Puzzle</a><label class="lang"><span hidden>Language</span><select aria-label="Language">'
    + idiomas.map(i => `<option value="${i.l}">${i.nome}</option>`).join('') + '</select></label></div>';
  const idioma = `<script>
(function(){
  var ok=${lista},q=new URLSearchParams(location.search).get('l'),nav=(navigator.language||'pt').toLowerCase();
  var n=nav==='pt-pt'?'pt-PT':nav.slice(0,2);
  var l=ok.indexOf(q)>=0?q:ok.indexOf(n)>=0?n:'en';
  var sel=document.querySelector('.lang select');
  function set(x){document.documentElement.lang=x;document.querySelectorAll('[data-l]').forEach(function(e){e.classList.toggle('on',e.getAttribute('data-l')===x)});
    sel.value=x;window.LANG=x;document.title=(document.querySelector('[data-l="'+x+'"] h1')||{}).textContent||document.title}
  sel.onchange=function(){set(sel.value)};set(l);
})();
</script>`;
  const pagina = (campo, extra) => cab.replace('{{LANG}}', 'pt') + seletor + '\n'
    + idiomas.map(i => `<section data-l="${i.l}">${i[campo]}</section>`).join('\n') + '\n</main>\n' + idioma + '\n' + (extra || '') + '\n</body></html>\n';
  const excluirJs = fs.readFileSync(path.join(dir, '_excluir.js.html'), 'utf8')
    .replace('{{MENSAGENS}}', JSON.stringify(Object.fromEntries(idiomas.map(i => [i.l, i.msg]))));
  return {'privacidade.html': pagina('privacidade'), 'termos.html': pagina('termos'), 'excluir-conta.html': pagina('excluir', excluirJs)};
}

const saidas = Object.assign({'index.html': montar()}, montarPaginas());
if (process.argv.includes('--conferir')) {
  for (const [arq, novo] of Object.entries(saidas)) {
    const s = path.join(raiz, arq), atual = fs.existsSync(s) ? fs.readFileSync(s, 'utf8') : '';
    if (atual !== novo) { console.error(arq + ' está diferente de src/. Rode: node build.js'); process.exit(1); }
  }
  console.log('index.html e páginas conferem com src/.');
} else {
  for (const [arq, novo] of Object.entries(saidas)) fs.writeFileSync(path.join(raiz, arq), novo);
  const ix = saidas['index.html'];
  console.log('index.html montado (' + ix.split('\n').length + ' linhas, ' + Math.round(ix.length / 1024) + ' KB) e ' + (Object.keys(saidas).length - 1) + ' páginas públicas.');
}
