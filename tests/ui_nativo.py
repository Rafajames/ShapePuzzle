# O jogo rodando dentro do app Android (Capacitor simulado): links públicos, voltar pelo plugin, login e atualização pela loja.
import os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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
    print('Atualização baixada pelo app')
    novo = open(RAIZ + '/index.html', encoding='utf8').read().replace("const VERSAO = '", "const VERSAO = '9999.", 1)
    v9 = '9999.' + p.evaluate("VERSAO")
    p.route('https://rafajames.github.io/ShapePuzzle/index.html*', lambda route: route.fulfill(status=200, body=novo, content_type='text/html', headers={'Access-Control-Allow-Origin': '*'}))
    r = p.evaluate("verificarAtualizacao(true)"); p.wait_for_timeout(300)
    check(r == 'nova' and p.is_visible('#upd'), 'no app, procura a versão nova no site público e avisa')
    p.evaluate("window.__marca = 1"); p.evaluate("aplicarAtualizacao()"); p.wait_for_timeout(1200)
    guardado = p.evaluate("new Promise(ok => { const r = indexedDB.open('shapepuzzle-app', 1); r.onsuccess = () => { const t = r.result.transaction('jogo').objectStore('jogo').get('html'); t.onsuccess = () => ok(t.result ? [t.result.v, t.result.html.length] : null); }; })")
    check(guardado and guardado[0] == v9 and guardado[1] > 400000, 'baixou a versão inteira e guardou no aparelho: ' + str(guardado and guardado[0]))
    check(p.evaluate("window.__marca") is None, 'depois recarrega para abrir a versão nova')
    p.route('https://rafajames.github.io/ShapePuzzle/index.html*', lambda route: route.fulfill(status=200, body=novo[:5000], content_type='text/html', headers={'Access-Control-Allow-Origin': '*'}))
    p.wait_for_timeout(600); p.evaluate("Upd.nova = '9999.1'; Upd.html = ''; window.__marca = 2"); p.evaluate("aplicarAtualizacao()"); p.wait_for_timeout(800)
    check(p.evaluate("window.__marca") == 2 and 'baixar' in p.inner_text('#updMsg'), 'download cortado não é usado (avisa e não recarrega)')
    b.close()
print('\nERROS DE PÁGINA:', erros if erros else 'nenhum')
if falhas or erros: print('UI NATIVO: COM FALHAS'); sys.exit(1)
print('UI NATIVO: TUDO OK')
