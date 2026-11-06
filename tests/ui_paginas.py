# Páginas públicas (privacidade, termos, excluir conta) exigidas pela Play Store.
import os, sys, re, json
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
BASE = 'http://127.0.0.1:8765/'
erros, falhas = [], []
def check(c, m):
    print(('  ok   ' if c else '  FALHA ') + m)
    if not c: falhas.append(m)
BANCO = {'pub': {'u9': {'nome': 'Ana'}}, 'priv': {'u9': {'d': 'x'}}}; LOG = []
FALSO = """(function(){
 var U={uid:'u9',getIdToken:function(){return Promise.resolve('tok_u9')},delete:function(){window.__apagou=1;return Promise.resolve()}};
 var A={currentUser:null,signInWithPopup:function(){ if(window.__popupErro) return Promise.reject({code:window.__popupErro}); A.currentUser=U; return Promise.resolve({user:U}); }};
 window.firebase={initializeApp:function(){}, auth:Object.assign(function(){return A},{GoogleAuthProvider:function(){}})};
})();"""
def banco(route, req):
    h = {'access-control-allow-origin': '*', 'access-control-allow-methods': '*', 'access-control-allow-headers': '*'}
    if req.method == 'OPTIONS': return route.fulfill(status=204, headers=h)
    p = [x for x in req.url.split('?')[0].replace('.json', '').split('/')[3:] if x]
    LOG.append((req.method, '/'.join(p)))
    if req.method == 'DELETE' and 'tok_u9' in req.url:
        BANCO.get(p[0], {}).pop(p[1], None); return route.fulfill(status=200, headers=h, body='null', content_type='application/json')
    route.fulfill(status=401, headers=h, body='{}')
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for arq, titulos in (('privacidade.html', {'pt': 'Política de Privacidade', 'en': 'Privacy Policy', 'es': 'Política de Privacidad'}),
                         ('termos.html', {'pt': 'Termos de Uso', 'en': 'Terms of Use', 'es': 'Términos de Uso'}),
                         ('excluir-conta.html', {'pt': 'Excluir minha conta', 'en': 'Delete my account', 'es': 'Borrar mi cuenta'})):
        for l, t in titulos.items():
            c = b.new_context(viewport={'width': 320, 'height': 640}); p = c.new_page(); p.on('pageerror', lambda e: erros.append(str(e)))
            p.goto(BASE + arq + '?l=' + l); p.wait_for_timeout(300)
            h1 = p.inner_text('section.on h1')
            check(t in h1 and p.evaluate("document.documentElement.lang") == l, f'{arq} ({l}): título "{h1}"')
            check(p.evaluate("document.documentElement.scrollWidth <= innerWidth"), f'{arq} ({l}): sem rolagem lateral a 320px')
            txt = p.inner_text('body').lower()
            check(not re.search(r'tribunal|tjrr|trabalho|employer', txt), f'{arq} ({l}): sem menção a empregador')
            if arq == 'privacidade.html':
                for k in {'pt': ['não vendemos', 'excluir minha conta', 'jamerson rafael', '13 anos'], 'en': ['do not sell', 'delete my account', 'jamerson rafael', '13'], 'es': ['no vendemos', 'borrar mi cuenta', 'jamerson rafael', '13 años']}[l]:
                    check(k in txt, f'{arq} ({l}): cita "{k}"')
            c.close()
    c = b.new_context(locale='pt-BR'); p = c.new_page(); p.on('pageerror', lambda e: erros.append(str(e)))
    p.goto(BASE + 'privacidade.html'); p.wait_for_timeout(300)
    check(p.evaluate("document.documentElement.lang") == 'pt', 'sem ?l=, usa o idioma do navegador')
    p.select_option('.lang select', 'en'); check('Privacy Policy' in p.inner_text('section.on h1'), 'o seletor troca o idioma')
    c.close()
    print('Excluir conta pela web')
    c = b.new_context(locale='pt-BR'); c.route(re.compile(r'https://www\.gstatic\.com/firebasejs/.*'), lambda r, q: r.fulfill(status=200, content_type='application/javascript', body=FALSO if 'app-compat' in q.url else '/**/'))
    c.route(re.compile(r'https://.*\.firebaseio\.com/.*'), banco)
    p = c.new_page(); p.on('pageerror', lambda e: erros.append(str(e))); p.on('dialog', lambda d: d.accept())
    p.goto(BASE + 'excluir-conta.html?l=pt'); p.wait_for_timeout(300)
    check(p.is_hidden('#apagar-pt') and p.is_visible('#entrar-pt'), 'só mostra "apagar" depois de entrar')
    p.evaluate("window.__popupErro='auth/popup-closed-by-user'"); p.click('#entrar-pt'); p.wait_for_timeout(400)
    check('Nada foi apagado' in p.inner_text('#msg-pt') and p.is_hidden('#apagar-pt'), 'cancelar o login não apaga nada')
    p.evaluate("window.__popupErro=null"); p.click('#entrar-pt'); p.wait_for_timeout(400)
    check(p.is_visible('#apagar-pt'), 'depois do login aparece o botão de apagar')
    p.click('#apagar-pt'); p.wait_for_timeout(600)
    check('u9' not in BANCO['pub'] and 'u9' not in BANCO['priv'] and p.evaluate("window.__apagou") == 1, 'apaga perfil, progresso e a conta: ' + str(LOG))
    check('Pronto' in p.inner_text('#msg-pt'), 'mostra a confirmação')
    c.close(); b.close()
print('ERROS NO NAVEGADOR:' if erros else 'sem erros no navegador'); [print('  ', e) for e in erros]
print('\nFALHAS:' if falhas else '\nTUDO OK'); [print('  -', f) for f in falhas]
sys.exit(1 if falhas or erros else 0)
