import os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'tests', 'saida') + os.sep
os.makedirs(SAIDA, exist_ok=True)
from playwright.sync_api import sync_playwright
SC=SAIDA + ''
URL='http://127.0.0.1:8765/index.html'
falhas=[]
RES="""() => { const j=S.jogo; const occ=j.grade.map(r=>r.map(v=>v!==0)); const r=buscar(occ,j.reserva,j.gab,1,3e6);
 const pl=r.primeira.map(s=>({uid:j.reserva[s.k].uid,o:s.o,px:s.px,py:s.py}));
 for(const st of pl){const p=S.jogo.reserva.find(q=>q.uid===st.uid); if(!p) continue; p.formato=st.o; tentarColocar(p,st.px,st.py);} }"""
with sync_playwright() as pw:
    b=pw.chromium.launch()
    for (w,h) in [(320,568),(360,640),(390,844),(412,915),(768,1024),(1366,768),(1280,720),(1920,1080)]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page()
        erros=[]; pg.on('pageerror',lambda e:erros.append(str(e)))
        pg.goto(URL); pg.click('#btnJogar')
        linha=[]
        for i in [0,14,30,35,49]:
            pg.evaluate(f"carregar({{k:'b',i:{i}}})"); pg.wait_for_timeout(150)
            sh=pg.evaluate('document.documentElement.scrollHeight'); cell=pg.evaluate('S.cell')
            bb=pg.locator('#board').bounding_box()
            ok = sh<=h+1 and pg.evaluate('document.documentElement.scrollWidth')<=w+1 and bb['x']>=0 and bb['x']+bb['width']<=w
            linha.append(f'f{i+1}:cell{cell}{"" if ok else " ESTOURA(sh=%d)"%sh}')
            if not ok: falhas.append(f'{w}x{h} fase {i+1} sh={sh} cell={cell}')
        print(f'{w}x{h}',' '.join(linha), 'ERROS' if erros else '')
        if erros: falhas.append(str(erros))
        if (w,h) in [(390,844),(1366,768),(320,568)]:
            pg.evaluate("carregar({k:'b',i:2})"); pg.wait_for_timeout(100); pg.evaluate(RES); pg.wait_for_timeout(500)
            pg.screenshot(path=SC+f'tela-{w}.png')
            check = pg.locator('#selo').is_visible() and 'Fase 3' in pg.inner_text('#selo')
            print('   selo visível ao vencer:',check, '| scroll ok depois:', pg.evaluate('document.documentElement.scrollHeight')<=h+1)
            if not check: falhas.append('selo '+str(w))
        ctx.close()
    b.close()
print('FALHAS:',falhas if falhas else 'nenhuma')
