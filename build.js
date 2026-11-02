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
    if (tipo === 'idiomas') return '<script>\n/*DICT-START*/\nwindow.DICT = {\n' + nomes.map(n => semFim(ler('idiomas', n))).join('') + '};\n/*DICT-END*/\n</script>';
    throw new Error('Diretiva desconhecida em src/pagina.html: ' + linha);
  }).join('\n');
}

const saida = path.join(raiz, 'index.html'), novo = montar();
if (process.argv.includes('--conferir')) {
  const atual = fs.existsSync(saida) ? fs.readFileSync(saida, 'utf8') : '';
  if (atual !== novo) { console.error('index.html está diferente de src/. Rode: node build.js'); process.exit(1); }
  console.log('index.html confere com src/.');
} else {
  fs.writeFileSync(saida, novo);
  console.log('index.html montado (' + novo.split('\n').length + ' linhas, ' + Math.round(novo.length / 1024) + ' KB).');
}
