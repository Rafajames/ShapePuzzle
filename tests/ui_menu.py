# Menu em seções: o que aparece fechado, o que abre, teclado, tamanho e idiomas.
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
FIM = "try{localStorage.setItem('shapepuzzle.tuto','{\"sel\":true,\"giro\":true,\"esp\":true,\"fim\":true}')}catch(e){}"
SECOES = ['Fases', 'Minhas fases', 'Jogo', 'Som', 'Aparência e idioma', 'Acessibilidade', 'Progresso e dados', 'Sobre e atualização']
with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(locale='pt-BR', viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
    ctx.add_init_script(FIM)
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(300)
    pg.click('#btnMenu'); pg.wait_for_timeout(300)

    print('Menu recém-aberto')
    check(pg.inner_text('#ov-menu h1') == 'Menu', 'título "Menu"')
    nomes = pg.evaluate("[...document.querySelectorAll('#ov-menu details.sec>summary')].map(s=>s.textContent.trim())")
    check(nomes == SECOES, f'seções na ordem: {nomes}')
    abertas = pg.evaluate("[...document.querySelectorAll('#ov-menu details.sec')].filter(d=>d.open).map(d=>d.firstChild.textContent.trim())")
    check(abertas == ['Fases'], f'só "Fases" começa aberta: {abertas}')
    for i in ('#btnDia', '#btnInf', '#btnEst', '#btnCamp'):
        check(pg.is_visible(i), f'atalho sempre à vista: {i}')
    for i in ('#selTema', '#chkMusica', '#chkDalt', '#btnBackup', '#btnAtualizar', '#btnCriar', '#selPecas'):
        check(not pg.is_visible(i), f'{i} fica escondido dentro da seção fechada')
    check(pg.is_visible('#tiles .tile'), 'as fases aparecem sem precisar abrir nada')
    aberto_h = pg.evaluate("document.querySelector('#ov-menu .card').scrollHeight")
    pg.screenshot(path=SAIDA + 'menu-inicial.png')

    print('Abrir e fechar')
    pg.click('#ov-menu summary:has-text("Aparência e idioma")'); pg.wait_for_timeout(200)
    check(pg.is_visible('#selTema') and pg.is_visible('#selIdioma'), 'tocar na seção mostra tema e idioma')
    check(pg.is_visible('#tiles .tile'), 'abrir uma seção não fecha as outras')
    pg.click('#ov-menu summary:has-text("Aparência e idioma")'); pg.wait_for_timeout(200)
    check(not pg.is_visible('#selTema'), 'tocar de novo esconde')
    pg.click('#ov-menu summary:has-text("Fases")'); pg.wait_for_timeout(200)
    check(not pg.is_visible('#tiles .tile'), 'dá para fechar a seção das fases')
    check(pg.evaluate("document.querySelector('#ov-menu .card').scrollHeight") < aberto_h * 0.6, 'menu com tudo fechado é bem mais curto')

    print('Teclado')
    pg.evaluate("document.querySelectorAll('#ov-menu details.sec').forEach(d=>d.open=false)")
    pg.focus('#ov-menu summary:has-text("Som")'); pg.keyboard.press('Enter'); pg.wait_for_timeout(150)
    check(pg.is_visible('#chkMusica'), 'Enter na seção abre')
    pg.keyboard.press('Space'); pg.wait_for_timeout(150)
    check(not pg.is_visible('#chkMusica'), 'Espaço fecha')

    print('Cada seção guarda o que deveria')
    pg.evaluate("document.querySelectorAll('#ov-menu details.sec').forEach(d=>d.open=true)")
    dentro = lambda sec, sel: pg.evaluate(f"[...document.querySelectorAll('#ov-menu details.sec')].find(d=>d.firstChild.textContent.trim()==='{sec}').querySelector('{sel}')!==null")
    for sec, sels in {'Fases': ['#tiles'], 'Minhas fases': ['#customList', '#btnCriar', '#btnImportar'], 'Jogo': ['#selPecas', '#chkVibra', '#btnTuto'],
                      'Som': ['#chkMusica', '#selHumor', '#rngVol', '#chkSfx'], 'Aparência e idioma': ['#selIdioma', '#selTema'],
                      'Acessibilidade': ['#chkDalt', '#chkCont', '#chkTexto', '#chkMov'], 'Progresso e dados': ['#btnBackup', '#btnZerar'],
                      'Sobre e atualização': ['#btnAtualizar', '#verTxt', '#btnTeste', '#btnCompJogo']}.items():
        check(all(dentro(sec, s) for s in sels), f'{sec}: {", ".join(sels)}')
    pg.evaluate("document.querySelector('#ov-menu .card').scrollTo(0, 0)"); pg.wait_for_timeout(100)
    pg.screenshot(path=SAIDA + 'menu-tudo-aberto.png')
    check(pg.evaluate("(()=>{const c=document.querySelector('#ov-menu .card'); return c.scrollWidth<=c.clientWidth+1})()"), 'sem rolagem lateral')

    print('Funciona dentro das seções')
    pg.select_option('#selTema', 'oceano'); pg.wait_for_timeout(150)
    check(pg.evaluate("document.documentElement.dataset.tema") == 'oceano', 'trocar o tema dentro da seção funciona')
    pg.check('#chkDalt'); pg.wait_for_timeout(100)
    check(pg.evaluate("document.body.classList.contains('dalt') || a11y.dalt === true"), 'acessibilidade dentro da seção funciona')

    print('Inglês e telas pequenas')
    pg.select_option('#selIdioma', 'en'); pg.wait_for_timeout(300)
    nomes = pg.evaluate("[...document.querySelectorAll('#ov-menu details.sec>summary')].map(s=>s.textContent.trim())")
    check(nomes == ['Levels', 'My levels', 'Game', 'Sound', 'Appearance and language', 'Accessibility', 'Progress and data', 'About and updates'], f'seções em inglês: {nomes}')
    ctx.close()
    ctx = b.new_context(locale='es-ES', viewport={'width': 320, 'height': 568}, has_touch=True, is_mobile=True, color_scheme='light')
    ctx.add_init_script(FIM)
    p2 = ctx.new_page(); p2.on('pageerror', lambda e: erros.append(str(e)))
    p2.goto(URL); p2.click('#btnJogar'); p2.click('#btnMenu'); p2.wait_for_timeout(300)
    check(p2.inner_text('#ov-menu h1') == 'Menú', 'espanhol: título do menu')
    p2.evaluate("document.querySelectorAll('#ov-menu details.sec').forEach(d=>d.open=true)")
    check(p2.evaluate("(()=>{const c=document.querySelector('#ov-menu .card'); return c.scrollWidth<=c.clientWidth+1})()"), '320 px sem rolagem lateral')
    p2.screenshot(path=SAIDA + 'menu-320-claro.png')
    b.close()
print('erros de página:', erros)
if erros: falhas.append('erros de página')
print('TUDO OK' if not falhas else 'FALHAS: ' + str(falhas)); sys.exit(1 if falhas else 0)
