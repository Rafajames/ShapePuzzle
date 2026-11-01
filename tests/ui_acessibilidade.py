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
FIM = "localStorage.setItem('shapepuzzle.tuto','{\"sel\":true,\"giro\":true,\"esp\":true,\"fim\":true}')"
COLOCA = "(()=>{const r=dicaDe(S.jogo); if(r.tipo!=='ok') return false; r.peca.formato=r.o; return tentarColocar(r.peca,r.px,r.py);})()"
FECHA = "document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))"
with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(locale='pt-BR', viewport={'width': 1100, 'height': 800}); ctx.add_init_script("try{" + FIM + "}catch(e){}")
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(300)
    print('Zoom e diálogos')
    check('maximum-scale' not in pg.evaluate("document.querySelector('meta[name=viewport]').content"), 'a página permite aumentar com pinça (sem maximum-scale)')
    check(pg.evaluate("document.querySelector('#app').inert") is True, 'com a abertura na tela, o fundo fica inerte')
    check(pg.evaluate("document.activeElement.id") == 'btnJogar', 'o foco vai para o botão Jogar da abertura')
    check(pg.get_attribute('#ov-menu .card', 'role') == 'dialog' and pg.get_attribute('#ov-menu .card', 'aria-modal') == 'true', 'painéis são diálogos (role=dialog, aria-modal)')
    check(pg.get_attribute('#ov-menu .card', 'aria-labelledby') is not None, 'diálogo tem nome (aria-labelledby)')
    pg.click('#btnJogar'); pg.wait_for_timeout(300)
    check(pg.evaluate("document.querySelector('#app').inert") is False, 'fechou a abertura: fundo volta a funcionar')
    pg.evaluate("carregar({k:'b',i:0})"); pg.wait_for_timeout(200)
    pg.focus('#btnMenu'); pg.click('#btnMenu'); pg.wait_for_timeout(300)
    check(pg.evaluate("document.querySelector('#app').inert") is True and pg.evaluate("!!document.activeElement.closest('#ov-menu')"), 'menu aberto: foco dentro do menu e fundo inerte')
    pg.evaluate("fechar('menu')"); pg.wait_for_timeout(300)
    check(pg.evaluate("document.activeElement.id") == 'btnMenu', 'ao fechar o menu o foco volta para o botão do menu')
    print('Rótulos para leitor de tela')
    check(pg.evaluate("document.querySelector('#board').getAttribute('aria-label')").startswith('Tabuleiro 5 por 5'), 'tabuleiro tem nome')
    check(pg.evaluate("document.querySelectorAll('#board .cell[aria-label]').length") == 25, 'as 25 casas têm descrição')
    check('Linha 1, coluna 1' in pg.evaluate("document.querySelector('#board .cell').getAttribute('aria-label')"), 'descrição da casa: ' + pg.evaluate("document.querySelector('#board .cell').getAttribute('aria-label')"))
    pw0 = pg.locator('#reserva .pw').first
    check(pw0.get_attribute('role') == 'button' and pw0.get_attribute('tabindex') == '0' and 'Peça' in pw0.get_attribute('aria-label'), 'peças são botões focáveis: ' + pw0.get_attribute('aria-label'))
    check(pg.get_attribute('#live', 'aria-live') == 'polite' and pg.get_attribute('#toast', 'aria-live') == 'polite', 'regiões de aviso (aria-live) existem')
    print('Teclado')
    pg.evaluate("document.activeElement.blur()")
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(100)
    check(pg.evaluate("!!S.cursor") and pg.locator('#board .cell.cur').count() == 1, 'seta mostra o cursor no tabuleiro')
    check(pg.evaluate("document.activeElement.id") == 'board', 'o foco vai para o tabuleiro')
    x0 = pg.evaluate("S.cursor.x"); pg.keyboard.press('ArrowRight'); pg.keyboard.press('ArrowDown'); pg.wait_for_timeout(100)
    check(pg.evaluate("S.cursor.x") == x0 + 1, 'seta move o cursor')
    for _ in range(10): pg.keyboard.press('ArrowLeft')
    check(pg.evaluate("S.cursor.x") == 0, 'cursor para na borda')
    pg.wait_for_timeout(200)
    check('Linha' in pg.inner_text('#live'), 'leitor de tela é avisado da casa: ' + pg.inner_text('#live')[:60])
    pg.keyboard.press('1'); pg.wait_for_timeout(100)
    check(pg.evaluate("!!S.sel && visiveis(S.jogo)[0]===S.sel"), 'tecla 1 escolhe a primeira peça')
    pg.keyboard.press('p'); pg.wait_for_timeout(100)
    check(pg.evaluate("visiveis(S.jogo)[1]===S.sel"), 'tecla P passa para a próxima peça')
    # coloca a peça da dica pelo teclado
    pos = pg.evaluate("""(()=>{const r=dicaDe(S.jogo); if(r.tipo!=='ok') return null; S.sel=r.peca; r.peca.formato=r.o; renderReserva();
        return {x:r.px+Math.floor(r.o[0].length/2), y:r.py+Math.floor(r.o.length/2)};})()""")
    pg.evaluate(f"S.cursor={{x:{pos['x']},y:{pos['y']}}}; moverCursor(0,0)"); pg.wait_for_timeout(100)
    check(pg.evaluate("S.hover && S.hover.x") == pos['x'], 'cursor posicionado')
    antes = pg.evaluate("S.jogo.mapa.size")
    pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    check(pg.evaluate("S.jogo.mapa.size") == antes + 1, 'Enter encaixa a peça no cursor')
    check('encaixada' in pg.inner_text('#live') or 'Peça' in pg.inner_text('#live'), 'leitor de tela é avisado: ' + pg.inner_text('#live')[:50])
    oc = pg.evaluate("(()=>{for(let y=0;y<S.n;y++)for(let x=0;x<S.n;x++) if(S.jogo.grade[y][x]) return {x,y};})()")
    pg.evaluate(f"S.cursor={{x:{oc['x']},y:{oc['y']}}}; moverCursor(0,0)"); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    check(pg.evaluate("S.jogo.mapa.size") == antes, 'Enter numa casa ocupada tira a peça')
    pg.evaluate(COLOCA); pg.keyboard.press('z'); pg.wait_for_timeout(100)
    check(pg.evaluate("S.jogo.mapa.size") == antes, 'Z desfaz')
    # peça focada + Enter seleciona
    pg.evaluate("S.sel=null; renderReserva()")
    pg.focus('#reserva .pw >> nth=2'); pg.keyboard.press('Enter'); pg.wait_for_timeout(100)
    check(pg.evaluate("visiveis(S.jogo)[2]===S.sel"), 'Enter numa peça focada seleciona')
    # a partida inteira só com teclado + dica
    pg.evaluate("carregar({k:'b',i:0})"); pg.wait_for_timeout(150)
    n = 0
    while not pg.evaluate("S.venceu") and n < 40:
        p2 = pg.evaluate("""(()=>{const r=dicaDe(S.jogo); if(r.tipo!=='ok') return null; S.sel=r.peca; r.peca.formato=r.o; renderReserva();
            return {x:r.px+Math.floor(r.o[0].length/2), y:r.py+Math.floor(r.o.length/2)};})()""")
        if not p2: break
        pg.evaluate(f"S.cursor={{x:{p2['x']},y:{p2['y']}}}; moverCursor(0,0)"); pg.keyboard.press('Space'); n += 1
    check(pg.evaluate("S.venceu"), 'fase concluída usando só cursor e teclas (%d peças)' % n)
    pg.wait_for_selector('#ov-win.on'); pg.evaluate(FECHA)

    print('Opções do menu')
    pg.evaluate("carregar({k:'b',i:0})"); pg.wait_for_timeout(150); pg.evaluate("abrirMenu()"); pg.wait_for_timeout(200)
    pg.check('#chkDalt'); pg.wait_for_timeout(150)
    check(pg.evaluate("document.body.classList.contains('dalt')"), 'símbolos ligados (classe dalt)')
    pg.evaluate(FECHA); pg.evaluate(COLOCA); pg.wait_for_timeout(100)
    sim = pg.evaluate("""(()=>{const e=document.querySelector('#reserva .pc:not(.e)'); const f=document.querySelector('#board .fill[data-s]'); const st=[...document.querySelectorAll('#board .star[data-s]')].find(x=>getComputedStyle(x).display!=='none');
        const bg = x => x ? getComputedStyle(x,'::after').backgroundImage : '';
        return {peca: bg(e).includes('data:image/svg'), casa: bg(f).includes('data:image/svg'), estrela: !!st && bg(st).includes('data:image/svg'),
                formas: new Set([...document.querySelectorAll('#reserva .pc:not(.e)')].map(x=>getComputedStyle(x,'::after').backgroundImage)).size}})()""")
    check(sim['peca'] and sim['casa'] and sim['estrela'], 'símbolo aparece nas peças, nas casas preenchidas e nas estrelas: ' + str(sim))
    check(sim['formas'] >= 2, 'cores diferentes usam símbolos diferentes (%d formas na seleção)' % sim['formas'])
    pg.screenshot(path=SAIDA + 'acess-daltonico.png')
    pg.evaluate("abrirMenu()"); pg.wait_for_timeout(200); pg.uncheck('#chkDalt'); pg.check('#chkCont'); pg.check('#chkTexto'); pg.check('#chkMov'); pg.wait_for_timeout(200)
    check(pg.evaluate("['dalt','cont','tg','rm'].map(c=>document.body.classList.contains(c)).join()") == 'false,true,true,true', 'contraste, texto maior e menos animação ligados; símbolos desligados')
    check(pg.evaluate("JSON.parse(localStorage.getItem('shapepuzzle.a11y')).texto") is True, 'escolhas salvas')
    pg.evaluate(FECHA); pg.screenshot(path=SAIDA + 'acess-contraste-texto.png')
    check(pg.evaluate("document.documentElement.scrollHeight") <= 800, 'texto maior: sem rolagem em 1100x800')
    # confete desligado
    pg.evaluate("carregar({k:'b',i:0})"); pg.wait_for_timeout(150)
    n = 0
    while not pg.evaluate("S.venceu") and n < 40: pg.evaluate(COLOCA); n += 1
    pg.wait_for_selector('#ov-win.on'); pg.wait_for_timeout(200)
    check(pg.locator('#cardWin .conf').count() == 0, 'sem confetes quando "reduzir animações" está ligado')
    pg.evaluate(FECHA)
    pg.reload(); pg.wait_for_timeout(300)
    check(pg.evaluate("['dalt','cont','tg','rm'].map(c=>document.body.classList.contains(c)).join()") == 'false,true,true,true', 'as escolhas continuam depois de recarregar')
    ctx.close()
    print('Padrões do aparelho')
    c2 = b.new_context(locale='pt-BR', viewport={'width': 390, 'height': 844}, reduced_motion='reduce', forced_colors='none', color_scheme='dark'); c2.add_init_script("try{" + FIM + "}catch(e){}")
    p2 = c2.new_page(); p2.goto(URL); p2.wait_for_timeout(300)
    check(p2.evaluate("document.body.classList.contains('rm')"), 'se o aparelho pede menos movimento, o jogo já começa com menos animação')
    c2.close()
    print('Telas pequenas com texto maior + contraste')
    for w, h in [(320, 568), (360, 640), (390, 844)]:
        c3 = b.new_context(locale='pt-BR', viewport={'width': w, 'height': h}, has_touch=True, is_mobile=True)
        c3.add_init_script("try{" + FIM + ";localStorage.setItem('shapepuzzle.a11y','{\"dalt\":true,\"cont\":true,\"texto\":true,\"mov\":true}')}catch(e){}")
        p3 = c3.new_page(); p3.on('pageerror', lambda e: erros.append(str(e)))
        p3.goto(URL); p3.click('#btnJogar'); p3.wait_for_timeout(400)
        for i in (0, 14, 35):
            p3.evaluate("carregar({k:'b',i:%d})" % i); p3.wait_for_timeout(200)
            check(p3.evaluate("document.documentElement.scrollHeight") <= h and p3.evaluate("document.documentElement.scrollWidth") <= w, f'{w}x{h} fase {i+1}: cabe sem rolar')
        c3.close()
    b.close()
print('erros de página:', erros)
if erros: falhas.append('erros de página')
print('\nFALHAS:' if falhas else '\nTUDO OK', falhas if falhas else '')
sys.exit(1 if falhas else 0)
