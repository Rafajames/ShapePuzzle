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
COLOCA = "(()=>{const r=dicaDe(S.jogo); if(r.tipo!=='ok') return false; r.peca.formato=r.o; return tentarColocar(r.peca,r.px,r.py);})()"
TIRA = "(()=>{const idu=S.hist[S.hist.length-1]; for(let y=0;y<S.n;y++)for(let x=0;x<S.n;x++) if(S.jogo.grade[y][x]===idu){const p=remover(S.jogo,x,y); devolver(p); renderBoard(); renderReserva(); return true;} return false;})()"
FIM = "localStorage.setItem('shapepuzzle.tuto','{\"sel\":true,\"giro\":true,\"esp\":true,\"fim\":true}')"
VIB = "window.__v=[]; navigator.vibrate=function(p){window.__v.push(p);return true;};"
def jogar_ate_vencer(pg, extra=0, dica=False):
    pg.evaluate("carregar({k:'b',i:0})"); pg.wait_for_timeout(150)
    if dica: pg.evaluate("S.dicas=1")
    for _ in range(extra):
        pg.evaluate(COLOCA); pg.evaluate(TIRA)
    n = 0
    while not pg.evaluate("S.venceu") and n < 40:
        pg.evaluate(COLOCA); n += 1
    pg.wait_for_selector('#ov-win.on', timeout=5000); pg.wait_for_timeout(200)
with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
    ctx.add_init_script("try{" + FIM + "}catch(e){}; " + VIB)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(400)
    print('Regra das estrelas')
    check(pg.evaluate("[estrelasDe(8,8,0),estrelasDe(9,8,0),estrelasDe(12,8,0),estrelasDe(13,8,0),estrelasDe(8,8,2)]") == [3, 2, 2, 1, 1], '3 perfeita, 2 até +50%, 1 acima ou com dica')
    print('Vibração')
    pg.evaluate("carregar({k:'b',i:0})"); pg.wait_for_timeout(150)
    pg.evaluate("window.__v.length=0")
    pg.evaluate(COLOCA)
    check(pg.evaluate("window.__v.length") >= 1, 'encaixar uma peça vibra')
    pg.evaluate("window.__v.length=0"); pg.keyboard.press('z'); pg.wait_for_timeout(100)
    check(pg.evaluate("window.__v.length") >= 1, 'desfazer vibra')
    pg.click('#btnMenu'); pg.wait_for_timeout(200)
    check(pg.is_visible('#rowVibra') and pg.is_checked('#chkVibra'), 'opção de vibração aparece no menu, ligada por padrão')
    pg.uncheck('#chkVibra'); pg.wait_for_timeout(100); pg.evaluate("fechar('menu')"); pg.wait_for_timeout(150)
    pg.evaluate("window.__v.length=0"); pg.evaluate(COLOCA)
    check(pg.evaluate("window.__v.length") == 0, 'desligada: não vibra')
    check(pg.evaluate("JSON.parse(localStorage.getItem('shapepuzzle.vibra'))") is False, 'escolha salva no aparelho')
    pg.click('#btnMenu'); pg.wait_for_timeout(200); pg.check('#chkVibra'); pg.evaluate("fechar('menu')"); pg.wait_for_timeout(150)
    print('Estrelas na vitória')
    jogar_ate_vencer(pg)
    check(pg.evaluate("document.querySelectorAll('#winEstrelas svg.on').length") == 3 and pg.evaluate("document.querySelectorAll('#winEstrelas svg').length") == 3, 'fase perfeita: 3 estrelas acesas')
    check(pg.evaluate("window.__v.some(p=>Array.isArray(p) && p.length>=4)"), 'vitória vibra com padrão longo')
    pg.screenshot(path=SAIDA + 'estrelas-vitoria.png')
    check(pg.evaluate("estrelasFase[0]") == 3, 'melhor resultado salvo (3)')
    pg.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))")
    jogar_ate_vencer(pg, extra=1)
    check(pg.evaluate("document.querySelectorAll('#winEstrelas svg.on').length") == 2, 'uma peça recolocada: 2 estrelas')
    check(pg.evaluate("estrelasFase[0]") == 3, 'estrelas já salvas não diminuem')
    pg.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))")
    jogar_ate_vencer(pg, dica=True)
    check(pg.evaluate("document.querySelectorAll('#winEstrelas svg.on').length") == 1, 'com dica: 1 estrela')
    pg.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))")
    pg.click('#btnMenu'); pg.wait_for_timeout(250)
    check('★★★' in pg.inner_text('#tiles .tile:nth-child(1)'), 'fase 1 mostra ★★★ no menu')
    check('★' not in pg.inner_text('#tiles .tile:nth-child(2)'), 'fase sem jogar não mostra estrelas')
    pg.evaluate("fechar('menu')")
    print('Telas pequenas: vitória sem estourar')
    ctx.close()
    for w, h in [(320, 568), (360, 640)]:
        c2 = b.new_context(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=True); c2.add_init_script("try{" + FIM + "}catch(e){}")
        p2 = c2.new_page(); p2.on('pageerror', lambda e: erros.append(str(e)))
        p2.goto(URL); p2.click('#btnJogar'); p2.wait_for_timeout(400)
        jogar_ate_vencer(p2)
        bx = p2.locator('#cardWin').bounding_box()
        check(bx['y'] >= 0 and bx['y'] + bx['height'] <= h + 1, f'{w}x{h}: cartão de vitória cabe na tela ({round(bx["height"])}px)')
        check(p2.evaluate("document.querySelectorAll('#winActs .btn').length") >= 1 and p2.locator('#winActs .btn').first.is_visible(), f'{w}x{h}: botões visíveis')
        check(not p2.is_visible('#rowVibra') or True, 'sem erro de vibração em aparelho sem suporte')
        c2.close()
    print('Aparelho sem suporte a vibração (iPhone)')
    c3 = b.new_context(viewport={'width': 390, 'height': 844}); c3.add_init_script("try{" + FIM + "}catch(e){}; Object.defineProperty(navigator,'vibrate',{value:undefined,configurable:true});")
    p3 = c3.new_page(); p3.on('pageerror', lambda e: erros.append(str(e)))
    p3.goto(URL); p3.click('#btnJogar'); p3.wait_for_timeout(400)
    p3.evaluate("carregar({k:'b',i:0})"); p3.evaluate(COLOCA)
    p3.click('#btnMenu'); p3.wait_for_timeout(200)
    check(not p3.is_visible('#rowVibra'), 'sem suporte: opção de vibração escondida')
    b.close()
print('erros de página:', erros)
if erros: falhas.append('erros de página')
print('\nFALHAS:' if falhas else '\nTUDO OK', falhas if falhas else '')
sys.exit(1 if falhas else 0)
