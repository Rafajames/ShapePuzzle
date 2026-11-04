import os, sys, json
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'tests', 'saida') + os.sep
os.makedirs(SAIDA, exist_ok=True)
from playwright.sync_api import sync_playwright
URL = 'http://127.0.0.1:8765/index.html'
erros, falhas = [], []
def check(c, m):
    print(('  ok   ' if c else '  FALHA ') + m)
    if not c: falhas.append(m)
FIM = "try{localStorage.setItem('shapepuzzle.tuto',JSON.stringify({sel:true,giro:true,esp:true,fim:true}))}catch(e){}"
PROG = "try{localStorage.setItem('shapepuzzle.prog',JSON.stringify({max:5,done:[0,1,2,3,4]}))}catch(e){}"
def novo(b, w, h, init='', touch=False):
    c = b.new_context(locale='pt-BR', viewport={'width': w, 'height': h}, has_touch=touch, is_mobile=touch, device_scale_factor=2)
    if init: c.add_init_script(init)
    p = c.new_page(); p.on('pageerror', lambda e: erros.append(str(e))); p.goto(URL); p.wait_for_timeout(400)
    return c, p
with sync_playwright() as pw:
    b = pw.chromium.launch()
    print('Primeira vez')
    c, p = novo(b, 390, 844)
    check(p.inner_text('#jogarTxt') == 'Jogar' and p.is_hidden('#jogarSub'), 'novato vê "Jogar" sem subtítulo')
    check(p.locator('.homeGrade .btn').count() == 6, 'seis atalhos na tela inicial')
    check(p.evaluate("!document.querySelector('details.como').open"), '"Como jogar" começa recolhido')
    p.screenshot(path=SAIDA + 'inicio-novato.png')
    c.close()
    print('Quem já joga')
    c, p = novo(b, 390, 844, FIM + PROG)
    check(p.inner_text('#jogarTxt') == 'Continuar' and 'Fase 6' in p.inner_text('#jogarSub'), 'veterano vê "Continuar" e a fase: ' + p.inner_text('#jogarSub'))
    p.screenshot(path=SAIDA + 'inicio-veterano.png')
    p.click('#btnJogar'); check(not p.evaluate("document.querySelector('#ov-splash').classList.contains('on')"), 'Continuar entra no jogo')
    p.click('#btnMenu'); p.click('#btnInicio'); p.wait_for_timeout(200)
    check(p.evaluate("document.querySelector('#ov-splash').classList.contains('on')") and not p.evaluate("document.querySelector('#ov-menu').classList.contains('on')"), 'Menu → Tela inicial volta para a inicial')
    for hid, alvo, desc in (('#hDia', "S.cur.k=='d'", 'Fase do dia'), ('#hInf', "document.querySelector('#ov-inf').classList.contains('on')", 'Modo infinito'),
                            ('#hCamp', "[...document.querySelectorAll('.ov.on')].some(o=>o.id!=='ov-splash')", 'Campeonatos'),
                            ('#hEst', "[...document.querySelectorAll('.ov.on')].some(o=>o.id!=='ov-splash')", 'Estatísticas'),
                            ('#hMenu', "document.querySelector('#ov-menu').classList.contains('on')", 'Menu')):
        p.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on')); document.querySelector('#ov-splash').classList.add('on')")
        p.click(hid); p.wait_for_timeout(500)
        check(p.evaluate(alvo) and not p.evaluate("document.querySelector('#ov-splash').classList.contains('on')"), f'atalho {desc} funciona')
    c.close()
    print('Idiomas')
    c, p = novo(b, 390, 844, FIM + PROG + "try{localStorage.setItem('shapepuzzle.lang','\"en\"')}catch(e){}")
    p.evaluate("typeof lang!=='undefined' && (lang='en', aplicarIdioma())"); p.wait_for_timeout(200)
    check(p.inner_text('#jogarTxt') == 'Continue' and 'Daily level' in p.inner_text('#hDia'), 'inglês: ' + p.inner_text('#jogarTxt'))
    c.close()
    print('Telas pequenas')
    for w, h in [(320, 568), (360, 640), (412, 915), (1200, 800)]:
        c, p = novo(b, w, h, FIM + PROG, touch=w < 500)
        d = p.evaluate("(()=>{const k=document.querySelector('#ov-splash .card');return [k.scrollHeight,k.clientHeight,document.documentElement.scrollWidth]})()")
        check(d[2] <= w, f'{w}x{h}: sem rolagem horizontal')
        check(d[0] <= d[1] + 1 or p.evaluate("getComputedStyle(document.querySelector('#ov-splash .card')).overflowY") in ('auto', 'scroll'), f'{w}x{h}: card cabe ou rola ({d})')
        p.click('#btnJogar')
        check(p.evaluate("document.documentElement.scrollHeight") <= h, f'{w}x{h}: o jogo continua sem rolagem')
        if w == 320: 
            p.click('#btnMenu'); p.click('#btnInicio'); p.screenshot(path=SAIDA + 'inicio-320.png')
        c.close()
    b.close()
print('erros de página:', erros)
sys.exit(0 if not falhas and not erros else 1)
