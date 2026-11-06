# "Voltar" do aparelho (deslizar da borda / botão voltar): volta uma tela e nunca sai do jogo.
import os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
URL = 'http://127.0.0.1:8765/index.html'
falhas, erros = [], []
def check(c, m):
    print(('  ok   ' if c else '  FALHA ') + m)
    if not c: falhas.append(m)
FIM = "try{localStorage.setItem('shapepuzzle.tuto',JSON.stringify({sel:true,giro:true,esp:true,fim:true}));localStorage.setItem('shapepuzzle.prog',JSON.stringify({max:5,done:[0,1,2,3,4]}))}catch(e){}"
def aberta(p, id): return p.evaluate("id => document.querySelector('#ov-'+id).classList.contains('on')", id)
def voltar(p): p.evaluate("history.back()"); p.wait_for_timeout(350)
with sync_playwright() as pw:
    b = pw.chromium.launch(); c = b.new_context(locale='pt-BR', viewport={'width': 390, 'height': 844}); c.add_init_script(FIM)
    p = c.new_page(); p.on('pageerror', lambda e: erros.append(str(e)))
    p.goto(URL); p.wait_for_timeout(600)
    marca = p.evaluate("window.__marca = Math.random()")
    print('Na tela inicial')
    voltar(p)
    check(aberta(p, 'splash') and p.evaluate("window.__marca") == marca, 'voltar na tela inicial não fecha o jogo')
    voltar(p); voltar(p)
    check(p.evaluate("window.__marca") == marca, 'voltar várias vezes seguidas continua no jogo')
    print('Janelas')
    p.click('#hConta'); p.wait_for_timeout(300); voltar(p)
    check(not aberta(p, 'conta') and aberta(p, 'splash'), 'voltar fecha Meu perfil e volta para a tela inicial')
    p.click('#btnJogar'); p.wait_for_timeout(400); p.click('#btnMenu'); p.wait_for_timeout(300)
    voltar(p); check(not aberta(p, 'menu') and not aberta(p, 'splash'), 'voltar fecha o menu e fica na fase')
    voltar(p); check(aberta(p, 'splash'), 'na fase, voltar leva à tela inicial')
    p.click('#hConta'); p.wait_for_timeout(300)
    p.evaluate("document.querySelector('#cnSecMold').open = true"); p.click('#cnMolduras button[data-item="mold:neon"]'); p.wait_for_timeout(300)
    check(aberta(p, 'provador') and aberta(p, 'conta'), 'provador aberto por cima do perfil')
    voltar(p); check(not aberta(p, 'provador') and aberta(p, 'conta'), 'voltar fecha só a janela de cima (o provador)')
    voltar(p); check(not aberta(p, 'conta') and aberta(p, 'splash'), 'e depois o perfil')
    check(p.evaluate("window.__marca") == marca, 'o jogo nunca recarregou nem saiu')
    print('Links do jogo continuam funcionando')
    c2 = b.new_context(locale='pt-BR', viewport={'width': 390, 'height': 844}); c2.add_init_script(FIM)
    p2 = c2.new_page(); p2.goto(URL + '#f=' + 'x'); p2.wait_for_timeout(600)
    check(p2.evaluate("location.hash") == '', 'o endereço fica limpo depois de abrir')
    m2 = p2.evaluate("window.__marca = 1"); voltar(p2)
    check(p2.evaluate("window.__marca") == 1, 'voltar depois de abrir por link também não sai do jogo')
    b.close()
print('\nERROS DE PÁGINA:', erros if erros else 'nenhum')
if falhas or erros: print('UI VOLTAR: COM FALHAS'); sys.exit(1)
print('UI VOLTAR: TUDO OK')
