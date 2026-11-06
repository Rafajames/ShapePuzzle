import os, sys, json, re
from urllib.parse import urlparse, parse_qs
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
FASES = {}
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
    q = parse_qs(urlparse(req.url).query)
    geral = len(p) >= 2 and p[0] in ('c', 'p') and re.fullmatch(r'0[0-9A-Z]{5}', p[1]) is not None
    if geral and req.method == 'PUT':
        if not uid: return negar()
        if p[0] == 'c' and (pegar(p) is not None or not (isinstance(json.loads(req.post_data), dict) and json.loads(req.post_data).get('geral') is True)): return negar()
        if p[0] == 'p' and len(p) == 3 and (p[2] != uid[:24] or pegar(p) is not None): return negar()
        if p[0] == 'p' and len(p) == 5:
            v = json.loads(req.post_data)
            if p[2] != uid[:24] or v.get('t', 0) < 4000 or v.get('j', 0) < 5: return negar()
    if p[0] in ('pub', 'priv', 'foto'):
        dono = bool(uid) and len(p) >= 2 and uid == p[1]
        if req.method != 'GET' and not dono: return negar()
        if p[0] == 'priv' and not dono: return negar()
    if req.method == 'DELETE':
        n = BANCO
        for x in p[:-1]: n = n.get(x, {}) if isinstance(n, dict) else {}
        if isinstance(n, dict): n.pop(p[-1], None)
        return route.fulfill(status=200, headers=h, body='null', content_type='application/json')
    if req.method == 'GET':
        v = pegar(p)
        if q.get('shallow') == ['true'] and isinstance(v, dict): v = {k: True for k in v}
        if q.get('orderBy') == ['"n"'] and isinstance(v, dict):
            lim = int(q.get('limitToLast', ['100000'])[0]); ks = sorted(v, key=lambda k: (v[k].get('n', 0), k))[-lim:]; v = {k: v[k] for k in ks}
        return route.fulfill(status=200, headers=h, body=json.dumps(v), content_type='application/json')
    if req.method == 'PUT':
        v = json.loads(req.post_data); por(p, v); return route.fulfill(status=200, headers=h, body=json.dumps(v), content_type='application/json')
    if req.method == 'POST':
        v = json.loads(req.post_data); k = 'id%d' % len(LOG); por(p + [k], v); return route.fulfill(status=200, headers=h, body=json.dumps({'name': k}), content_type='application/json')
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

def entrar(p, apelido):
    p.click('#hConta'); p.check('#cnTermos'); p.click('#cnEntrar'); p.wait_for_timeout(1000)
    p.fill('#cnNome', apelido); p.click('#cnNomeOk'); p.wait_for_timeout(800)
    p.evaluate("fecharTodos(); abrir('splash')"); p.wait_for_timeout(200)
def semear(n):
    BANCO.clear()
    for i in range(n): BANCO.setdefault('pub', {})['x%03d' % i] = {'nome': 'Jogador%d' % i, 'av': 'p%d' % (i % 6 + 1), 'mold': '', 'n': 3 + i % 40, 'ts': 1000 + i}
def sala_cheia(id, n):
    for i in range(n): BANCO.setdefault('p', {}).setdefault(id, {})['z%03d' % i] = {'n': 'Fulano%d' % i, 'ts': 5 + i}
def guardar(p, id, idx, t, j):
    return p.evaluate("(a) => cpEnviarUm({id: a[0], db: cpDb, key: chaveGeral(conta.uid), idx: a[1], t: a[2], j: a[3], modo: 'melhor', geral: true}).catch(e => 'erro:' + e.cod)", [id, idx, t, j])
with sync_playwright() as pw:
    b = pw.chromium.launch()
    print('Ranking sem conta')
    semear(150)
    c, p = novo(b)
    check('Ranking geral' in p.inner_text('#hPos'), 'a tela inicial tem o cartão do ranking: ' + p.inner_text('#hPos').replace('\n', ' '))
    p.click('#hPos'); p.wait_for_timeout(900)
    check(aberta(p, 'rank'), 'abre o ranking geral')
    linhas = p.locator('#rkLista .rk')
    check(linhas.count() == 100, 'mostra os 100 primeiros: %d' % linhas.count())
    ns = p.evaluate("[...document.querySelectorAll('#rkLista .rk .tm')].map(e => parseInt(e.textContent))")
    check(ns == sorted(ns, reverse=True) and ns[0] == 42, 'ordem: mais fases primeiro: ' + str(ns[:5]))
    check(p.locator('#rkLista .rk .av').count() == 100, 'cada linha mostra o avatar')
    check('Entre com o Google' in p.inner_text('#rkAviso'), 'avisa que precisa entrar para aparecer')
    p.screenshot(path=SAIDA + 'ranking.png')
    q = [m for m, u in LOG if u == 'pub']; check(len(q) >= 1, 'buscou o ranking com uma única leitura')
    p.click('#rkSemana'); p.wait_for_timeout(500)
    check(not aberta(p, 'lobby') and aberta(p, 'conta'), 'sem conta, o campeonato da semana leva ao login')
    c.close()

    print('Login, posição e campeonato da semana')
    semear(150); LOG.clear()
    c, p = novo(b)
    entrar(p, 'Maria Luz')
    p.click('#hPos'); p.wait_for_timeout(900)
    eu = p.locator('#rkLista .rk.eu')
    check(eu.count() == 1 and 'Maria Luz' in eu.inner_text(), 'sou destacada no ranking (5 fases = abaixo do top 100? ' + str(eu.count()) + ')' if eu.count() else 'sou destacada no ranking')
    p.evaluate("fecharTodos(); abrir('splash')")
    sem = p.evaluate("semanaAgora()"); id1 = p.evaluate("idSala(semanaAgora(), 1)")
    check(re.fullmatch(r'0[0-9A-Z]{5}', id1) is not None, 'id da sala da semana: ' + id1)
    p.click('#hCamp'); p.wait_for_timeout(300)
    check(p.is_visible('#cpSemana') and 'sem internet' not in p.inner_text('#cpSemana'), 'a tela Campeonatos tem o botão da semana')
    p.click('#cpSemana'); p.wait_for_timeout(9000)
    c1 = pegar(['c', id1]) or {}
    check(c1.get('geral') is True and c1.get('max') == 100 and len(c1.get('fases', [])) == 5 and c1.get('sem') == sem and c1.get('sala') == 1, 'sala 1 criada com 5 fases: ' + str({k: c1.get(k) for k in ('geral', 'max', 'sem', 'sala')}))
    check(len({f['text'] for f in c1.get('fases', [])}) == 5, 'as 5 fases são diferentes')
    check(c1.get('fim') == p.evaluate("fimDaSemana(semanaAgora())") and c1.get('uid') == 'u123', 'prazo = fim da semana')
    FASES.update(c1)
    mine = (pegar(['p', id1, 'u123']) or {})
    check(mine.get('n') == 'Maria Luz' and mine.get('av', '').startswith('p'), 'entrou na sala com apelido e avatar: ' + json.dumps(mine))
    check(aberta(p, 'lobby') and 'Campeonato da semana' in p.inner_text('#lbTitulo'), 'abre a sala da semana')
    check(p.is_hidden('#lbConvidar') and p.is_hidden('#lbEntrar') and p.is_hidden('#lbOrg') and p.locator('#lbFases .lf').count() == 5, 'sala geral: sem convite, sem organizador, 5 fases')
    check(p.locator('#lbRank .rk .av').count() == 1, 'ranking da sala mostra avatar')
    # regras: resultado rápido demais ou jogadas de menos é recusado
    r = guardar(p, id1, 0, 1000, 20); check(str(r).startswith('erro:negado'), 'tempo abaixo de 4 s é recusado nas salas gerais')
    r = guardar(p, id1, 0, 9000, 2); check(str(r).startswith('erro:negado'), 'menos de 5 jogadas é recusado nas salas gerais')
    for i, t in enumerate((9000, 12000, 15000, 21000)): guardar(p, id1, i, t, 20 + i)
    p.evaluate("atualizarLobby()"); p.wait_for_timeout(500)
    check(p.evaluate("(cart.g||{})['w:%s']" % id1) is None, 'com 4 fases ainda não vale o bônus')
    guardar(p, id1, 4, 30000, 30); p.evaluate("atualizarLobby()"); p.wait_for_timeout(600)
    check(p.evaluate("(cart.g||{})['w:%s']" % id1) == 10, 'completar as 5 fases dá +10 ★')
    s1 = p.evaluate("saldoAtual()"); p.evaluate("atualizarLobby()"); p.wait_for_timeout(500)
    check(p.evaluate("saldoAtual()") == s1, 'o bônus só vale uma vez')
    check('🥇' in p.inner_text('#lbRank .rk.eu'), 'estou em 1º na sala')
    p.screenshot(path=SAIDA + 'sala-semana.png')
    pos = p.evaluate("rkPos")
    check(pos and pos.get('sala') and pos['sala']['pos'] == 1 and pos['sala']['de'] == 1, 'a posição na sala foi guardada: ' + json.dumps(pos))
    # entrar de novo cai na mesma sala (sem duplicar)
    p.evaluate("fecharTodos(); abrir('splash')"); p.click('#hCamp'); p.click('#cpSemana'); p.wait_for_timeout(1800)
    check(len(BANCO['p'][id1]) == 1 and aberta(p, 'lobby') and pegar(['c', p.evaluate("idSala(semanaAgora(), 2)")]) is None, 'entrar de novo volta para a mesma sala, sem criar outra')
    print('Denunciar e bloquear')
    BANCO['p'][id1]['zzfeio'] = {'n': 'Feioso', 'ts': 9, 'av': 'a10', 'f': {'0': {'t': 20000, 'j': 30}}}
    p.evaluate("atualizarLobby()"); p.wait_for_timeout(500)
    check(p.locator('#lbRank .rk.eu .rkMais').count() == 0 and p.locator('#lbRank .rk:not(.eu) .rkMais').count() == 1, 'cada jogador da sala tem o botão denunciar/bloquear (menos eu)')
    p.click('#lbRank .rk:not(.eu) .rkMais'); p.wait_for_timeout(300)
    check(aberta(p, 'denuncia') and 'Feioso' in p.inner_text('#dnNome') and not aberta(p, 'jog'), 'o botão abre denunciar/bloquear (sem abrir as estatísticas)')
    p.check('[name=dnMot][value=trapaca]'); p.click('#dnEnviar'); p.wait_for_timeout(600)
    dens = list((BANCO.get('den') or {}).values())
    check(len(dens) == 1 and dens[0]['alvo'] == 'zzfeio' and dens[0]['motivo'] == 'trapaca' and dens[0]['sala'] == id1 and dens[0]['por'] == 'u123' and 'enviada' in p.inner_text('#dnAviso'), 'denúncia enviada para a moderação: ' + json.dumps(dens))
    check(p.is_disabled('#dnEnviar'), 'não dá para denunciar a mesma pessoa duas vezes')
    p.click('#dnBloquear'); p.wait_for_timeout(300)
    check(p.evaluate("bloqueado('zzfeio')") and 'Jogador bloqueado' in p.inner_text('#lbRank') and 'Feioso' not in p.inner_text('#lbRank'), 'bloquear esconde o nome na sala')
    p.screenshot(path=SAIDA + 'denuncia.png')
    p.click('[data-close=denuncia]'); p.evaluate("fecharTodos(); abrir('splash'); abrirConta()"); p.wait_for_timeout(300)
    p.evaluate("document.querySelector('#cnSecBloq').open = true"); p.wait_for_timeout(150)
    check(p.is_visible('#cnSecBloq') and 'Feioso' in p.inner_text('#cnBloqLista'), 'Meu perfil lista os bloqueados')
    p.click('#cnBloqLista button'); p.wait_for_timeout(200)
    check(not p.evaluate("bloqueado('zzfeio')") and p.is_hidden('#cnSecBloq'), 'desbloquear pelo perfil')
    p.evaluate("fecharTodos(); abrir('splash')"); p.click('#hPos'); p.wait_for_timeout(900)
    check(p.locator('#rkLista .rk.eu .rkMais').count() == 0 and p.locator('#rkLista .rk:not(.eu) .rkMais').count() > 0, 'ranking geral também tem denunciar/bloquear')
    p.locator('#rkLista .rk:not(.eu) .rkMais').first.click(); p.wait_for_timeout(200); p.click('#dnBloquear'); p.wait_for_timeout(300)
    check(p.locator('#rkLista .rk.bloq').count() == 1, 'bloquear no ranking geral esconde a pessoa'); p.evaluate("bloq = {}; store.set('bloq', bloq)"); p.evaluate("fecharTodos(); abrir('splash')")
    c.close()

    print('Aviso ao abrir o jogo')
    c, p = novo(b)
    entrar(p, 'Maria Luz'); p.evaluate("store.set('rkpos', null)")
    p.click('#hCamp'); p.click('#cpSemana'); p.wait_for_timeout(9000); p.evaluate("fecharTodos(); abrir('splash')")
    guardar(p, id1, 0, 9000, 20); p.reload(); p.wait_for_timeout(5200)
    tt = p.inner_text('#toast')
    check('ranking geral' in tt and 'campeonato da semana' in tt, 'ao abrir, avisa a posição no ranking e no campeonato: ' + tt)
    check('º' in p.inner_text('#hPos') and 'Semana' in p.inner_text('#hPos'), 'cartão da tela inicial mostra as posições: ' + p.inner_text('#hPos').replace('\n', ' '))
    c.close()

    print('Sala cheia: vai para a sala 2')
    semear(5); sala_cheia(id1, 100); c, p = novo(b)
    entrar(p, 'Maria Luz')
    p.click('#hCamp'); p.click('#cpSemana'); p.wait_for_timeout(9000)
    id2 = p.evaluate("idSala(semanaAgora(), 2)")
    check(pegar(['c', id2]) is not None and pegar(['p', id2, 'u123']) is not None and len(BANCO['p'][id1]) == 100, 'sala 1 cheia (100): criou e entrou na sala 2')
    c.close()

    print('Todas as salas cheias')
    semear(5); c, p = novo(b)
    entrar(p, 'Maria Luz')
    for s in range(1, 31):
        i = p.evaluate("(s) => idSala(semanaAgora(), s)", s)
        BANCO.setdefault('c', {})[i] = dict(FASES, sala=s); sala_cheia(i, 100)
    p.click('#hCamp'); p.click('#cpSemana'); p.wait_for_timeout(5000)
    check('cheias' in p.inner_text('#cpAviso') and not aberta(p, 'lobby'), 'com as 30 salas cheias avisa para tentar na semana que vem: ' + p.inner_text('#cpAviso'))
    c.close()

    print('Sem conexão e tamanho de tela')
    semear(30); c, p = novo(b, 320, 568)
    MODO['v'] = 'offline'; p.click('#hPos'); p.wait_for_timeout(1200)
    check(aberta(p, 'rank') and p.inner_text('#rkAviso').strip() != '' and p.locator('#rkLista .rk').count() == 0, 'sem internet: avisa e não quebra: ' + p.inner_text('#rkAviso'))
    MODO['v'] = 'ok'; p.click('#rkAtualizar'); p.wait_for_timeout(900)
    check(p.locator('#rkLista .rk').count() > 0, 'Atualizar carrega de novo')
    check(p.evaluate("document.documentElement.scrollWidth <= innerWidth"), 'ranking cabe em 320px')
    p.screenshot(path=SAIDA + 'ranking-320.png')
    c.close()
    b.close()
print('\nERROS DE PÁGINA:', erros if erros else 'nenhum')
if erros or falhas: print('UI RANKING: COM FALHAS'); sys.exit(1)
print('UI RANKING: TUDO OK')
