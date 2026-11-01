import os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'tests', 'saida') + os.sep
os.makedirs(SAIDA, exist_ok=True)
from playwright.sync_api import sync_playwright
URL = 'http://127.0.0.1:8765/index.html'
falhas = []; erros = []
def check(c, m):
    print(('  ok   ' if c else '  FALHA ') + m)
    if not c: falhas.append(m)
with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(locale='pt-BR', viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
    cdp = ctx.new_cdp_session(pg)
    def toque(x, y):
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    def desliza(x0, y0, x1, y1, passos=6):
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x0, 'y': y0}]})
        for i in range(1, passos + 1):
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x0 + (x1 - x0) * i / passos, 'y': y0 + (y1 - y0) * i / passos}]})
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    def centro(sel):
        bx = pg.locator(sel).first.bounding_box(); return bx['x'] + bx['width'] / 2, bx['y'] + bx['height'] / 2
    pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(500)
    pg.evaluate("carregar({k:'b',i:0})"); pg.wait_for_timeout(300)
    print('Passo 1: selecionar')
    check(pg.evaluate("document.querySelector('#mao').classList.contains('on') && document.querySelector('#mao').classList.contains('toque')"), 'mão aparece mostrando o toque')
    check(pg.is_visible('#tutoPular'), 'botão de pular visível')
    check('Toque numa peça' in pg.inner_text('#dica'), 'texto do passo 1 na dica')
    check(pg.evaluate("document.documentElement.scrollHeight") <= 844, 'sem rolagem com o tutorial ativo')
    pg.screenshot(path=SAIDA + 'tutorial-1.png')
    x, y = centro('#reserva .pw'); toque(x, y); pg.wait_for_timeout(250)
    print('Passo 2: dois toques')
    check(pg.evaluate("document.querySelector('#mao').classList.contains('duplo')"), 'mão passa a mostrar dois toques')
    check('dois toques' in pg.inner_text('#dica'), 'texto do passo 2')
    x, y = centro('#reserva .pw.sel'); toque(x, y); pg.wait_for_timeout(120); toque(x + 1, y); pg.wait_for_timeout(250)
    check(pg.evaluate("tuto.giro") is True, 'girar marca o passo 2 como feito')
    print('Passo 3: deslizar')
    check(pg.evaluate("document.querySelector('#mao').classList.contains('desliza')"), 'mão passa a mostrar o deslize')
    check('deslize' in pg.inner_text('#dica'), 'texto do passo 3')
    x, y = centro('#dica'); desliza(40, y, 300, y); pg.wait_for_timeout(300)
    check(pg.evaluate("tuto.fim") is True, 'tutorial termina após espelhar')
    check(not pg.evaluate("document.querySelector('#mao').classList.contains('on')"), 'mão some ao final')
    check(not pg.is_visible('#tutoPular'), 'botão de pular some ao final')
    check(pg.evaluate("JSON.parse(localStorage.getItem('shapepuzzle.tuto')).fim") is True, 'progresso do tutorial salvo')
    print('Recarregar não repete')
    pg.reload(); pg.click('#btnJogar'); pg.wait_for_timeout(400)
    check(not pg.evaluate("document.querySelector('#mao').classList.contains('on')"), 'tutorial não reaparece depois de concluído')
    print('Rever pelo menu')
    pg.click('#btnMenu'); pg.wait_for_timeout(200); pg.click('#btnTuto'); pg.wait_for_timeout(300)
    check(pg.evaluate("document.querySelector('#mao').classList.contains('toque')"), 'menu reinicia o tutorial')
    print('Pular')
    pg.click('#tutoPular'); pg.wait_for_timeout(200)
    check(pg.evaluate("tuto.fim") is True and not pg.is_visible('#tutoPular'), 'pular encerra o tutorial')
    print('Telas pequenas')
    for w, h in [(320, 568), (360, 640), (390, 844)]:
        c2 = b.new_context(locale='pt-BR', viewport={'width': w, 'height': h}, has_touch=True, is_mobile=True); p2 = c2.new_page(); p2.on('pageerror', lambda e: erros.append(str(e)))
        p2.goto(URL); p2.click('#btnJogar'); p2.wait_for_timeout(400)
        for i in (0, 14, 35):
            p2.evaluate("carregar({k:'b',i:%d})" % i); p2.wait_for_timeout(200)
            check(p2.evaluate("document.documentElement.scrollHeight") <= h, f'{w}x{h} fase {i+1}: sem rolagem com tutorial')
        c2.close()
    print('Computador (mouse)')
    c3 = b.new_context(locale='pt-BR', viewport={'width': 1200, 'height': 800}); p3 = c3.new_page(); p3.on('pageerror', lambda e: erros.append(str(e)))
    p3.goto(URL); p3.click('#btnJogar'); p3.wait_for_timeout(400)
    check(not p3.evaluate("document.querySelector('#mao').classList.contains('on')") and not p3.is_visible('#tutoPular'), 'tutorial não aparece no computador')
    b.close()
print('erros de página:', erros)
if erros: falhas.append('erros de página')
print('\nFALHAS:' if falhas else '\nTUDO OK', falhas if falhas else '')
sys.exit(1 if falhas else 0)
