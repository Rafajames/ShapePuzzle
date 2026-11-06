# O jogo rodando dentro do app Android (Capacitor simulado): links públicos, voltar pelo plugin, login e atualização pela loja.
import sys
from playwright.sync_api import sync_playwright
URL = 'http://127.0.0.1:8765/index.html'
falhas, erros = [], []
def check(c, m):
    print(('  ok   ' if c else '  FALHA ') + m)
    if not c: falhas.append(m)
APP = """window.Capacitor = {isNativePlatform: () => true, Plugins: {App: {addListener: (ev, cb) => { window.__ouvinte = ev; window.__voltar = cb; return {remove(){}}; }}}};
try{localStorage.setItem('shapepuzzle.tuto',JSON.stringify({sel:true,giro:true,esp:true,fim:true}));localStorage.setItem('shapepuzzle.prog',JSON.stringify({max:5,done:[0,1,2,3,4]}))}catch(e){}"""
def aberta(p, id): return p.evaluate("id => document.querySelector('#ov-'+id).classList.contains('on')", id)
with sync_playwright() as pw:
    b = pw.chromium.launch(); c = b.new_context(locale='pt-BR', viewport={'width': 390, 'height': 844}); c.add_init_script(APP)
    p = c.new_page(); p.on('pageerror', lambda e: erros.append(str(e))); p.goto(URL); p.wait_for_timeout(700)
    check(p.evaluate("NATIVO") is True, 'detecta que está dentro do app')
    check(p.evaluate("urlBase()") == 'https://rafajames.github.io/ShapePuzzle/' and p.evaluate("urlFase({k:'b', i:2}) || ''").startswith('https://rafajames.github.io/ShapePuzzle/') if p.evaluate("typeof urlFase") == 'function' else p.evaluate("urlBase()") == 'https://rafajames.github.io/ShapePuzzle/', 'links compartilhados apontam para o site público (não para o app)')
    check(p.evaluate("urlLegal('privacidade')").startswith('https://rafajames.github.io/ShapePuzzle/privacidade.html'), 'privacidade e termos abrem o site público')
    check(p.evaluate("window.__ouvinte") == 'backButton', 'botão voltar do Android ligado ao jogo')
    p.click('#btnJogar'); p.wait_for_timeout(300); p.click('#btnMenu'); p.wait_for_timeout(300)
    p.evaluate("window.__voltar()"); p.wait_for_timeout(200); check(not aberta(p, 'menu') and not aberta(p, 'splash'), 'voltar do Android fecha o menu')
    p.evaluate("window.__voltar()"); p.wait_for_timeout(200); check(aberta(p, 'splash'), 'depois volta para a tela inicial')
    p.evaluate("window.__voltar()"); p.wait_for_timeout(200); check(aberta(p, 'splash'), 'na tela inicial não fecha o app')
    check(p.evaluate("!navigator.serviceWorker || !navigator.serviceWorker.controller") and p.is_hidden('#blocoInstalar'), 'no app: sem service worker e sem "Instalar o jogo"')
    p.click('#hConta'); p.check('#cnTermos'); p.click('#cnEntrar'); p.wait_for_timeout(300)
    check('próxima versão' in p.inner_text('#cnAviso') and p.evaluate("conta") is None, 'login com Google avisa que chega na próxima versão do app')
    p.evaluate("fecharTodos(); renderAtualizacao()"); check('Play Store' in p.evaluate("document.querySelector('#btnAtualizar').textContent"), 'atualização pela Play Store')
    b.close()
print('\nERROS DE PÁGINA:', erros if erros else 'nenhum')
if falhas or erros: print('UI NATIVO: COM FALHAS'); sys.exit(1)
print('UI NATIVO: TUDO OK')
