# Atualização do jogo: versão no menu, "Verificar atualizações", aviso automático de versão nova e aplicar a atualização.
import os, sys, re
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'tests', 'saida') + os.sep
os.makedirs(SAIDA, exist_ok=True)
from playwright.sync_api import sync_playwright
URL = 'http://127.0.0.1:8765/index.html'
falhas = []; erros = []
def check(c, m):
    print(('  ok   ' if c else '  FALHA ') + m)
    if not c: falhas.append(m)
FIM = "localStorage.setItem('shapepuzzle.tuto','{\"sel\":true,\"giro\":true,\"esp\":true,\"fim\":true}')"
HTML = open(os.path.join(RAIZ, 'index.html'), encoding='utf-8').read()
VER = re.search(r"const VERSAO = '([^']+)'", HTML).group(1)
def nova_versao(v):
    p = v.split('.'); p[-1] = str(int(p[-1]) + 1); return '.'.join(p)
NOVA = nova_versao(VER)
def fecha_tudo(pg): pg.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))"); pg.wait_for_timeout(100)
with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(locale='pt-BR', viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
    ctx.add_init_script("try{" + FIM + "}catch(e){}")
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
    estado = {'versao': VER, 'falha': False, 'pedidos': 0}
    def rota(route):
        req = route.request
        if 'chk=' in req.url:
            estado['pedidos'] += 1
            if estado['falha']: route.abort(); return
            r = route.fetch()
            body = r.text().replace("const VERSAO = '" + VER + "'", "const VERSAO = '" + estado['versao'] + "'")
            route.fulfill(response=r, body=body)
        else: route.continue_()
    pg.route('**/index.html*', rota)
    pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(400)

    print('Versão e verificação manual')
    check(re.fullmatch(r'\d{4}\.\d{2}\.\d{2}\.\d+', VER) is not None, f'formato da versão: {VER}')
    check(pg.evaluate("VERSAO") == VER, 'o jogo conhece a própria versão')
    pg.click('#btnMenu'); pg.wait_for_timeout(250)
    pg.evaluate("document.querySelector('#btnAtualizar').scrollIntoView()")
    check(VER in pg.inner_text('#verTxt'), 'menu mostra a versão')
    check(pg.is_visible('#btnAtualizar') and 'Verificar' in pg.inner_text('#btnAtualizar'), 'botão "Verificar atualizações"')
    pg.click('#btnAtualizar'); pg.wait_for_timeout(600)
    check('mais recente' in pg.inner_text('#updMsg'), 'sem novidade: "você já está com a versão mais recente"')
    check(pg.is_hidden('#upd'), 'nenhum aviso de atualização')
    estado['falha'] = True
    pg.click('#btnAtualizar'); pg.wait_for_timeout(600)
    check('conexão' in pg.inner_text('#updMsg') and 'erro' in pg.get_attribute('#updMsg', 'class'), 'sem internet: mensagem de erro')
    check(pg.is_enabled('#btnAtualizar'), 'botão volta a funcionar')
    estado['falha'] = False

    print('Versão nova encontrada')
    estado['versao'] = NOVA
    pg.click('#btnAtualizar'); pg.wait_for_timeout(600)
    check('Versão nova' in pg.inner_text('#updMsg'), 'mensagem de versão nova no menu')
    check('Atualizar agora' in pg.inner_text('#btnAtualizar'), 'botão vira "Atualizar agora"')
    check(pg.is_visible('#upd'), 'aviso de atualização aparece também na tela do jogo')
    pg.screenshot(path=SAIDA + 'atualizacao-menu.png')
    pg.click('#updNao'); pg.wait_for_timeout(150)
    check(pg.is_hidden('#upd'), '"Depois" esconde o aviso')
    pg.evaluate("verificarAtualizacao(true)"); pg.wait_for_timeout(500)
    check(pg.is_hidden('#upd'), 'verificação automática não insiste na versão já dispensada')
    fecha_tudo(pg)

    print('Verificação automática')
    pg.evaluate("Upd.nova=null; Upd.dispensada=''; $('#upd').hidden=true")
    estado['versao'] = VER
    pg.evaluate("verificarAtualizacao(true)"); pg.wait_for_timeout(500)
    check(pg.is_hidden('#upd'), 'versão igual: fica quieto')
    estado['versao'] = NOVA
    pg.evaluate("S.jog=0"); pg.evaluate("verificarAtualizacao(true)"); pg.wait_for_timeout(500)
    check(pg.is_visible('#upd') and 'versão nova' in pg.inner_text('#updTxt'), 'versão nova: aviso aparece sozinho')
    check('recomeça' not in pg.inner_text('#updTxt'), 'fase sem jogadas: não avisa que recomeça')
    pg.evaluate("S.jog=3; mostrarAvisoAtualizacao()")
    check('recomeça' in pg.inner_text('#updTxt'), 'fase em andamento: avisa que recomeça')
    pg.screenshot(path=SAIDA + 'atualizacao-aviso.png')
    check(pg.evaluate("(()=>{const r=document.querySelector('#upd').getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && r.bottom<=innerHeight})()"), 'aviso cabe na tela do celular')
    pg.evaluate("verificarAtualizacao(true)")
    # versão mais antiga na rede (CDN atrasada) não deve oferecer "atualização"
    pg.evaluate("Upd.nova=null; $('#upd').hidden=true"); estado['versao'] = '2020.01.01.1'
    pg.evaluate("verificarAtualizacao(true)"); pg.wait_for_timeout(500)
    check(pg.is_hidden('#upd'), 'versão remota mais antiga não vira aviso')
    check(pg.evaluate("[versaoMaior('2026.11.01.2','2026.11.01.1'), versaoMaior('2026.11.02.1','2026.11.01.9'), versaoMaior('2026.11.01.10','2026.11.01.9'), versaoMaior('2026.11.01.1','2026.11.01.1'), versaoMaior('2026.10.31.9','2026.11.01.1')]") == [True, True, True, False, False], 'comparação de versões (inclusive .10 > .9)')

    print('Aplicar a atualização')
    estado['versao'] = NOVA
    pg.evaluate("verificarAtualizacao(true)"); pg.wait_for_timeout(500)
    pg.evaluate("localStorage.setItem('shapepuzzle.marca','mantida')")
    pg.evaluate("caches.open('teste-velho').then(c=>c.put('/x', new Response('a')))"); pg.wait_for_timeout(200)
    antes = pg.evaluate("performance.timeOrigin")
    with pg.expect_navigation(timeout=15000):
        pg.click('#updSim')
    pg.wait_for_timeout(500)
    check(pg.evaluate("performance.timeOrigin") != antes, 'a página recarregou')
    check(pg.evaluate("localStorage.getItem('shapepuzzle.marca')") == 'mantida', 'progresso e ajustes guardados continuam')
    check(pg.evaluate("caches.keys().then(k=>k.includes('teste-velho'))") is False, 'cache antigo foi apagado')

    print('Campeonato em andamento não é interrompido')
    pg.click('#btnJogar') if pg.is_visible('#btnJogar') else None
    pg.wait_for_timeout(200)
    pg.evaluate("S.cur.k='x'; S.venceu=false; Upd.nova='9999.1.1.1'")
    antes = pg.evaluate("performance.timeOrigin")
    pg.evaluate("aplicarAtualizacao()"); pg.wait_for_timeout(600)
    check(pg.evaluate("performance.timeOrigin") == antes, 'não recarrega durante o campeonato')
    check('campeonato' in pg.inner_text('#toast').lower(), 'avisa para terminar o campeonato')
    pg.evaluate("S.cur.k='b'")

    print('Idiomas')
    pg.evaluate("Upd.nova=null; $('#upd').hidden=true")
    pg.evaluate("abrirMenu()"); pg.wait_for_timeout(200)
    pg.select_option('#selIdioma', 'en'); pg.wait_for_timeout(300)
    check('Version' in pg.inner_text('#verTxt') and 'Check for updates' in pg.inner_text('#btnAtualizar'), 'menu em inglês')
    pg.evaluate("Upd.nova='9999.1.1.1'; mostrarAvisoAtualizacao()")
    check('new version' in pg.inner_text('#updTxt') and 'Update the game' in pg.inner_text('#updSim') and 'Later' in pg.inner_text('#updNao'), 'aviso em inglês')
    pg.select_option('#selIdioma', 'es'); pg.wait_for_timeout(300)
    check('versión nueva' in pg.inner_text('#updTxt'), 'trocar o idioma atualiza o aviso aberto')
    pg.select_option('#selIdioma', 'pt'); pg.wait_for_timeout(300)

    print('Serviço de instalação (sw.js)')
    sw = open(os.path.join(RAIZ, 'sw.js'), encoding='utf-8').read()
    check("searchParams.has('chk')" in sw, 'verificação de versão vai direto à rede (não entra no cache)')
    check("cache: 'no-cache'" in sw, 'arquivos do jogo são sempre revalidados')
    check(re.search(r"CACHE = 'shapepuzzle-v(\d+)'", sw) and int(re.search(r"CACHE = 'shapepuzzle-v(\d+)'", sw).group(1)) >= 2, 'nome do cache foi renovado')
    b.close()
print('erros de página:', erros)
if erros: falhas.append('erros de página')
print('TUDO OK' if not falhas else 'FALHAS: ' + str(falhas)); sys.exit(1 if falhas else 0)
