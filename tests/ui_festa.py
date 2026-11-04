# Festa de confetes e fogos ao completar a fase + botão de fechar a tela de conclusão (e reabrir pelo selo).
import os, sys
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
COLOCA = "(()=>{const r=dicaDe(S.jogo); if(r.tipo!=='ok') return false; r.peca.formato=r.o; return tentarColocar(r.peca,r.px,r.py);})()"
def novo(b, init='', w=390, h=844):
    c = b.new_context(locale='pt-BR', viewport={'width': w, 'height': h}); c.add_init_script(FIM + init)
    p = c.new_page(); p.on('pageerror', lambda e: erros.append(str(e))); p.goto(URL); p.wait_for_timeout(400); p.click('#btnJogar'); p.wait_for_timeout(200)
    return c, p
def vencer(p):
    for _ in range(40):
        if p.evaluate('S.venceu'): return True
        if not p.evaluate(COLOCA): break
    return p.evaluate('S.venceu')
with sync_playwright() as pw:
    b = pw.chromium.launch()
    print('Festa ao completar')
    c, p = novo(b)
    check(not p.evaluate('Festa.ativa()'), 'sem festa antes de terminar')
    vencer(p); p.wait_for_timeout(300)
    check(p.evaluate('Festa.ativa()'), 'ao encaixar a última peça começa a festa (confetes e fogos)')
    check(p.evaluate("(()=>{const c=document.querySelector('#festa'); const s=getComputedStyle(c); return s.pointerEvents==='none' && s.position==='fixed' && c.getAttribute('aria-hidden')==='true'})()"), 'a festa não bloqueia toques e é escondida de leitores de tela')
    p.wait_for_timeout(1500)
    check(p.evaluate("(()=>{const c=document.querySelector('#festa'); const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=4*50) if(d[i]>0) n++; return n})()") > 20, 'há confetes e faíscas desenhados na tela')
    p.screenshot(path=SAIDA + 'festa.png')
    p.wait_for_selector('#ov-win.on', timeout=8000)
    check(p.evaluate("document.querySelector('#festa') !== null"), 'a festa continua por cima da tela de conclusão')
    print('Fechar a tela de conclusão')
    check(p.locator('#cardWin .x').is_visible(), 'botão de fechar aparece na tela de conclusão')
    p.click('#cardWin .x'); p.wait_for_timeout(250)
    check(not p.evaluate("document.querySelector('#ov-win').classList.contains('on')") and p.evaluate('S.venceu'), 'fecha e deixa ver o tabuleiro completo')
    check(p.is_visible('#selo') and p.get_attribute('#selo', 'role') == 'button', 'o selo da fase vira botão para rever o resultado')
    p.click('#selo'); p.wait_for_timeout(300)
    check(p.evaluate("document.querySelector('#ov-win').classList.contains('on')") and p.inner_text('#winTitulo').strip() != '', 'tocar no selo abre o resultado de novo')
    p.keyboard.press('Escape'); p.wait_for_timeout(200)
    check(not p.evaluate("document.querySelector('#ov-win').classList.contains('on')"), 'Esc também fecha')
    p.wait_for_function("!Festa.ativa()", timeout=9000); check(True, 'a festa termina sozinha e some do DOM')
    p.click('#btnReiniciar') if p.locator('#btnReiniciar').count() else p.evaluate("carregar(S.cur)")
    p.wait_for_timeout(200); check(not p.evaluate("S.venceu") and p.evaluate("S.ultVit") is None, 'ao reiniciar o selo não reabre resultado antigo')
    c.close()
    print('Menos animação desliga a festa')
    c, p = novo(b, "try{localStorage.setItem('shapepuzzle.a11y',JSON.stringify({mov:true}))}catch(e){}")
    vencer(p); p.wait_for_timeout(400)
    check(not p.evaluate('Festa.ativa()'), 'com "menos animação" não há festa')
    c.close()
    print('Tema pixel e telas pequenas')
    c, p = novo(b, "try{localStorage.setItem('shapepuzzle.tema','\"pixel\"')}catch(e){}", 320, 568)
    check(p.evaluate("document.documentElement.dataset.tema") == 'pixel', 'tema Pixel Art aplicado')
    vencer(p); p.wait_for_selector('#ov-win.on', timeout=8000); p.wait_for_timeout(500)
    ok = p.evaluate("(()=>{const r=document.querySelector('#cardWin').getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && document.documentElement.scrollWidth<=innerWidth})()")
    check(ok, '320x568: tela de conclusão cabe sem rolagem horizontal')
    check(p.evaluate("(()=>{const r=document.querySelector('#cardWin .x').getBoundingClientRect(); return r.width>=36 && r.right<=innerWidth && r.top>=0})()"), '320x568: botão de fechar visível e com tamanho de toque')
    p.screenshot(path=SAIDA + 'festa-320-pixel.png')
    c.close()
    b.close()
print('erros de página:', erros)
sys.exit(0 if not falhas and not erros else 1)
