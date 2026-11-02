// Verificação estática do código do jogo (variável não declarada, repetida, sem uso, chave repetida...).
// O jogo é um arquivo só, então o ESLint lê todos os <script> do index.html juntos.
const fs = require('fs'), path = require('path'), os = require('os');
const { ESLint } = require('eslint'), globals = require('globals');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const js = [...html.matchAll(/<script>\n([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(t => !t.includes('QR Code Generator')).join('\n');
const tmp = path.join(os.tmpdir(), 'shapepuzzle-lint.js'); fs.writeFileSync(tmp, js);
(async () => {
  const eslint = new ESLint({ overrideConfigFile: true, cwd: os.tmpdir(), overrideConfig: [{
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser, qrcode: 'readonly', CompressionStream: 'readonly', DecompressionStream: 'readonly' } },
    linterOptions: { reportUnusedDisableDirectives: false },
    rules: { 'no-undef': 'error', 'no-redeclare': 'error', 'no-dupe-keys': 'error', 'no-dupe-args': 'error', 'no-unreachable': 'error',
      'no-const-assign': 'error', 'no-func-assign': 'error', 'no-self-assign': 'error', 'no-unsafe-negation': 'error', 'use-isnan': 'error', 'valid-typeof': 'error',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', vars: 'all' }] } }] });
  const [r] = await eslint.lintFiles([tmp]);
  const linha = m => '  linha ' + m.line + ': ' + m.message + ' (' + m.ruleId + ')';
  const erros = r.messages.filter(m => m.severity === 2), avisos = r.messages.filter(m => m.severity === 1);
  avisos.forEach(m => console.log('aviso' + linha(m))); erros.forEach(m => console.log('ERRO ' + linha(m)));
  console.log(erros.length ? 'FALHOU: ' + erros.length + ' erro(s)' : 'lint ok (' + avisos.length + ' aviso(s))');
  process.exit(erros.length ? 1 : 0);
})();
