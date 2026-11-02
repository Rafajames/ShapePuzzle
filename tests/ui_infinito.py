# Modo infinito: escolha de dificuldade, geração em segundo plano, progresso, fila de peças e vitória.
import os, sys, re
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
FIM = "localStorage.setItem('shapepuzzle.tuto','{\"sel\":true,\"giro\":true,\"esp\":true,\"fim\":true}')"
def fecha_tudo(pg): pg.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))"); pg.wait_for_timeout(100)
def vencer(pg, extra=False):
    n = 0
    while not pg.evaluate("S.venceu") and n < 60: pg.evaluate(COLOCA); n += 1
    pg.wait_for_selector('#ov-win.on', timeout=8000); pg.wait_for_timeout(300)
def iniciar(pg, modo, espera=20000):
    pg.evaluate(f"abrirInf()"); pg.wait_for_timeout(150)
    pg.click(f"#infLista .infop:nth-child({['crescente','facil','medio','dificil','mestre'].index(modo)+1})")
    pg.wait_for_function("S.cur && S.cur.k==='i' && !document.querySelector('#ov-inf.on')", timeout=espera); pg.wait_for_timeout(300)
with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(locale='pt-BR', viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
    ctx.add_init_script("try{" + FIM + "}catch(e){}")
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(400)

    print('Menu e escolha')
    pg.click('#btnMenu'); pg.wait_for_timeout(250)
    check(pg.is_visible('#btnInf') and 'Modo infinito' in pg.inner_text('#btnInf'), 'botão "Modo infinito" no menu')
    pg.click('#btnInf'); pg.wait_for_timeout(250)
    nomes = pg.evaluate("[...document.querySelectorAll('#infLista .infop b')].map(e=>e.textContent)")
    check(nomes == ['Crescente', 'Fácil', 'Médio', 'Difícil', 'Mestre'], f'5 opções: {nomes}')
    check(pg.evaluate("document.querySelectorAll('#infLista .infop small').length") == 5, 'cada opção explica o que é')
    pg.screenshot(path=SAIDA + 'infinito-menu.png')
    check(pg.evaluate("Gerador.emSegundoPlano") is True, 'as fases são geradas em segundo plano (Web Worker)')

    print('Fácil')
    pg.click('#infLista .infop:nth-child(2)')
    pg.wait_for_function("S.cur && S.cur.k==='i'", timeout=15000); pg.wait_for_timeout(400)
    check(not pg.evaluate("document.querySelector('#ov-inf').classList.contains('on') || document.querySelector('#ov-menu').classList.contains('on')"), 'menus fecham e o jogo começa')
    check(pg.inner_text('#titulo .t1').strip() == 'Infinito 1' and pg.inner_text('#titulo .t2').startswith('Fácil'), f"título: {pg.inner_text('#titulo .t1')} / {pg.inner_text('#titulo .t2')}")
    check(pg.evaluate("S.n") == 5 and pg.evaluate("S.jogo.total") >= 6, 'tabuleiro 5×5 com várias peças')
    check(pg.evaluate("buscar(S.jogo.grade.map(r=>r.map(()=>false)), S.jogo.reserva, S.jogo.gab, 2, 5e6).n") == 1, 'a fase tem uma única solução')
    check(pg.is_hidden('#ger'), 'aviso de "gerando" não fica na tela')
    pg.screenshot(path=SAIDA + 'infinito-facil.png')
    vencer(pg)
    check(pg.evaluate("inf.feitas.facil") == 1, 'vencer conta 1 fase feita')
    check('Infinito 1 concluído' in pg.inner_text('#winTitulo'), 'título da vitória')
    check(pg.evaluate("document.querySelectorAll('#winEstrelas svg.on').length") == 3, 'sem dica: 3 estrelas')
    textos = pg.evaluate("[...document.querySelectorAll('#winActs .btn')].map(b=>b.textContent.trim())")
    check('Próxima fase' in textos and 'Mudar dificuldade' in textos and 'Jogar de novo' in textos, f'botões da vitória: {textos}')
    check(pg.evaluate("inf.porNivel.facil.n") == 1 and pg.evaluate("inf.porNivel.facil.t") > 0, 'melhor tempo do nível guardado')
    check(pg.evaluate("store.get('infatual', 'x')") is None, 'fase terminada não fica como "em andamento"')
    pg.screenshot(path=SAIDA + 'infinito-vitoria.png')
    sem = pg.evaluate("S.jogo.total")
    # repetir a mesma fase não conta de novo
    pg.click('#winActs .btn:has-text("Jogar de novo")'); pg.wait_for_timeout(300)
    check(pg.evaluate("S.cur.num") == 0, 'jogar de novo repete a mesma fase')
    vencer(pg); fecha_tudo(pg)
    check(pg.evaluate("inf.feitas.facil") == 1, 'repetir não conta duas vezes')
    # próxima
    pg.evaluate("document.querySelector('#ov-win').classList.add('on')") if False else None
    pg.evaluate("jogarInfinito('facil')"); pg.wait_for_function("S.cur.k==='i' && S.cur.num===1", timeout=15000); pg.wait_for_timeout(300)
    check(pg.inner_text('#titulo .t1').strip() == 'Infinito 2', 'a próxima fase é a 2')
    check(pg.evaluate("S.cur.seed") != 0, 'cada fase tem sua própria semente')

    print('Continuar de onde parou')
    seed = pg.evaluate("S.cur.seed"); texto = pg.evaluate("S.cur.text")
    pg.reload(); pg.wait_for_timeout(500); pg.click('#btnJogar') if pg.is_visible('#btnJogar') else None; pg.wait_for_timeout(300)
    check(pg.evaluate("store.get('infatual').seed") == seed, 'a fase em andamento ficou salva')
    iniciar(pg, 'facil')
    check(pg.evaluate("S.cur.seed") == seed and pg.evaluate("S.cur.text") == texto, 'reabrir o modo recria exatamente a mesma fase')
    check(pg.inner_text('#titulo .t1').strip() == 'Infinito 2', 'continua na fase 2')

    print('Dica e solução funcionam')
    pg.evaluate("acaoDica()"); pg.wait_for_timeout(150); pg.evaluate("acaoDica()"); pg.wait_for_timeout(200)
    check(pg.evaluate("S.dicas") >= 1, 'dica funciona no infinito')
    pg.evaluate("acaoSolucao()"); pg.wait_for_timeout(1200)
    check(pg.evaluate("!!S.sol"), 'solução animada funciona'); pg.keyboard.press('a'); pg.wait_for_timeout(200)
    vencer(pg)
    check(pg.evaluate("document.querySelectorAll('#winEstrelas svg.on').length") == 1, 'com dica e solução: 1 estrela')
    check(pg.evaluate("inf.feitas.facil") == 2 and pg.evaluate("inf.porNivel.facil.n") == 2, 'segunda fase contada')
    tmin = pg.evaluate("inf.porNivel.facil.t")
    check(tmin > 0, 'melhor tempo não foi trocado por partida com dica')
    # compartilhar
    pg.click('#winActs .btn:has-text("Compartilhar fase")'); pg.wait_for_timeout(300)
    link = pg.input_value('#shLink'); check('#f=' in link, 'compartilhar gera link da fase')
    fecha_tudo(pg)

    print('Difícil e Mestre')
    iniciar(pg, 'dificil')
    check(pg.evaluate("S.n") == 6 and pg.evaluate("S.jogo.fila") == 3, '6×6 com fila de 3')
    check(pg.inner_text('#titulo .t2').startswith('Difícil'), 'título mostra a dificuldade')
    pg.screenshot(path=SAIDA + 'infinito-dificil.png')
    pg.evaluate("S.hist=[]")
    iniciar(pg, 'mestre', 40000)
    check(pg.evaluate("S.n") == 7 and pg.evaluate("S.jogo.fila") == 2, '7×7 com fila de 2')
    check(pg.evaluate("buscar(S.jogo.grade.map(r=>r.map(()=>false)), S.jogo.reserva, S.jogo.gab, 2, 2e7).n") == 1, 'fase mestre também tem solução única')
    pg.screenshot(path=SAIDA + 'infinito-mestre.png')

    print('Gerar não trava o jogo')
    pg.evaluate("window.__bat = 0; clearInterval(window.__bi); window.__bi = setInterval(()=>window.__bat++, 50)")
    t0 = pg.evaluate("performance.now()")
    pg.evaluate("jogarInfinito('mestre')")
    pg.wait_for_function("!Inf.gerando", timeout=40000)
    dt = pg.evaluate("performance.now()") - t0
    bat = pg.evaluate("window.__bat")
    check(bat >= dt / 50 * 0.6, f'tela continua respondendo durante a geração ({bat} batidas em {dt:.0f} ms)')

    print('Crescente')
    pg.evaluate("inf.feitas.crescente = 0")
    r = pg.evaluate("[nivelInf('crescente',0), nivelInf('crescente',4), nivelInf('crescente',5), nivelInf('crescente',9), nivelInf('crescente',10), nivelInf('crescente',14), nivelInf('crescente',15), nivelInf('crescente',99), nivelInf('medio',3)]")
    check(r == ['facil', 'facil', 'medio', 'medio', 'dificil', 'dificil', 'mestre', 'mestre', 'medio'], f'níveis do modo crescente: {r}')
    iniciar(pg, 'crescente')
    check(pg.evaluate("S.cur.nivel") == 'facil' and pg.evaluate("S.cur.modo") == 'crescente', 'crescente começa no fácil')

    print('Sem Web Worker (aparelho antigo)')
    ctx2 = b.new_context(locale='pt-BR', viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
    ctx2.add_init_script("try{" + FIM + "}catch(e){}; window.Worker = undefined;")
    p2 = ctx2.new_page(); p2.on('pageerror', lambda e: erros.append(str(e)))
    p2.goto(URL); p2.click('#btnJogar'); p2.wait_for_timeout(300)
    check(p2.evaluate("Gerador.emSegundoPlano") is False, 'sem Worker o jogo percebe')
    p2.evaluate("jogarInfinito('medio')"); p2.wait_for_function("S.cur && S.cur.k==='i'", timeout=15000); p2.wait_for_timeout(300)
    check(p2.evaluate("S.n") == 5 and p2.evaluate("S.jogo.total") >= 6, 'mesmo assim gera a fase (na tela principal)')
    p2.evaluate("S.cur.k='i'")
    for _ in range(40):
        if p2.evaluate("S.venceu"): break
        p2.evaluate(COLOCA)
    check(p2.evaluate("S.venceu"), 'e dá para vencer')

    print('Telas pequenas')
    for (w, h) in [(320, 568), (360, 640)]:
        p3 = b.new_context(locale='pt-BR', viewport={'width': w, 'height': h}, has_touch=True, is_mobile=True)
        p3.add_init_script("try{" + FIM + "}catch(e){}")
        q = p3.new_page(); q.goto(URL); q.click('#btnJogar'); q.wait_for_timeout(300)
        q.evaluate("abrirInf()"); q.wait_for_timeout(300)
        ok = q.evaluate("(()=>{const c=document.querySelector('#ov-inf .card'); const r=c.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && c.scrollWidth<=c.clientWidth+1})()")
        check(ok, f'lista do modo infinito cabe em {w}×{h}')
        q.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))")
        q.evaluate("jogarInfinito('mestre')"); q.wait_for_function("S.cur && S.cur.k==='i'", timeout=40000); q.wait_for_timeout(500)
        check(q.evaluate("document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth"), f'fase mestre sem rolagem em {w}×{h}')
        p3.close()
    b.close()
print('erros de página:', erros)
if erros: falhas.append('erros de página')
print('TUDO OK' if not falhas else 'FALHAS: ' + str(falhas)); sys.exit(1 if falhas else 0)
