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
def prog(mx, feitas): return "try{if(!localStorage.getItem('shapepuzzle.prog'))localStorage.setItem('shapepuzzle.prog',JSON.stringify({max:%d,done:%s}))}catch(e){}" % (mx, json.dumps(list(range(feitas))))
COLOCA = "(()=>{const r=dicaDe(S.jogo); if(r.tipo!=='ok') return false; r.peca.formato=r.o; return tentarColocar(r.peca,r.px,r.py);})()"
def novo(b, init, w=390, h=844):
    c = b.new_context(locale='pt-BR', viewport={'width': w, 'height': h}); c.add_init_script(FIM + init)
    p = c.new_page(); p.on('pageerror', lambda e: erros.append(str(e))); p.goto(URL); p.wait_for_timeout(500)
    return c, p
def tiles(p):
    p.click('#btnJogar'); p.click('#btnMenu'); p.evaluate("document.querySelectorAll('#ov-menu details.sec').forEach(d=>d.open=true)"); p.wait_for_timeout(200)
    n = p.locator('#tiles .tile').count(); p.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))"); return n
def vencer(p, limite=40):
    for _ in range(limite):
        if p.evaluate('S.venceu'): return True
        if not p.evaluate(COLOCA): break
    return p.evaluate('S.venceu')
with sync_playwright() as pw:
    b = pw.chromium.launch()
    print('Liberação de 10 em 10')
    for mx, esperado in ((0, 10), (9, 10), (10, 20), (35, 40), (49, 50), (50, 60)):
        c, p = novo(b, prog(mx, mx)); 
        check(tiles(p) == esperado, f'progresso até a fase {mx + 1}: {esperado} fases no menu')
        c.close()
    print('Passar da fase 50 para a 51 (gerada)')
    c, p = novo(b, prog(49, 49))
    p.click('#btnJogar'); check(p.evaluate('S.cur.i') == 49, 'abre na fase 50')
    vencer(p); p.wait_for_selector('#ov-win.on', timeout=8000)
    check(p.evaluate('prog.max') == 50, 'vencer a 50 libera a 51')
    p.wait_for_function("!!fasesGer[50]", timeout=30000); check(True, 'a 51 já foi preparada enquanto jogava a 50')
    txt = p.evaluate("fasesGer[50]")
    p.click('#winActs .btn:has-text("Próxima fase")'); p.wait_for_function("S.cur.i === 50", timeout=30000); p.wait_for_timeout(300)
    check(p.evaluate('S.n') == 6 and p.inner_text('#titulo .t1') == 'Fase 51', 'fase 51 abre em 6×6')
    check(p.inner_text('#titulo .t2') == '6×6', 'subtítulo mostra o tamanho do tabuleiro: ' + p.inner_text('#titulo .t2'))
    check(vencer(p), 'a fase 51 tem solução e dá para vencer')
    p.wait_for_selector('#ov-win.on', timeout=8000)
    check(p.evaluate("JSON.parse(localStorage.getItem('shapepuzzle.fasesger'))['50'] === fasesGer[50]"), 'a fase fica guardada no aparelho')
    c.close()
    print('Outro aparelho recebe a mesma fase 51')
    c, p = novo(b, prog(50, 50))
    p.click('#btnJogar'); p.wait_for_function("S.cur && S.cur.i === 50 && S.jogo", timeout=30000)
    check(p.evaluate("fasesGer[50]") == txt, 'mesmo texto da fase 51 em outro aparelho')
    p.screenshot(path=SAIDA + 'fase51.png')
    c.close()
    print('Aparelho novo com progresso alto (fase ainda não gerada)')
    c, p = novo(b, prog(72, 72))
    p.wait_for_function("S.cur && S.cur.i === 72 && S.jogo", timeout=40000)
    check(p.evaluate('S.n') == 7 and p.inner_text('#jogarSub') == 'Fase 73', 'abre na fase 73 (7×7) e a tela inicial mostra a fase')
    c.close()
    print('Backup, estatísticas e telas pequenas')
    c, p = novo(b, prog(55, 55))
    p.click('#btnJogar'); p.click('#btnMenu'); p.click('#btnEst'); p.wait_for_timeout(300)
    check('/60' in p.inner_text('#estCorpo'), 'estatísticas contam sobre as fases liberadas (/60)')
    c.close()
    c, p = novo(b, prog(55, 55), 320, 568)
    check(tiles(p) == 60 and p.evaluate("document.documentElement.scrollWidth") <= 320, '320x568: menu com 60 fases sem rolagem horizontal')
    c.close()
    b.close()
print('erros de página:', erros)
sys.exit(0 if not falhas and not erros else 1)
