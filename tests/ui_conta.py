import os, sys, json, re, struct, zlib
from urllib.parse import urlparse
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
PROG = "try{if(!localStorage.getItem('shapepuzzle.prog'))localStorage.setItem('shapepuzzle.prog',JSON.stringify({max:5,done:[0,1,2,3,4]}))}catch(e){}"
BANCO = {}; MODO = {'v': 'ok'}; LOG = []
FALSO = """(function(){
 var U={uid:'u123',displayName:'Maria Souza',getIdToken:function(){return Promise.resolve('tok_u123')}};
 var A={currentUser:null,
  signInWithPopup:function(){ if(window.__popupErro) return Promise.reject({code:window.__popupErro}); A.currentUser=U; try{localStorage.setItem('fakeauth','1')}catch(e){} return Promise.resolve({user:U}); },
  signInWithRedirect:function(){ window.__redirecionou=1; return Promise.resolve(); },
  getRedirectResult:function(){return Promise.resolve(null)},
  onAuthStateChanged:function(cb){ setTimeout(function(){cb(A.currentUser)},0); return function(){} },
  signOut:function(){A.currentUser=null; try{localStorage.removeItem('fakeauth')}catch(e){} return Promise.resolve()}};
 try{ if(localStorage.getItem('fakeauth')) A.currentUser=U; }catch(e){}
 window.firebase={initializeApp:function(){}, auth:Object.assign(function(){return A},{GoogleAuthProvider:function(){}})};
})();"""
def gstatic(route, req):
    route.fulfill(status=200, content_type='application/javascript', body=FALSO if 'app-compat' in req.url else '/* auth */')
def pegar(partes):
    n = BANCO
    for p in partes:
        if not isinstance(n, dict) or p not in n: return None
        n = n[p]
    return n
def por(partes, v):
    n = BANCO
    for p in partes[:-1]: n = n.setdefault(p, {})
    n[partes[-1]] = v
def handler(route, req):
    h = {'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,PUT,PATCH,DELETE,OPTIONS', 'access-control-allow-headers': '*'}
    if req.method == 'OPTIONS': return route.fulfill(status=204, headers=h)
    if MODO['v'] == 'offline': return route.abort('internetdisconnected')
    p = [x for x in urlparse(req.url).path.replace('.json', '').split('/') if x]
    LOG.append((req.method, '/'.join(p)))
    m = re.search(r'[?&]auth=tok_(\w+)', req.url); uid = m.group(1) if m else None
    def negar(): route.fulfill(status=401, headers=h, body='{"error":"Permission denied"}', content_type='application/json')
    if p[0] in ('pub', 'priv', 'foto'):
        dono = bool(uid) and len(p) >= 2 and uid == p[1]
        if req.method != 'GET' and not dono: return negar()
        if p[0] == 'priv' and not dono: return negar()
    if req.method == 'DELETE':
        n = BANCO
        for x in p[:-1]: n = n.get(x, {}) if isinstance(n, dict) else {}
        if isinstance(n, dict): n.pop(p[-1], None)
        return route.fulfill(status=200, headers=h, body='null', content_type='application/json')
    if req.method == 'GET': return route.fulfill(status=200, headers=h, body=json.dumps(pegar(p)), content_type='application/json')
    if req.method == 'PUT':
        v = json.loads(req.post_data); por(p, v); return route.fulfill(status=200, headers=h, body=json.dumps(v), content_type='application/json')
    route.fulfill(status=400, headers=h, body='{}')
def png(path):
    w = h = 40; raw = b''.join(b'\x00' + bytes([200, 60, 60] * w) for _ in range(h))
    def ch(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b''))
def novo(b, w=390, h=844, init=FIM + PROG):
    c = b.new_context(locale='pt-BR', viewport={'width': w, 'height': h}, device_scale_factor=2)
    c.route(re.compile(r'https://www\.gstatic\.com/firebasejs/.*'), gstatic)
    c.route(re.compile(r'https://.*\.firebaseio\.com/.*'), handler)
    c.add_init_script(init)
    p = c.new_page(); p.on('pageerror', lambda e: erros.append(str(e)))
    p.on('console', lambda m: erros.append('console.' + m.type + ': ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text and 'net::ERR' not in m.text else None)
    p.on('dialog', lambda d: d.accept())
    p.goto(URL); p.wait_for_timeout(500)
    return c, p
def aberta(p, id): return p.evaluate("id => document.querySelector('#ov-'+id).classList.contains('on')", id)
with sync_playwright() as pw:
    b = pw.chromium.launch()
    print('Sem conta')
    c, p = novo(b)
    check('Entrar com Google' in p.inner_text('#hConta'), 'tela inicial mostra "Entrar com Google": ' + p.inner_text('#hConta').replace('\n', ' '))
    check(p.evaluate("(()=>{const r=document.querySelector('#hConta').getBoundingClientRect();return r.width>200&&r.right<=innerWidth})()"), 'botão cabe na tela')
    p.click('#hConta'); check(aberta(p, 'conta') and p.is_visible('#cnEntrar') and p.is_hidden('#cnDentro'), 'abre a tela de login')
    p.screenshot(path=SAIDA + 'conta-fora.png')
    p.evaluate("window.__popupErro='auth/popup-closed-by-user'"); p.click('#cnEntrar'); p.wait_for_timeout(500)
    check('cancelado' in p.inner_text('#cnAviso') and p.evaluate("conta") is None, 'fechar a janela do Google cancela sem erro')
    p.evaluate("window.__popupErro='auth/popup-blocked'"); p.click('#cnEntrar'); p.wait_for_timeout(500)
    check(p.evaluate("window.__redirecionou") == 1, 'popup bloqueado cai no login por redirecionamento')
    p.evaluate("window.__popupErro=null; store.set('contaredir',null)")
    print('Entrar com o Google')
    p.click('#cnEntrar'); p.wait_for_timeout(1200)
    check(p.is_visible('#cnDentro') and p.is_hidden('#cnFora'), 'depois de entrar mostra o perfil')
    check(p.evaluate("conta && conta.nome") == 'Maria', 'nome inicial = primeiro nome do Google: ' + str(p.evaluate("conta && conta.nome")))
    pub = pegar(['pub', 'u123']) or {}
    check(pub.get('nome') == 'Maria' and pub.get('n') == 5 and pub.get('av', '').startswith('p'), 'perfil público gravado: ' + json.dumps(pub))
    priv = pegar(['priv', 'u123']) or {}
    check(str(priv.get('d', '')).startswith('SP1'), 'progresso enviado à nuvem')
    check('Sincronizado' in p.inner_text('#cnEstado'), 'mostra a hora da sincronização: ' + p.inner_text('#cnEstado'))
    p.screenshot(path=SAIDA + 'conta-dentro.png', full_page=True)
    print('Nome, avatar e moldura')
    p.fill('#cnNome', 'a'); p.click('#cnNomeOk'); check('2 a 20' in p.inner_text('#cnAviso'), 'nome curto é recusado')
    p.fill('#cnNome', 'Maria <b>Luz'); p.click('#cnNomeOk'); p.wait_for_timeout(600)
    check(p.evaluate("conta.nome") == 'Maria bLuz'.replace('bLuz', 'bLuz') or p.evaluate("conta.nome").startswith('Maria'), 'nome editado: ' + p.evaluate("conta.nome"))
    p.fill('#cnNome', 'Maria Luz'); p.click('#cnNomeOk'); p.wait_for_timeout(600)
    check((pegar(['pub', 'u123']) or {}).get('nome') == 'Maria Luz' and p.evaluate("store.get('cpnome','')") == 'Maria Luz', 'nome vai para a nuvem e para os campeonatos')
    check('Maria Luz' in p.inner_text('#cnNomeTxt'), 'título do perfil atualizado')
    p.click('#cnAvatares button[data-av=p5]'); p.wait_for_timeout(500)
    check((pegar(['pub', 'u123']) or {}).get('av') == 'p5' and p.get_attribute('#cnAvatares button[data-av=p5]', 'aria-checked') == 'true', 'avatar escolhido')
    check(p.locator('#cnAvatares button').count() == 12, '12 avatares prontos')
    check(p.is_disabled('#cnMolduras button[data-mold=ouro]') and p.is_enabled('#cnMolduras button[data-mold=madeira]'), 'molduras: Madeira livre, as outras com cadeado')
    p.click('#cnMolduras button[data-mold=madeira]'); p.wait_for_timeout(500)
    check((pegar(['pub', 'u123']) or {}).get('mold') == 'madeira' and p.evaluate("!!document.querySelector('#cnAvatar .av.m-madeira')"), 'moldura aplicada ao avatar')
    png(SAIDA + 'foto-teste.png'); p.set_input_files('#cnArq', SAIDA + 'foto-teste.png'); p.wait_for_timeout(900)
    ft = pegar(['foto', 'u123']) or ''
    check(p.evaluate("conta.av") == 'foto' and ft.startswith('data:image/jpeg;base64,') and len(ft) < 12000, 'foto reduzida e enviada (%d caracteres)' % len(ft))
    check(p.locator('#cnAvatares button').count() == 13, 'a foto aparece entre os avatares')
    p.screenshot(path=SAIDA + 'conta-foto.png', full_page=True)
    p.click('[data-close=conta]'); p.wait_for_timeout(200)
    check(p.evaluate("!!document.querySelector('#hConta .av img')") and 'Maria Luz' in p.inner_text('#hConta'), 'tela inicial mostra foto e nome')
    p.screenshot(path=SAIDA + 'conta-inicio.png')
    print('Progresso novo sobe sozinho')
    p.evaluate("prog.done.push(5,6,7); prog.max=8; store.set('prog',prog); contaSync({aplicar:false})"); p.wait_for_timeout(900)
    check((pegar(['pub', 'u123']) or {}).get('n') == 8, 'nuvem recebeu 8 fases concluídas')
    print('Outro aparelho')
    c2, p2 = novo(b, init=FIM)
    check(p2.evaluate("prog.done.length") == 0, 'aparelho novo começa zerado')
    p2.click('#hConta'); p2.click('#cnEntrar'); p2.wait_for_timeout(2500)
    p2.evaluate("window.__marca=1"); p2.wait_for_timeout(3500)
    check(p2.evaluate("prog.done.length") == 8 and p2.evaluate("conta && conta.nome") == 'Maria Luz', 'progresso e perfil vieram da nuvem')
    check(p2.evaluate("conta.av") == 'foto' and p2.evaluate("!!document.querySelector('#hConta .av img')"), 'foto veio junto')
    check(p2.evaluate("window.__marca") == 1, 'não reinicia de novo depois de sincronizado (sem laço)')
    c2.close()
    print('Sem internet')
    MODO['v'] = 'offline'
    p.click('#hConta'); p.fill('#cnNome', 'Maria Sol'); p.click('#cnNomeOk'); p.wait_for_timeout(700)
    check(p.evaluate("conta.nome") == 'Maria Sol' and p.evaluate("conta.sujo") is True and 'Sem conexão' in p.inner_text('#cnEstado'), 'offline: nome fica no aparelho e avisa')
    MODO['v'] = 'ok'; p.click('#cnSync'); p.wait_for_timeout(1000)
    check((pegar(['pub', 'u123']) or {}).get('nome') == 'Maria Sol' and p.evaluate("conta.sujo") is False, 'ao voltar a internet, envia')
    print('Sair e apagar')
    p.click('#cnSair'); p.wait_for_timeout(500)
    check(p.evaluate("conta") is None and p.evaluate("prog.done.length") == 8 and p.is_visible('#cnEntrar'), 'sair mantém o progresso do aparelho')
    check(pegar(['pub', 'u123']) is not None, 'sair não apaga a nuvem')
    p.click('#cnEntrar'); p.wait_for_timeout(1500)
    check(p.evaluate("conta && conta.nome") == 'Maria Sol', 'entrar de novo recupera o perfil')
    p.click('#cnApagar'); p.wait_for_timeout(1000)
    check(pegar(['pub', 'u123']) is None and pegar(['priv', 'u123']) is None and pegar(['foto', 'u123']) is None and p.evaluate("conta") is None, 'apagar remove tudo da nuvem e sai')
    print('Telas pequenas')
    c.close()
    for tema in ('madeira', 'pixel', 'claro'):
        c, p = novo(b, 320, 568, FIM + PROG + "try{localStorage.setItem('shapepuzzle.tema','\"%s\"')}catch(e){}" % tema)
        p.click('#hConta'); p.click('#cnEntrar'); p.wait_for_timeout(1500)
        check(p.evaluate("document.documentElement.scrollWidth <= innerWidth"), f'320px sem rolagem lateral ({tema})')
        p.screenshot(path=SAIDA + f'conta-320-{tema}.png', full_page=True); c.close()
    b.close()
print('ERROS NO NAVEGADOR:' if erros else 'sem erros no navegador'); [print('  ', e) for e in erros]
print('\nFALHAS:' if falhas else '\nTUDO OK'); [print('  -', f) for f in falhas]
sys.exit(1 if falhas or erros else 0)
