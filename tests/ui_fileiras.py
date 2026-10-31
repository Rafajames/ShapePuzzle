import os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'tests', 'saida') + os.sep
os.makedirs(SAIDA, exist_ok=True)
from playwright.sync_api import sync_playwright
SC=SAIDA + ''
URL='http://127.0.0.1:8765/index.html'
falhas=[]; erros=[]
def check(c,m):
    print(('  ok   ' if c else '  FALHA ')+m)
    if not c: falhas.append(m)
with sync_playwright() as pw:
    b=pw.chromium.launch()
    for (w,h) in [(390,844),(320,568),(1280,720)]:
        ctx=b.new_context(viewport={'width':w,'height':h},has_touch=w<500,is_mobile=w<500); ctx.add_init_script("try{localStorage.setItem('shapepuzzle.tuto','{\"sel\":true,\"giro\":true,\"esp\":true,\"fim\":true}')}catch(e){}"); pg=ctx.new_page(); pg.on('pageerror',lambda e:erros.append(str(e)))
        pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(200)
        print(f'{w}x{h}')
        for n,esperado in [(1,[1]),(2,[2]),(3,[3]),(4,[2,2]),(5,[3,2]),(6,[3,3])]:
            pg.evaluate(f"""() => {{ carregar({{k:'b',i:0}}); S.jogo.reserva = S.jogo.reserva.slice(0,{n}); S.jogo.fila = 0; S.sel=null; renderReserva(); ajustar(); }}""")
            pg.wait_for_timeout(60)
            linhas=pg.evaluate("[...document.querySelectorAll('#reserva .rp')].map(r=>r.children.length)")
            check(linhas==esperado,f'{n} peça(s): fileiras {linhas}')
            cent=pg.evaluate("""() => { const r=document.querySelector('#reserva').getBoundingClientRect(); return [...document.querySelectorAll('#reserva .rp')].every(f=>{ const a=f.firstElementChild.getBoundingClientRect(), z=f.lastElementChild.getBoundingClientRect(); return Math.abs((a.left-r.left)-(r.right-z.right))<=2; }); }""")
            check(cent,f'{n} peça(s): fileiras centralizadas')
            check(pg.evaluate('document.documentElement.scrollHeight')<=h+1 and pg.evaluate('document.documentElement.scrollWidth')<=w+1,f'{n} peça(s): cabe na tela')
        pg.evaluate("carregar({k:'b',i:0})"); pg.wait_for_timeout(150)
        if w==390: pg.screenshot(path=SC+'fileiras-390.png')
        ctx.close()
    b.close()
print('ERROS:',erros or 'nenhum'); print('RESULTADO:','TUDO OK' if not falhas and not erros else falhas)
