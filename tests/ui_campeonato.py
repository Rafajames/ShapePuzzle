import os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'tests', 'saida') + os.sep
os.makedirs(SAIDA, exist_ok=True)
import re, json, time
from urllib.parse import urlparse, unquote
from playwright.sync_api import sync_playwright
URL = 'http://127.0.0.1:8765/index.html'
DB = 'https://shapepuzzle-76162-default-rtdb.firebaseio.com'
erros, falhas = [], []
def check(c, m):
    print(('  ok   ' if c else '  FALHA ') + m)
    if not c: falhas.append(m)

BANCO = {}          # "raiz" do banco simulado
MODO = {'v': None}  # None | 'offline' | 'negado'
LOG = []
def cam(path):
    return [x for x in path.strip('/').replace('.json', '').split('/') if x]
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
USERS = {}; SEQ = [0]; AUTHLOG = []
def auth_handler(route, req):
    h = {'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST,OPTIONS', 'access-control-allow-headers': '*'}
    if req.method == 'OPTIONS': return route.fulfill(status=204, headers=h)
    if MODO['v'] == 'offline': return route.abort('internetdisconnected')
    u = req.url; b = json.loads(req.post_data or '{}'); AUTHLOG.append(u.split('?')[0].split('/')[-1])
    def erro(m): route.fulfill(status=400, headers=h, content_type='application/json', body=json.dumps({'error': {'message': m}}))
    def tok(uid):
        SEQ[0] += 1; return 'tok_%s_%d' % (uid, SEQ[0])
    if 'accounts:signUp' in u:
        if b['email'] in USERS: return erro('EMAIL_EXISTS')
        if len(b['password']) < 6: return erro('WEAK_PASSWORD : Password should be at least 6 characters')
        uid = 'U%d' % (len(USERS) + 1); USERS[b['email']] = {'uid': uid, 'senha': b['password']}
        return route.fulfill(status=200, headers=h, content_type='application/json', body=json.dumps({'localId': uid, 'idToken': tok(uid), 'refreshToken': 'ref_' + uid, 'expiresIn': MODO.get('exp', '3600')}))
    if 'signInWithPassword' in u:
        us = USERS.get(b['email'])
        if not us or us['senha'] != b['password']: return erro('INVALID_LOGIN_CREDENTIALS')
        return route.fulfill(status=200, headers=h, content_type='application/json', body=json.dumps({'localId': us['uid'], 'idToken': tok(us['uid']), 'refreshToken': 'ref_' + us['uid'], 'expiresIn': MODO.get('exp', '3600')}))
    if 'securetoken' in u:
        if MODO.get('refresh_ruim'): return erro('TOKEN_EXPIRED')
        uid = b['refresh_token'].replace('ref_', '')
        return route.fulfill(status=200, headers=h, content_type='application/json', body=json.dumps({'id_token': tok(uid), 'refresh_token': b['refresh_token'], 'expires_in': '3600'}))
    erro('ERRO')

def uid_de(req):
    m = re.search(r'[?&]auth=tok_(U\d+)_', req.url)
    return m.group(1) if m else None
def handler(route, req):
    h = {'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,PUT,PATCH,DELETE,OPTIONS', 'access-control-allow-headers': '*'}
    if req.method == 'OPTIONS': return route.fulfill(status=204, headers=h)
    if MODO['v'] == 'offline': return route.abort('internetdisconnected')
    if MODO['v'] == 'negado': return route.fulfill(status=401, headers=h, body='{"error":"Permission denied"}', content_type='application/json')
    p = cam(urlparse(req.url).path)
    LOG.append((req.method, '/'.join(p)))
    negar = lambda: route.fulfill(status=401, headers=h, body='{"error":"Permission denied"}', content_type='application/json')
    uid = uid_de(req)
    if p[0] == 'c' and req.method in ('PUT', 'DELETE') and len(p) == 2:
        atual = pegar(p)
        if not uid: return negar()
        if atual is None:
            if req.method == 'DELETE': return route.fulfill(status=200, headers=h, body='null', content_type='application/json')
            if json.loads(req.post_data).get('uid') != uid: return negar()
        else:
            if atual.get('uid') != uid: return negar()
            if req.method == 'PUT' and pegar(['p', p[1]]): return negar()
    if p[0] == 'p' and req.method == 'DELETE' and len(p) == 2:
        c = pegar(['c', p[1]])
        if not uid or not c or c.get('uid') != uid: return negar()
    if req.method == 'DELETE':
        n = BANCO
        for x in p[:-1]:
            n = n.get(x, {}) if isinstance(n, dict) else {}
        if isinstance(n, dict): n.pop(p[-1], None)
        return route.fulfill(status=200, headers=h, body='null', content_type='application/json')
    if req.method == 'GET': return route.fulfill(status=200, headers=h, body=json.dumps(pegar(p)), content_type='application/json')
    if req.method == 'PUT':
        v = json.loads(req.post_data); por(p, v); return route.fulfill(status=200, headers=h, body=json.dumps(v), content_type='application/json')
    route.fulfill(status=400, headers=h, body='{}')

def novo(browser, w=390, h=844):
    ctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2)
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin='http://127.0.0.1:8765')
    ctx.route(re.compile(r'https://.*\.firebaseio\.com/.*'), handler)
    ctx.route(re.compile(r'https://(identitytoolkit|securetoken)\.googleapis\.com/.*'), auth_handler)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: erros.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: erros.append('console.' + m.type + ': ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text and 'net::ERR' not in m.text else None)
    return ctx, pg

RESOLVER = """() => { const j = S.jogo; const occ = j.grade.map(r => r.map(v => v !== 0));
  const r = buscar(occ, j.reserva, j.gab, 1, 3e6);
  const plano = r.primeira.map(s => ({uid: j.reserva[s.k].uid, o: s.o, px: s.px, py: s.py}));
  for (const st of plano){ const p = S.jogo.reserva.find(q => q.uid === st.uid); p.formato = st.o; tentarColocar(p, st.px, st.py); }
  return plano.length; }"""

def entrar(pg):
    pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(300)

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    print('1. Organizador: configurar banco e criar campeonato')
    ctxA, A = novo(b); entrar(A)
    A.click('#btnMenu'); A.click('#btnCamp'); A.wait_for_timeout(200)
    check(A.is_visible('#ov-camps'), 'tela de campeonatos abre pelo menu')
    A.click('#cpCriar'); check('nome' in A.inner_text('#cpAviso').lower(), 'pede o nome antes de criar')
    A.fill('#cpNome', 'Ana Souza'); A.click('#cpCriar')
    check('6 caracteres' in A.inner_text('#cpAviso').lower(), 'senha curta/vazia é recusada')
    A.fill('#cpSenha', '123456'); A.click('#cpCriar'); A.wait_for_timeout(500)
    check(A.is_visible('#cpSenha2') and 'primeira vez' in A.inner_text('#cpAviso').lower(), 'conta nova: pede para repetir a senha')
    A.fill('#cpSenha2', '654321'); A.click('#cpCriar'); check('iguais' in A.inner_text('#cpAviso').lower(), 'senhas diferentes: recusa')
    A.fill('#cpSenha2', '123456'); A.click('#cpCriar'); A.wait_for_timeout(700)
    check(A.is_visible('#ov-criar'), 'abre o formulário de criação depois de criar a conta')
    check('ana_souza@organizador.shapepuzzle.app' in USERS, 'conta de organizador criada (e-mail só interno)')
    check(A.evaluate('!!cpAuth') and A.evaluate('cpAuth.nome') == 'Ana Souza', 'aparelho reconhecido')
    A.click('#ov-criar [data-close=criar]'); A.click('#btnMenu'); A.click('#btnCamp'); A.wait_for_timeout(200)
    check(A.is_visible('#cpOrgOk') and not A.is_visible('#cpSenha'), 'depois de entrar não pede mais a senha')
    A.click('#cpCfg summary'); A.fill('#cpDb', 'https://evil.example.com'); A.click('#cpDbSalvar')
    check('inválido' in A.inner_text('#cpAviso').lower(), 'endereço que não é Firebase é recusado')
    A.click('#cpCriar'); A.wait_for_timeout(500)
    check(A.is_visible('#ov-criar'), 'segunda vez: vai direto ao formulário')
    check(A.inner_text('#crQtd') == '3', 'começa com 3 fases sugeridas')
    A.click('#crCriar'); check('nome' in A.inner_text('#crInfo').lower(), 'exige nome do campeonato')
    A.fill('#crNome', 'Copa da Familia'); A.fill('#crMax', '2')
    A.select_option('#crFonte', 'g:facil'); A.click('#crAdd'); check(A.inner_text('#crQtd') == '4', 'sortear fase adiciona')
    A.click('#crFases .cust:last-child .ib'); check(A.inner_text('#crQtd') == '3', 'remover fase funciona')
    A.select_option('#crPrazo', '3')
    A.click('#crCriar'); A.wait_for_timeout(800)
    check(A.is_visible('#ov-lobby'), 'abre a sala depois de criar')
    cod = A.inner_text('#lbSub .cod'); check(bool(re.fullmatch(r'[A-HJ-NP-Z2-9]{6}', cod)), 'código gerado: ' + cod)
    check(cod in BANCO.get('c', {}) and BANCO['c'][cod]['max'] == 2 and len(BANCO['c'][cod]['fases']) == 3, 'campeonato gravado no banco')
    check(BANCO['c'][cod]['fim'] > 0, 'prazo gravado')
    check(BANCO['c'][cod]['uid'] == 'U1' and BANCO['c'][cod]['org'] == 'Ana Souza', 'campeonato é do organizador (uid)')
    check('p' not in BANCO or cod not in BANCO['p'], 'organizador ainda não entrou como jogador')
    check(A.is_visible('#lbOrg') and A.is_enabled('#lbEditar'), 'organizador vê Editar e Excluir')
    # editar antes de alguém entrar
    A.click('#lbEditar'); A.wait_for_timeout(300)
    check(A.is_visible('#ov-criar') and A.input_value('#crNome') == 'Copa da Familia' and A.input_value('#crMax') == '2', 'editar abre o formulário já preenchido')
    check(A.inner_text('#crTitulo') == 'Editar campeonato', 'título de edição')
    A.fill('#crNome', 'Copa da Familia 2026'); A.click('#crCriar'); A.wait_for_timeout(800)
    check(BANCO['c'][cod]['nome'] == 'Copa da Familia 2026' and BANCO['c'][cod]['max'] == 2 and BANCO['c'][cod]['uid'] == 'U1', 'edição gravada no mesmo campeonato')
    check(BANCO['c'][cod]['fim'] > 0, 'prazo mantido na edição')
    check(A.is_visible('#lbEntrar'), 'organizador entra como jogador como qualquer um (só depois)')
    A.click('#lbConvidar'); A.wait_for_timeout(200)
    link = A.input_value('#shLink'); check('#c=' + cod in link and 'db=' in link, 'link do convite: ' + link[:70] + '…')
    A.click('#ov-share [data-close=share]')

    print('2. Participante abre o convite (sem banco configurado)')
    ctxB, B = novo(b); B.goto(link); B.wait_for_timeout(500)
    check('convidado' in B.inner_text('#splashMsg').lower(), 'tela inicial avisa do convite')
    B.click('#btnJogar'); B.wait_for_timeout(700)
    check(B.is_visible('#ov-lobby') and 'Copa da Familia 2026' in B.inner_text('#lbTitulo'), 'sala do campeonato abre sozinha')
    check(B.is_visible('#lbEntrar'), 'pede o nome para entrar')
    B.click('#lbEntrarBtn'); check('nome' in B.inner_text('#lbAviso').lower(), 'exige nome')
    B.fill('#lbNome', 'Beto'); B.click('#lbEntrarBtn'); B.wait_for_timeout(600)
    check('beto' in BANCO['p'][cod], 'entrou no banco')
    check(B.is_visible('#lbJogo') and not B.is_visible('#lbEntrar'), 'mostra as fases depois de entrar')

    print('3. Jogar: sem dica, cronômetro não pausa, resultado enviado')
    B.click('#lbFases .lf:nth-child(1) .btn'); B.wait_for_timeout(500)
    check(not B.is_visible('#ov-lobby'), 'sala fecha ao jogar')
    check(B.inner_text('#titulo .t2').startswith('Fase 1 de 3'), 'título mostra fase do campeonato')
    check(B.is_disabled('#btnDica'), 'botão de dica desligado')
    B.press('body', 'h'); B.wait_for_timeout(150)
    check(B.evaluate('S.dicas') == 0, 'tecla H não gera dica')
    B.wait_for_timeout(1200)
    t1 = B.evaluate('S.t.acum'); check(t1 > 800, 'tempo corre sem ter feito jogada (%d ms)' % t1)
    B.click('#btnMenu'); B.wait_for_timeout(1100); B.click('#ov-menu [data-close=menu]')
    t2 = B.evaluate('S.t.acum'); check(t2 - t1 > 900, 'tempo não para com o menu aberto (+%d ms)' % (t2 - t1))
    B.click('#btnReset'); B.wait_for_timeout(100)
    check(B.evaluate('S.t.acum') >= t2, 'limpar tabuleiro não zera o tempo')
    B.evaluate(RESOLVER); B.wait_for_timeout(1300)
    check(B.is_visible('#ov-win'), 'tela de vitória aparece')
    check(B.inner_text('#winTitulo').startswith('Fase 1 conclu'), 'título de vitória mostra o número da fase')
    check('enviado' in B.inner_text('#winTexto').lower(), 'resultado enviado: ' + B.inner_text('#winTexto'))
    r = BANCO['p'][cod]['beto']['f']['0']; check(r['t'] > 2000 and r['j'] >= 6, 'banco recebeu tempo e jogadas: %s' % r)
    check(B.locator('#winActs .btn:has-text("Jogar de novo")').count() == 0 and B.locator('#winActs .btn:has-text("Compartilhar")').count() == 0, 'sem botões de modo solo na vitória')
    B.click('#winActs .btn:has-text("Próxima fase")'); B.wait_for_timeout(400)
    check(B.inner_text('#titulo .t2').startswith('Fase 2 de 3'), 'próxima fase do campeonato')
    B.evaluate(RESOLVER); B.wait_for_timeout(1300)
    check(len(BANCO['p'][cod]['beto']['f']) == 2, 'segunda fase enviada')
    B.click('#winActs .btn:has-text("Ver ranking")'); B.wait_for_timeout(700)
    check(B.is_visible('#ov-lobby'), 'ver ranking abre a sala')
    check(B.locator('#lbFases .lf.ok').count() == 2, 'duas fases marcadas como feitas')
    check(B.locator('#lbRank .rk.eu').count() == 1, 'minha linha destacada')

    print('4. Vagas, ranking e quem chega depois')
    A.click('#lbAtualizar'); A.wait_for_timeout(600)
    check(A.is_disabled('#lbEditar'), 'depois que alguém entra, Editar fica desligado')
    check('só dá para excluir' in A.inner_text('#lbOrgInfo').lower() or 'só excluir' in A.inner_text('#lbOrgInfo').lower(), 'explica por quê: ' + A.inner_text('#lbOrgInfo')[:60])
    A.click('#lbEntrarBtn'); A.wait_for_timeout(600)
    rk = A.locator('#lbRank .rk').all_inner_texts()
    check('Beto' in rk[0] and 'Ana' in rk[1], 'Beto (2 fases) está à frente de Ana (0): ' + ' | '.join(x.replace('\n', ' ') for x in rk))
    ctxC, C = novo(b); C.goto(link); C.click('#btnJogar'); C.wait_for_timeout(700)
    C.fill('#lbNome', 'Carla'); C.click('#lbEntrarBtn'); C.wait_for_timeout(600)
    check('todas as vagas' in C.inner_text('#lbAviso').lower() and 'carla' not in BANCO['p'][cod], 'campeonato cheio (2 pessoas) recusa a terceira')
    # mesmo nome com outra grafia volta para a mesma conta
    ctxB2, B2 = novo(b); B2.goto(link); B2.click('#btnJogar'); B2.wait_for_timeout(700)
    B2.fill('#lbNome', 'BETO'); B2.click('#lbEntrarBtn'); B2.wait_for_timeout(600)
    check(B2.is_visible('#lbJogo') and B2.locator('#lbFases .lf.ok').count() == 2, 'mesmo nome volta ao progresso, sem ocupar vaga nova')
    # Ana joga e fica atrás/à frente conforme tempo
    A.click('#lbFases .lf:nth-child(1) .btn'); A.wait_for_timeout(400); A.evaluate(RESOLVER); A.wait_for_timeout(1300)
    A.click('#winActs .btn:has-text("Ver ranking")'); A.wait_for_timeout(700)
    check(A.locator('#lbFases .lf.ok').count() == 1, 'Ana tem 1 fase')
    # modo melhor: refazer e piorar não substitui
    antes = json.dumps(BANCO['p'][cod]['ana_souza']['f']['0'])
    A.click('#lbFases .lf:nth-child(1) .btn'); A.wait_for_timeout(2500); A.evaluate(RESOLVER); A.wait_for_timeout(1300)
    check(json.dumps(BANCO['p'][cod]['ana_souza']['f']['0']) == antes, 'tempo pior não substitui o melhor')
    check('melhor' in A.inner_text('#winTexto').lower(), 'avisa que o melhor tempo continua')
    A.click('#winActs .btn:has-text("Ver ranking")'); A.wait_for_timeout(300)

    print('5. Sem internet: guarda e reenvia')
    MODO['v'] = 'offline'
    A.click('#lbFases .lf:nth-child(2) .btn'); A.wait_for_timeout(400); A.evaluate(RESOLVER); A.wait_for_timeout(1500)
    check('sem conexão' in A.inner_text('#winTexto').lower(), 'avisa que guardou: ' + A.inner_text('#winTexto'))
    check(len(json.loads(A.evaluate('localStorage.getItem("shapepuzzle.cppend")') or '[]')) == 1, 'resultado ficou pendente no aparelho')
    check('1' not in (BANCO['p'][cod]['ana_souza'].get('f') or {}), 'nada foi ao banco ainda')
    MODO['v'] = None
    A.evaluate('cpDescarregar()'); A.wait_for_timeout(1000)
    check('1' in BANCO['p'][cod]['ana_souza']['f'], 'pendência enviada depois que a conexão voltou')

    print('6. Erros do banco e segurança do convite')
    MODO['v'] = 'negado'
    A.click('#winActs .btn:has-text("Ver ranking")'); A.wait_for_timeout(1200)
    check('regras' in A.inner_text('#lbAviso').lower(), 'regras não publicadas: mensagem clara')
    MODO['v'] = None
    ctxD, D = novo(b)
    D.goto(URL + '#c=' + cod + '&db=' + 'https%3A%2F%2Fevil.example.com'); D.wait_for_timeout(400)
    check(D.evaluate('CP.convite && CP.convite.db') == DB, 'convite com banco que não é Firebase: usa o banco oficial e nunca fala com o endereço estranho')
    ctxD2, D2 = novo(b); D2.goto(URL + '#c=ZZZ&db=' + 'https%3A%2F%2Fx.firebaseio.com'); D2.wait_for_timeout(400)
    check('convidado' not in D2.inner_text('#splashMsg').lower(), 'convite com código inválido é ignorado')
    ctxE, E = novo(b); entrar(E); E.click('#btnMenu'); E.click('#btnCamp')
    E.fill('#cpNome', 'Eva'); E.fill('#cpCodigo', 'XXXXXX'); E.click('#cpEntrar'); E.wait_for_timeout(800)
    check('não encontrei' in E.inner_text('#lbAviso').lower(), 'código inexistente: mensagem clara')

    print('7. Prazo, modo primeira vez e jogo normal intacto')
    k2 = 'ZZ2222'
    BANCO['c'][k2] = {'nome': 'Velho', 'org': 'Ana', 'max': 5, 'modo': 'primeira', 'fim': 1000, 'criado': 1, 'fases': [{'nome': 'F', 'text': E.evaluate('BUILTIN[3].text')}]}
    BANCO['p'][k2] = {'eva': {'n': 'Eva', 'ts': 1}}
    E.click('#lbFechar') if E.locator('#lbFechar').count() else E.click('#ov-lobby [data-close=lobby]')
    E.click('#btnMenu') if E.is_visible('#btnMenu') else None
    E.evaluate("abrirLobby('ZZ2222', cpDb)"); E.wait_for_timeout(700)
    check('prazo encerrado' in E.inner_text('#lbSub').lower(), 'prazo encerrado aparece')
    check(E.is_disabled('#lbFases .lf .btn'), 'não dá para jogar depois do prazo')
    k3 = 'ZZ3333'
    BANCO['c'][k3] = {'nome': 'Unica', 'org': 'Ana', 'max': 5, 'modo': 'primeira', 'fim': 0, 'criado': 1, 'fases': [{'nome': 'F', 'text': E.evaluate('BUILTIN[3].text')}]}
    BANCO['p'][k3] = {'eva': {'n': 'Eva', 'ts': 1, 'f': {'0': {'t': 50000, 'j': 20}}}}
    E.evaluate("abrirLobby('ZZ3333', cpDb)"); E.wait_for_timeout(700)
    check(E.is_disabled('#lbFases .lf .btn'), 'modo primeira vez: fase já feita não pode ser refeita')
    E.evaluate("document.querySelectorAll('.ov.on').forEach(o => o.classList.remove('on')); carregar({k:'b', i:0})"); E.wait_for_timeout(200)
    check(E.is_enabled('#btnDica'), 'jogo normal: dica volta a funcionar')
    E.click('#btnDica'); check(E.evaluate('S.dicas') == 1, 'dica gera contagem no modo normal')

    print('7b. Aparelho novo: recuperar o controle com a senha; excluir')
    ctxR, R = novo(b); R.goto(URL); R.click('#btnJogar'); R.evaluate(f"abrirLobby('{cod}', cpDb)"); R.wait_for_timeout(700)
    check(not R.is_visible('#lbOrg') and R.is_visible('#lbSouOrgBtn'), 'aparelho sem login: sem controles de organizador')
    R.click('#lbSouOrgBtn'); R.fill('#lbSenha', 'errada1'); R.click('#lbSenhaOk'); R.wait_for_timeout(600)
    check('não conferem' in R.inner_text('#lbAviso').lower() and not R.is_visible('#lbOrg'), 'senha errada não dá acesso')
    R.fill('#lbSenha', '123456'); R.click('#lbSenhaOk'); R.wait_for_timeout(700)
    check(R.is_visible('#lbOrg'), 'senha certa devolve o controle')
    check(R.is_disabled('#lbEditar'), 'e Editar continua desligado porque já há jogadores')
    check(R.evaluate('!!cpAuth'), 'aparelho passa a ser reconhecido')
    # sessão expirada e renovada sozinha
    R.evaluate('cpAuth.exp = Date.now() - 1000'); n0 = len(AUTHLOG)
    R.evaluate('tokenOrganizador()'); R.wait_for_timeout(500)
    check('token' in AUTHLOG[n0:] , 'token vencido é renovado sem pedir a senha')
    # outra conta não controla o campeonato
    ctxO, O = novo(b); O.goto(URL); O.click('#btnJogar'); O.evaluate(f"abrirLobby('{cod}', cpDb)"); O.wait_for_timeout(600)
    USERS['intruso@organizador.shapepuzzle.app'] = {'uid': 'U9', 'senha': 'abcdef'}
    O.evaluate("guardarAuth({localId:'U9', refreshToken:'ref_U9', idToken:'tok_U9_1', expiresIn:'3600'}, 'intruso', 'Intruso'); renderLobby()"); O.wait_for_timeout(300)
    check(not O.is_visible('#lbOrg'), 'outra conta não vê os controles do campeonato alheio')
    O.evaluate(f"nuvem(CP.db, 'DELETE', 'c/{cod}', undefined, cpAuth.token).catch(e => window.__negado = e.cod)"); O.wait_for_timeout(400)
    check(O.evaluate('window.__negado') == 'negado' and cod in BANCO['c'], 'banco recusa exclusão por outra conta')
    # excluir
    R.once('dialog', lambda d: d.accept())
    R.click('#lbExcluir'); R.wait_for_timeout(900)
    check(cod not in BANCO.get('c', {}) and cod not in BANCO.get('p', {}), 'campeonato e participantes apagados do banco')
    check(not R.is_visible('#ov-lobby') and R.evaluate("!cpMeus.some(x => x.id === '%s')" % cod), 'sai da sala e da lista')
    # sessão não renovável: pede a senha de novo
    R.evaluate('cpAuth.exp = Date.now() - 1000'); MODO['refresh_ruim'] = True
    check(R.evaluate('tokenOrganizador()') is None and R.evaluate('cpAuth') is None, 'refresh recusado: volta a pedir a senha')
    MODO['refresh_ruim'] = False
    # trocar de organizador
    R.click('#btnMenu'); R.click('#btnCamp'); R.wait_for_timeout(200)
    check(R.is_visible('#cpSenha'), 'sem sessão, a senha volta a ser pedida')

    print('8. Celular pequeno e desktop')
    ctxF, F = novo(b, 320, 640); F.goto(link); F.click('#btnJogar'); F.wait_for_timeout(800)
    check(F.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'sala sem rolagem horizontal em 320px')
    check(F.evaluate("(() => { const c = document.querySelector('#ov-lobby .card'); return c.scrollWidth <= c.clientWidth + 1; })()"), 'cartão da sala cabe na largura')
    ctxG, G = novo(b, 1280, 800); entrar(G); G.click('#btnMenu'); G.click('#btnCamp'); G.wait_for_timeout(200)
    G.screenshot(path=SAIDA + 'camp-hub.png')
    A.screenshot(path=SAIDA + 'camp-lobby.png')
    b.close()
print('\nERROS DE CONSOLE:', erros if erros else 'nenhum')
print('RESULTADO:', 'TUDO OK' if not falhas and not erros else 'FALHAS: %s' % falhas)
