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
    ctx=b.new_context(locale='pt-BR', viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
    ctx.add_init_script("try{localStorage.setItem('shapepuzzle.tuto','{\"sel\":true,\"giro\":true,\"esp\":true,\"fim\":true}')}catch(e){}")
    pg=ctx.new_page(); pg.on('pageerror',lambda e:erros.append(str(e)))
    cdp=ctx.new_cdp_session(pg)
    def toque(x,y):
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    def desliza(x0,y0,x1,y1,passos=6):
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x0,'y':y0}]})
        for i in range(1,passos+1):
            cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x0+(x1-x0)*i/passos,'y':y0+(y1-y0)*i/passos}]})
        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(400)
    pg.evaluate("carregar({k:'b',i:14})"); pg.wait_for_timeout(300)
    print('Tela de toque')
    check(pg.evaluate("matchMedia('(pointer:coarse)').matches"),'emulação de toque ativa')
    check(not pg.is_visible('#btnGirar') and not pg.is_visible('#btnFlip'),'botões Girar/Espelhar escondidos no celular')
    check(pg.locator('#btnPrev').count()==0 and pg.locator('#btnNext').count()==0,'setas de fase anterior/próxima removidas')
    d=pg.locator('#btnDica').bounding_box(); r=pg.locator('#btnReset').bounding_box(); t=pg.locator('#titulo').bounding_box()
    check(abs((d['y'])-(r['y']))<2 and r['x']>d['x'] and r['x']-d['x']<70 and d['y']<80,'Dica e Reiniciar lado a lado no topo')
    check(pg.evaluate("document.querySelectorAll('.pw').length")==5,'5 peças visíveis na fase 15 (fase com 8 peças)')
    for idx,esp in [(0,6),(9,6),(10,5),(19,5),(20,4),(29,4),(30,3),(49,3)]:
        pg.evaluate(f"carregar({{k:'b',i:{idx}}})"); pg.wait_for_timeout(80)
        vis=pg.evaluate("visiveis(S.jogo).length"); tot=pg.evaluate("S.jogo.total"); fl=pg.evaluate("S.jogo.fila")
        check(vis==min(tot,fl or tot) and (fl in (esp,1,2,3) or not fl),f'fase {idx+1}: {vis} peças à vista (padrão {esp})')
    pg.evaluate("carregar({k:'b',i:14})"); pg.wait_for_timeout(200)
    check(pg.evaluate("document.documentElement.scrollHeight")<=844,'sem rolagem vertical')
    print('   tamanho da casa no celular 390x844:',pg.evaluate('S.cell'),'px')
    pg.screenshot(path=SC+'gestos-01.png')
    # seleciona primeira peça com um toque
    box=pg.locator('.pw').first.bounding_box()
    toque(box['x']+box['width']/2,box['y']+box['height']/2); pg.wait_for_timeout(150)
    check(pg.evaluate('!!S.sel'),'toque seleciona a peça')
    f0=pg.evaluate('JSON.stringify(S.sel.formato)')
    G="(f)=>JSON.stringify(girar(JSON.parse(f)))"
    esperado_dir=pg.evaluate(G,f0); esp_flip0=pg.evaluate("(f)=>JSON.stringify(inverter(JSON.parse(f)))",f0)
    sb=pg.locator('.stats').bounding_box(); y=sb['y']+sb['height']/2
    def fmt(): return pg.evaluate('JSON.stringify(S.sel.formato)')
    INV="(f)=>JSON.stringify(inverter(JSON.parse(f)))"
    # deslizar espelha (qualquer lado)
    desliza(80,y,240,y); pg.wait_for_timeout(120)
    check(fmt()==esp_flip0,'deslizar para a direita espelha')
    desliza(240,y,80,y); pg.wait_for_timeout(120)
    check(fmt()==f0,'deslizar para a esquerda espelha de volta')
    # dois toques no fundo giram 90°
    toque(200,y); pg.wait_for_timeout(120); toque(202,y); pg.wait_for_timeout(150)
    check(fmt()==esperado_dir,'dois toques no fundo giram 90° (horário)')
    toque(200,y); pg.wait_for_timeout(600)
    check(fmt()==esperado_dir,'um toque no fundo não muda a peça')
    # deslizar sobre o tabuleiro vazio: espelha, não encaixa
    bb=pg.locator('#board').bounding_box(); cy=bb['y']+bb['height']/2
    desliza(bb['x']+30,cy,bb['x']+bb['width']-30,cy); pg.wait_for_timeout(120)
    check(pg.evaluate('S.jog')==0,'deslizar sobre o tabuleiro não encaixa a peça')
    check(fmt()==pg.evaluate(INV,esperado_dir),'deslizar sobre o tabuleiro espelha a peça')
    desliza(bb['x']+30,cy,bb['x']+bb['width']-30,cy); pg.wait_for_timeout(120)
    # dois toques na própria peça giram e mantêm selecionada
    antes=fmt(); uid=pg.evaluate('S.sel.uid')
    bx=pg.locator(f'.pw[data-uid="{uid}"]').bounding_box(); cx,cyy=bx['x']+bx['width']/2,bx['y']+bx['height']/2
    toque(cx,cyy); pg.wait_for_timeout(120); toque(cx,cyy); pg.wait_for_timeout(200)
    check(fmt()==pg.evaluate(G,antes) and pg.evaluate('S.sel && S.sel.uid')==uid,'dois toques na peça giram e ela continua selecionada')
    # um toque numa peça já selecionada não a desmarca no celular
    toque(cx,cyy); pg.wait_for_timeout(600)
    check(pg.evaluate('!!S.sel'),'um toque na peça selecionada não tira a seleção')
    # toque simples numa casa encaixa (fica no tabuleiro)
    plano=pg.evaluate("""() => { const j=S.jogo; const occ=j.grade.map(r=>r.map(v=>v!==0)); const r=buscar(occ,j.reserva,j.gab,1,3e6);
        const s=r.primeira.find(x=>x.k===0); const p=j.reserva[0]; p.formato=s.o; selecionar(p); return {px:s.px,py:s.py,w:s.o[0].length,h:s.o.length}; }""")
    cell=pg.evaluate('S.cell'); bb=pg.locator('#board').bounding_box()
    toque(bb['x']+(plano['px']+plano['w']/2)*cell, bb['y']+(plano['py']+plano['h']/2)*cell); pg.wait_for_timeout(250)
    check(pg.evaluate('S.jog')==1,'toque simples numa casa encaixa a peça')
    box=pg.locator('.pw').first.bounding_box()
    desliza(box['x']+box['width']/2,box['y']+box['height']/2,bb['x']+bb['width']/2,bb['y']+40,8); pg.wait_for_timeout(250)
    check(pg.evaluate('S.drag')is None,'arrasto termina sem travar')
    # reiniciar e dica pelo topo
    pg.click('#btnReset'); pg.wait_for_timeout(200)
    check(pg.evaluate('S.jog')==0,'Reiniciar no topo limpa a fase')
    pg.click('#btnDica'); pg.wait_for_timeout(200)
    check(pg.evaluate('S.dicas')==1,'Dica no topo funciona')
    pg.screenshot(path=SC+'gestos-02.png')
    # tela pequena
    for (w,h) in [(320,568),(360,640),(412,915)]:
        c2=b.new_context(locale='pt-BR', viewport={'width':w,'height':h},has_touch=True,is_mobile=True); c2.add_init_script("try{localStorage.setItem('shapepuzzle.tuto','{\"sel\":true,\"giro\":true,\"esp\":true,\"fim\":true}')}catch(e){}"); p2=c2.new_page(); p2.on('pageerror',lambda e:erros.append(str(e)))
        p2.goto(URL); p2.click('#btnJogar'); p2.wait_for_timeout(300)
        res=[]
        for i in [0,20,30,45]:
            p2.evaluate(f"carregar({{k:'b',i:{i}}})"); p2.wait_for_timeout(120)
            sh=p2.evaluate('document.documentElement.scrollHeight'); sw=p2.evaluate('document.documentElement.scrollWidth')
            res.append((i+1,p2.evaluate('S.cell'),sh<=h+1 and sw<=w+1))
        print(f'   {w}x{h}:',res); 
        for r_ in res:
            if not r_[2]: falhas.append(f'{w}x{h} fase {r_[0]} rola')
        # título sem estourar e botões do topo dentro da tela
        ok=p2.evaluate("[...document.querySelectorAll('.top .ib')].every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})")
        check(ok,f'{w}x{h}: botões do topo cabem')
        c2.close()
    b.close()
print('ERROS:',erros or 'nenhum'); print('RESULTADO:','TUDO OK' if not falhas and not erros else falhas)
