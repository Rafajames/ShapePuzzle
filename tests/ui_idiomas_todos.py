# Todos os idiomas: o jogo abre, nada vaza da tela a 320 px e os botões cabem (textos longos em alemão, russo etc.).
import os, sys, re, json
from playwright.sync_api import sync_playwright
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'http://127.0.0.1:8765/index.html'
html = open(os.path.join(RAIZ, 'index.html'), encoding='utf8').read()
LANGS = re.findall(r'^"([a-z]{2}(?:-[A-Z]{2})?)": \[', html.split('/*DICT-START*/')[1].split('/*DICT-END*/')[0], re.M)
falhas, erros = [], []
def check(c, m):
    print(('  ok   ' if c else '  FALHA ') + m)
    if not c: falhas.append(m)
VAZA = """() => { const r = []; document.querySelectorAll('.ov.on .btn, .ov.on .daily, .ov.on .tile, .ov.on h1, .ov.on h2, .ov.on summary, #topo .btn, .barra .btn').forEach(e => {
  if (!e.offsetParent) return; const cs = getComputedStyle(e);
  if (e.scrollWidth > e.clientWidth + 2 && cs.overflow !== 'hidden' && cs.textOverflow !== 'ellipsis') r.push((e.id || e.className) + ': ' + e.textContent.trim().slice(0, 40)); });
  if (document.documentElement.scrollWidth > innerWidth) r.push('página mais larga que a tela'); return r; }"""
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for l in LANGS:
        c = b.new_context(viewport={'width': 320, 'height': 640}, locale=l)
        c.add_init_script("try{localStorage.setItem('shapepuzzle.tuto',JSON.stringify({sel:true,giro:true,esp:true,fim:true}));localStorage.setItem('shapepuzzle.lang',JSON.stringify(%s))}catch(e){}" % json.dumps(l))
        p = c.new_page(); p.on('pageerror', lambda e: erros.append(l + ': ' + str(e))); p.goto(URL); p.wait_for_timeout(500)
        check(p.evaluate("lang") == l and p.evaluate("document.documentElement.lang") == l, f'{l}: abre no idioma')
        telas = {}
        telas['inicio'] = p.evaluate(VAZA)
        p.click('#btnJogar'); p.wait_for_timeout(300); telas['fase'] = p.evaluate(VAZA)
        p.click('#btnMenu'); p.wait_for_timeout(300); telas['menu'] = p.evaluate(VAZA)
        p.evaluate("fecharTodos(); abrirConta()"); p.wait_for_timeout(300); telas['perfil'] = p.evaluate(VAZA)
        p.evaluate("fecharTodos(); abrirCamps()"); p.wait_for_timeout(300); telas['campeonatos'] = p.evaluate(VAZA)
        for t, r in telas.items(): check(not r, f'{l}: {t} cabe em 320 px' + (' → ' + '; '.join(r[:4]) if r else ''))
        c.close()
    b.close()
print('\nERROS DE PÁGINA:', erros if erros else 'nenhum')
if falhas or erros: print('UI IDIOMAS (TODOS): COM FALHAS'); sys.exit(1)
print('UI IDIOMAS (TODOS): TUDO OK')
