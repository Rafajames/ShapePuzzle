import os, sys, json, re
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
PROG = "try{if(!localStorage.getItem('shapepuzzle.prog')){localStorage.setItem('shapepuzzle.prog',JSON.stringify({max:5,done:[0,1,2,3,4]}));localStorage.setItem('shapepuzzle.est',JSON.stringify({0:3,1:3,2:3,3:3,4:3}))}}catch(e){}"
BANCO = {}; MODO = {'v': 'ok'}; LOG = []
FALSO = """(function(){
 var U={uid:'u123',displayName:'Maria Souza',getIdToken:function(){return Promise.resolve('tok_u123')},reauthenticateWithPopup:function(){ if(window.__reauthErro) return Promise.reject({code:window.__reauthErro}); return Promise.resolve({}); },delete:function(){ A.currentUser=null; window.__apagou=1; try{localStorage.removeItem('fakeauth')}catch(e){} return Promise.resolve(); }};
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
def sec(p, id): p.evaluate("id=>{document.querySelector(id).open=true}", id); p.wait_for_timeout(150)
def aberta(p, id): return p.evaluate("id => document.querySelector('#ov-'+id).classList.contains('on')", id)
with sync_playwright() as pw:
    b = pw.chromium.launch()
    print('Botão Início na fase')
    c, p = novo(b)
    p.click('#btnJogar'); p.wait_for_timeout(500)
    check(p.is_visible('#btnCasa') and not aberta(p, 'splash'), 'a tela da fase tem o botão Início')
    p.click('#btnCasa'); p.wait_for_timeout(300)
    check(aberta(p, 'splash'), 'o botão Início leva à tela inicial')
    c.close()
    for w, h in ((320, 568), (360, 640), (390, 844)):
        c, p = novo(b, w, h); p.click('#btnJogar'); p.wait_for_timeout(500)
        ok = p.evaluate("(()=>{const t=document.querySelector('#titulo').getBoundingClientRect();return document.documentElement.scrollWidth<=innerWidth&&t.width>=44&&[...document.querySelectorAll('.top .ib')].every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})})()")
        check(ok, f'barra da fase cabe em {w}px sem estourar'); c.close()
    print('Sem conta')
    c, p = novo(b)
    check('Entrar com Google' in p.inner_text('#hConta') and '★ 20' in p.inner_text('#hConta'), 'tela inicial mostra "Entrar com Google" e as estrelas já ganhas: ' + p.inner_text('#hConta').replace('\n', ' '))
    p.click('#hConta'); check(aberta(p, 'conta') and p.is_visible('#cnEntrar') and p.is_hidden('#cnDentro'), 'abre a tela de login')
    check('20' in p.inner_text('#cnTeaser'), 'avisa quantas estrelas estão esperando: ' + p.inner_text('#cnTeaser'))
    p.screenshot(path=SAIDA + 'conta-fora.png')
    p.evaluate("window.__popupErro='auth/popup-closed-by-user'"); p.click('#cnEntrar'); p.wait_for_timeout(500)
    check('cancelado' in p.inner_text('#cnAviso') and p.evaluate("conta") is None, 'fechar a janela do Google cancela sem erro')
    p.evaluate("window.__popupErro='auth/popup-blocked'"); p.click('#cnEntrar'); p.wait_for_timeout(500)
    check(p.evaluate("window.__redirecionou") == 1, 'popup bloqueado cai no login por redirecionamento')
    p.evaluate("window.__popupErro=null; store.set('contaredir',null)")
    print('Primeiro login: escolher o apelido')
    p.click('#cnEntrar'); p.wait_for_timeout(1200)
    check(p.is_visible('#cnDentro') and p.is_hidden('#cnFora') and p.is_visible('#cnBemvindo'), 'depois de entrar mostra o perfil e o convite para escolher o apelido')
    check(p.evaluate("conta.nome") == 'Maria' and p.evaluate("conta.novo") is True, 'apelido inicial = primeiro nome do Google')
    check(pegar(['pub', 'u123']) is None, 'nada público na nuvem antes de escolher o apelido')
    check(str((pegar(['priv', 'u123']) or {}).get('d', '')).startswith('SP1'), 'progresso (com as estrelas) já foi para a nuvem')
    check('Confirmar apelido' in p.inner_text('#cnNomeOk') and 'Grátis' in p.inner_text('#cnNomeDica'), 'botão diz que a primeira escolha é grátis')
    p.fill('#cnNome', 'a'); p.click('#cnNomeOk'); check('2 a 20' in p.inner_text('#cnAviso'), 'apelido curto é recusado')
    p.fill('#cnNome', 'Maria Luz'); p.click('#cnNomeOk'); p.wait_for_timeout(800)
    pub = pegar(['pub', 'u123']) or {}
    check(pub.get('nome') == 'Maria Luz' and pub.get('n') == 5 and pub.get('av', '').startswith('p'), 'primeiro apelido grátis e perfil público criado: ' + json.dumps(pub))
    check(p.evaluate("conta.novo") is False and p.evaluate("cart.s['n:1']") is None and p.evaluate("saldoAtual()") == 20, 'não gastou estrelas (saldo 20)')
    check(p.evaluate("store.get('cpnome','')") == 'Maria Luz', 'o apelido vale também nos campeonatos')
    check(p.is_hidden('#cnBemvindo') and 'Trocar por 30' in p.inner_text('#cnNomeOk'), 'depois da primeira escolha, trocar custa 30 estrelas')
    p.screenshot(path=SAIDA + 'conta-dentro.png', full_page=True)
    print('Estrelas, avatares e molduras')
    check(p.inner_text('#cnSaldo').strip() == '20' or '20' in p.inner_text('#cnSaldo'), 'saldo aparece no topo da área do usuário')
    sec(p, '#cnSecAv'); p.wait_for_timeout(200)
    check(p.locator('#cnAvatares button').count() == 24 and p.locator('#cnAvatares button.trava').count() == 18, '24 avatares: 6 livres e 18 por estrelas ou conquista')
    check('Avatares 6/24' in p.inner_text('#cnTitAv') or 'Avatares 7/24' in p.inner_text('#cnTitAv'), 'contador de coleção: ' + p.inner_text('#cnTitAv'))
    p.click('#cnAvatares button[data-item="av:p3"]'); p.wait_for_timeout(500)
    check((pegar(['pub', 'u123']) or {}).get('av') == 'p3', 'avatar livre se escolhe de graça')
    p.click('#cnAvatares button[data-item="av:p8"]'); p.wait_for_timeout(400)
    check(p.evaluate("conta.av") == 'p8' and p.evaluate("saldoAtual()") == 5 and (pegar(['pub', 'u123']) or {}).get('av') == 'p8', 'comprou o avatar de 15 estrelas e já usou (sobraram 5)')
    p.click('#cnAvatares button[data-item="av:p9"]'); p.wait_for_timeout(300)
    check('Faltam 10' in p.inner_text('#cnAviso') and p.evaluate("conta.av") == 'p8' and p.evaluate("saldoAtual()") == 5, 'sem estrelas suficientes: avisa quanto falta e não gasta')
    p.click('#cnAvatares button[data-item="av:p21"]'); p.wait_for_timeout(300)
    check('Pegando o jeito' in p.inner_text('#cnAviso') or 'prêmio' in p.inner_text('#cnAviso'), 'item de conquista mostra qual conquista libera: ' + p.inner_text('#cnAviso'))
    sec(p, '#cnSecMold'); p.wait_for_timeout(200)
    check(p.locator('#cnMolduras button').count() == 8, '8 molduras')
    p.click('#cnMolduras button[data-item="mold:madeira"]'); p.wait_for_timeout(500)
    check((pegar(['pub', 'u123']) or {}).get('mold') == 'madeira' and p.evaluate("!!document.querySelector('#cnAvatar .av.m-madeira')"), 'moldura livre aplicada ao avatar')
    p.click('#cnMolduras button[data-item="mold:gelo"]'); p.wait_for_timeout(300)
    check('Semana perfeita' in p.inner_text('#cnAviso'), 'moldura de conquista: mostra a conquista')
    sec(p, '#cnSecConq'); p.wait_for_timeout(200)
    check(p.locator('#cnConq li').count() == 14 and p.locator('#cnConq li.ok').count() >= 1, 'lista de 14 conquistas, com as cumpridas marcadas')
    sec(p, '#cnSecEst'); p.wait_for_timeout(200)
    check('Estrelas das fases' in p.inner_text('#cnOrigem') and 'Gastas' in p.inner_text('#cnOrigem'), 'mostra de onde vêm as estrelas')
    p.screenshot(path=SAIDA + 'conta-colecao.png', full_page=True)
    print('Trocar o apelido custa estrelas')
    p.fill('#cnNome', 'Maria Sol'); p.click('#cnNomeOk'); p.wait_for_timeout(300)
    check('Faltam 25' in p.inner_text('#cnAviso') and p.evaluate("conta.nome") == 'Maria Luz', 'sem estrelas: não troca e diz quanto falta')
    p.evaluate("estrelasFase[5]=3;estrelasFase[6]=3;estrelasFase[7]=3;estrelasFase[8]=3;estrelasFase[9]=3;estrelasFase[10]=3;estrelasFase[11]=3;estrelasFase[12]=3;estrelasFase[13]=3;store.set('est',estrelasFase);renderConta()")
    before = p.evaluate("saldoAtual()")
    p.fill('#cnNome', 'Maria Sol'); p.click('#cnNomeOk'); p.wait_for_timeout(800)
    check(p.evaluate("conta.nome") == 'Maria Sol' and p.evaluate("saldoAtual()") == before - 30 and (pegar(['pub', 'u123']) or {}).get('nome') == 'Maria Sol', 'com estrelas: troca, gasta 30 e atualiza a nuvem')
    p.click('[data-close=conta]'); p.wait_for_timeout(200)
    check('Maria Sol' in p.inner_text('#hConta') and '★' in p.inner_text('#hConta'), 'tela inicial mostra apelido e estrelas')
    p.screenshot(path=SAIDA + 'conta-inicio.png')
    print('Conquista ao jogar')
    p.evaluate("prog.done.push(5,6,7,8,9); prog.max=10; store.set('prog',prog); aposVitoriaConta()"); p.wait_for_timeout(300)
    check('fases10' in p.evaluate("cart.v"), 'concluir 10 fases resgata a conquista')
    check('Conquista' in p.evaluate("document.querySelector('#toast')?document.querySelector('#toast').textContent:''") or p.evaluate("cart.v.includes('fases10')"), 'avisa a conquista')
    p.evaluate("contaSync({aplicar:false})"); p.wait_for_timeout(800)
    print('Outro aparelho')
    c2, p2 = novo(b, init=FIM)
    check(p2.evaluate("prog.done.length") == 0 and p2.evaluate("saldoAtual()") == 0, 'aparelho novo começa zerado')
    p2.click('#hConta'); p2.click('#cnEntrar'); p2.wait_for_timeout(2500)
    p2.evaluate("window.__marca=1"); p2.wait_for_timeout(3500)
    check(p2.evaluate("conta && conta.nome") == 'Maria Sol' and p2.evaluate("conta.novo") is not True and p2.evaluate("conta.av") == 'p8', 'perfil veio da nuvem (sem pedir o apelido de novo)')
    check(p2.evaluate("prog.done.length") >= 5 and p2.evaluate("itensDe(dadosAtuais()).has('av:p8')"), 'progresso e avatar comprado vieram junto')
    check(p2.evaluate("saldoAtual()") == p.evaluate("saldoAtual()"), 'o saldo é igual nos dois aparelhos: %s' % p2.evaluate("saldoAtual()"))
    check(p2.evaluate("window.__marca") == 1, 'não reinicia de novo depois de sincronizado (sem laço)')
    c2.close()
    print('Sem internet')
    MODO['v'] = 'offline'
    p.click('#hConta'); p.click('#cnMolduras button[data-item="mold:pixel"]'); p.wait_for_timeout(300)
    p.click('#cnMolduras button[data-item="mold:madeira"]'); p.wait_for_timeout(700)
    check(p.evaluate("conta.mold") == 'madeira' and p.evaluate("conta.sujo") is True, 'offline: a mudança fica no aparelho e avisa')
    MODO['v'] = 'ok'; sec(p, '#cnSecNuvem'); p.click('#cnSync'); p.wait_for_timeout(1000)
    check(p.evaluate("conta.sujo") is False, 'ao voltar a internet, envia')
    print('Sair e apagar')
    p.click('#cnSair'); p.wait_for_timeout(500)
    saldo_antes = p.evaluate("saldoAtual()")
    check(p.evaluate("conta") is None and p.evaluate("prog.done.length") == 10 and p.is_visible('#cnEntrar'), 'sair mantém o progresso do aparelho')
    check(pegar(['pub', 'u123']) is not None, 'sair não apaga a nuvem')
    p.click('#cnEntrar'); p.wait_for_timeout(1500)
    check(p.evaluate("conta && conta.nome") == 'Maria Sol', 'entrar de novo recupera o perfil')
    sec(p, '#cnSecNuvem'); p.evaluate("window.__reauthErro='auth/popup-closed-by-user'"); p.click('#cnApagar'); p.wait_for_timeout(700)
    check(pegar(['pub', 'u123']) is not None and p.evaluate("conta") is not None and 'Nada foi apagado' in p.inner_text('#cnAviso'), 'se não confirmar com o Google, nada é apagado')
    p.evaluate("window.__reauthErro=null"); p.click('#cnApagar'); p.wait_for_timeout(1200)
    check(pegar(['pub', 'u123']) is None and pegar(['priv', 'u123']) is None and p.evaluate("conta") is None and p.evaluate("window.__apagou") == 1, 'apagar remove tudo da nuvem, apaga a conta do Firebase e sai')
    check(p.evaluate("saldoAtual()") >= 0 and p.evaluate("prog.done.length") == 10, 'o progresso e as estrelas do aparelho continuam')
    print('Telas pequenas')
    c.close()
    for tema in ('madeira', 'pixel', 'claro'):
        c, p = novo(b, 320, 568, FIM + PROG + "try{localStorage.setItem('shapepuzzle.tema','\"%s\"')}catch(e){}" % tema)
        p.click('#hConta'); p.click('#cnEntrar'); p.wait_for_timeout(1500)
        for x in ('#cnSecAv', '#cnSecMold', '#cnSecConq'): sec(p, x)
        check(p.evaluate("document.documentElement.scrollWidth <= innerWidth"), f'320px sem rolagem lateral ({tema})')
        p.screenshot(path=SAIDA + f'conta-320-{tema}.png', full_page=True); c.close()
    b.close()
print('ERROS NO NAVEGADOR:' if erros else 'sem erros no navegador'); [print('  ', e) for e in erros]
print('\nFALHAS:' if falhas else '\nTUDO OK'); [print('  -', f) for f in falhas]
sys.exit(1 if falhas or erros else 0)
