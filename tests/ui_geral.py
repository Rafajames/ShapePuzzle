import os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'tests', 'saida') + os.sep
os.makedirs(SAIDA, exist_ok=True)
import re, json, sys, time
from playwright.sync_api import sync_playwright

SC = SAIDA + ''
URL = 'http://127.0.0.1:8765/index.html'
erros, falhas = [], []

def check(cond, msg):
    print(('  ok   ' if cond else '  FALHA ') + msg)
    if not cond: falhas.append(msg)

def novo(browser, **kw):
    ctx = browser.new_context(locale='pt-BR', viewport={'width': 390, 'height': 844}, device_scale_factor=2, **kw)
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin='http://127.0.0.1:8765')
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: erros.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: erros.append('console.' + m.type + ': ' + m.text) if m.type == 'error' else None)
    return ctx, pg

PLANO = """() => { const j = S.jogo; const occ = j.grade.map(r => r.map(v => v !== 0));
  const r = buscar(occ, j.reserva, j.gab, 1, 3e6);
  return r.primeira.map(s => ({uid: j.reserva[s.k].uid, o: s.o, px: s.px, py: s.py})); }"""

def jogar_arrastando(pg):
    plano = pg.evaluate(PLANO)
    cell = pg.evaluate('S.cell')
    pend = list(plano)
    while pend:
        vis = set(pg.evaluate("[...document.querySelectorAll('.pw')].map(w => +w.dataset.uid)"))
        st = next(x for x in pend if x['uid'] in vis); pend.remove(st)
        pg.evaluate("(st) => { const p = S.jogo.reserva.find(q => q.uid === st.uid); p.formato = st.o; renderReserva(); }", st)
        box = pg.locator(f'.pw[data-uid="{st["uid"]}"]').bounding_box()
        bb = pg.locator('#board').bounding_box()
        h, w = len(st['o']), len(st['o'][0])
        cell = pg.evaluate('S.cell')
        tx, ty = bb['x'] + (st['px'] + w / 2) * cell, bb['y'] + (st['py'] + h / 2) * cell
        pg.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
        pg.mouse.down(); pg.mouse.move(tx - 25, ty - 25, steps=5); pg.mouse.move(tx, ty, steps=4); pg.mouse.up()
        pg.wait_for_timeout(60)
    return len(plano)

def chave_forma(coords):
    mx, my = min(c[0] for c in coords), min(c[1] for c in coords)
    return sorted((x - mx, y - my) for x, y in coords)

def forma_de(f):
    return chave_forma([(x, y) for y, r in enumerate(f) for x, v in enumerate(r) if v])

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])

    # ---------------------------------------------------------------- 1. carga
    print('1. Carga e abertura')
    ctx, pg = novo(b)
    pg.goto(URL); pg.wait_for_timeout(400)
    check(pg.title() == 'Shape Puzzle', 'título da página')
    check(pg.evaluate('BUILTIN.length') == 50, '50 fases embutidas')
    check(not pg.is_visible('#splashMsg'), 'aviso de fase compartilhada escondido por padrão')
    txt = pg.evaluate('document.documentElement.outerHTML')
    check(not re.search(r'TJRR|Tribunal|tribunal|STI\b', txt), 'nenhuma menção ao trabalho no código da página')
    check(pg.evaluate('document.documentElement.scrollWidth') <= 390, 'sem rolagem horizontal na abertura')
    pg.screenshot(path=SC + 'v2-01-splash.png')
    pg.click('#btnJogar'); pg.wait_for_timeout(500)
    check(pg.evaluate('Som.humorAtual()') == 'calma', 'música começa no clima Calma')

    # ---------------------------------------------------------------- 2. música por clima
    print('2. Música: climas')
    pg.evaluate("carregar({k:'b', i:11})"); pg.wait_for_timeout(200)
    check(pg.evaluate('Som.humorAtual()') == 'animada', 'fase 12 → Animada (automático)')
    pg.evaluate("carregar({k:'b', i:22})"); pg.wait_for_timeout(200)
    check(pg.evaluate('Som.humorAtual()') == 'noturna', 'fase 23 → Noturna (automático)')
    pg.click('#btnMenu'); pg.select_option('#selHumor', 'animada'); pg.wait_for_timeout(200)
    check(pg.evaluate('Som.humorAtual()') == 'animada', 'estilo fixo Animada vale em qualquer fase')
    pg.evaluate("carregar({k:'b', i:0})"); pg.wait_for_timeout(150)
    check(pg.evaluate('Som.humorAtual()') == 'animada', 'estilo fixo não muda ao trocar de fase')
    pg.select_option('#selHumor', 'auto'); pg.wait_for_timeout(200)
    check(pg.evaluate('Som.humorAtual()') == 'calma', 'voltar ao Automático retorna ao clima da fase')
    check(pg.evaluate('store.get("humor")') == 'auto', 'escolha de estilo salva')
    pg.keyboard.press('Escape')
    pg.click('#btnMusica'); pg.wait_for_timeout(100)
    check(pg.evaluate('Som.musica()') is False, 'botão do topo desliga a música')
    pg.click('#btnMusica'); pg.wait_for_timeout(200)
    check(pg.evaluate('Som.musica()') is True and pg.evaluate('Som.humorAtual()') == 'calma', 'e liga de novo')

    # ---------------------------------------------------------------- 3. dica + girar/espelhar + toque
    print('3. Dica, girar/espelhar e encaixe por toque (fase 2)')
    pg.evaluate("carregar({k:'b', i:1})"); pg.wait_for_timeout(200)
    bb = pg.locator('#board').bounding_box(); cell = pg.evaluate('S.cell')
    pg.screenshot(path=SC + 'v2-02-jogo.png')
    for passo in range(12):
        if pg.evaluate('S.venceu'): break
        pg.click('#btnDica'); pg.wait_for_timeout(120)
        if pg.evaluate('S.dicaNivel') == 1: pg.click('#btnDica'); pg.wait_for_timeout(120)  # 1º degrau só marca a peça
        idx = pg.evaluate("[...document.querySelectorAll('#board .cell')].map((c, i) => c.classList.contains('dica') ? i : -1).filter(i => i >= 0)")
        if not idx: check(False, 'dica não destacou casas no passo %d' % passo); break
        alvo = chave_forma([(i % 5, i // 5) for i in idx])
        if passo == 0: pg.screenshot(path=SC + 'v2-03-dica.png')
        for t in range(10):
            f = pg.evaluate('S.sel.formato')
            if forma_de(f) == alvo: break
            pg.click('#btnFlip' if t == 4 else '#btnGirar'); pg.wait_for_timeout(40)
        f = pg.evaluate('S.sel.formato')
        w, h = len(f[0]), len(f)
        mx, my = min(i % 5 for i in idx), min(i // 5 for i in idx)
        cx, cy = mx + w // 2, my + h // 2
        pg.mouse.click(bb['x'] + (cx + .5) * cell, bb['y'] + (cy + .5) * cell); pg.wait_for_timeout(80)
    pg.wait_for_selector('#ov-win.on', timeout=6000)
    st = pg.evaluate('({venceu: S.venceu, dicas: S.dicas, jog: S.jog, rec: !!recs["b:fase02"]})')
    check(st['venceu'] and st['dicas'] >= 1, f"fase 2 vencida usando só dicas ({st['dicas']} dicas, {st['jog']} jogadas)")
    check(not st['rec'], 'partida com dica não grava recorde')
    check('Com dica' in pg.inner_text('#winBadge'), 'modal avisa que não vale recorde')
    check(pg.evaluate('prog.max') >= 2, 'próxima fase liberada')
    pg.wait_for_timeout(1000); pg.screenshot(path=SC + 'v2-04-vitoria-dica.png')

    # ---------------------------------------------------------------- 4. tempo, jogadas, recorde
    print('4. Tempo, jogadas e recorde (fase 2, sem dica)')
    pg.wait_for_selector('#ov-win.on'); pg.click('#winActs .btn:has-text("Jogar de novo")'); pg.wait_for_timeout(200)
    check(pg.inner_text('#stTempo') == '0:00' and pg.inner_text('#stJog').startswith('0 '), 'contadores zerados ao reiniciar')
    pg.wait_for_timeout(1200)
    check(pg.inner_text('#stTempo') == '0:00', 'relógio só começa na primeira ação')
    n = jogar_arrastando(pg)
    pg.wait_for_selector('#ov-win.on', timeout=6000)
    r1 = pg.evaluate('recs["b:fase02"]')
    check(r1 is not None and r1['j'] == n, f"recorde gravado com {r1 and r1['j']} jogadas (mínimo {n})")
    check('Primeiro registro' in pg.inner_text('#winBadge'), 'modal: primeiro registro')
    pg.wait_for_timeout(900); pg.screenshot(path=SC + 'v2-05-vitoria-recorde.png')
    pg.wait_for_selector('#ov-win.on'); pg.click('#winActs .btn:has-text("Jogar de novo")'); pg.wait_for_timeout(200)
    check(pg.is_visible('#pRec'), 'recorde aparece abaixo do título durante a fase')
    pg.screenshot(path=SC + 'v2-06-stats.png')
    jogar_arrastando(pg); pg.wait_for_selector('#ov-win.on', timeout=6000)
    r2 = pg.evaluate('recs["b:fase02"]')
    check(r2['t'] <= r1['t'], f"recorde nunca piora ({r1['t']}ms → {r2['t']}ms)")
    pg.click('#winActs .btn:has-text("Próxima fase")'); pg.wait_for_timeout(200)
    check(pg.evaluate('S.cur.i') == 2, 'botão Próxima fase avança')

    # ---------------------------------------------------------------- 5. fase do dia
    print('5. Fase do dia, sequência e compartilhar resultado')
    pg.click('#btnMenu'); pg.wait_for_timeout(150)
    check('um desafio novo por dia' in pg.inner_text('#diaSub'), 'menu mostra o desafio do dia')
    pg.screenshot(path=SC + 'v2-07-menu-topo.png')
    pg.click('#btnDia'); pg.wait_for_timeout(500)
    check(pg.evaluate('S.cur.k') == 'd' and pg.inner_text('#titulo .t1') == 'Fase do dia', 'abre a fase do dia')
    n = pg.evaluate('S.jogo.reserva.length')
    jogar_arrastando(pg); pg.wait_for_selector('#ov-win.on', timeout=6000)
    hoje = pg.evaluate('dataHoje()')
    check(pg.evaluate(f'!!dias["{hoje}"]'), 'conclusão do dia registrada')
    pg.wait_for_timeout(800); pg.screenshot(path=SC + 'v2-08-vitoria-dia.png')
    pg.click('#winActs .btn:has-text("Compartilhar resultado")'); pg.wait_for_timeout(200); pg.click('#shCopiar'); pg.wait_for_timeout(300)
    clip = pg.evaluate('navigator.clipboard.readText()')
    check('Fase do dia' in clip and 'http' in clip, 'resultado do dia compartilhado/copiado: ' + clip.replace('\n', ' | ')[:90])
    pg.click('#ov-share [data-close=share]'); pg.wait_for_timeout(100); pg.click('#winActs .btn:has-text("Fases")'); pg.wait_for_timeout(200)
    check(pg.inner_text('#diaTag').startswith('✓'), 'menu marca o dia como feito')
    check('1 dia' in pg.inner_text('#diaSub'), 'sequência de 1 dia')
    pg.keyboard.press('Escape')

    # ---------------------------------------------------------------- 6. editor → link → abrir
    print('6. Criar fase, compartilhar por link e abrir o link')
    pg.click('#btnMenu'); pg.click('#btnCriar'); pg.wait_for_timeout(250)
    eb = pg.locator('#edBoard').bounding_box(); ec = eb['height'] / 5
    sw = pg.locator('#pal .sw')
    sw.nth(0).click()
    for y in range(5):
        pg.mouse.move(eb['x'] + ec * .5, eb['y'] + ec * (y + .5)); pg.mouse.down()
        pg.mouse.move(eb['x'] + ec * 1.5, eb['y'] + ec * (y + .5), steps=4); pg.mouse.up()
    pg.locator('#pal .sw').nth(1).click()
    for y in range(5):
        pg.mouse.move(eb['x'] + ec * 2.5, eb['y'] + ec * (y + .5)); pg.mouse.down()
        pg.mouse.move(eb['x'] + ec * 4.5, eb['y'] + ec * (y + .5), steps=6); pg.mouse.up()
    check(pg.is_enabled('#edSalvar'), 'editor libera salvar com 25 casas')
    pg.screenshot(path=SC + 'v2-09-editor.png')
    pg.select_option('#edDif', '0'); pg.fill('#edNome', 'duas-barras')
    pg.click('#edSalvar'); pg.wait_for_timeout(100)
    check(pg.evaluate('custom.length') == 1, 'fase salva em Minhas fases')
    pg.click('#edCompartilhar'); pg.wait_for_timeout(200); pg.click('#shCopiar'); pg.wait_for_timeout(300)
    clip = pg.evaluate('navigator.clipboard.readText()')
    m = re.search(r'https?://\S+#f=\S+', clip)
    check(bool(m), 'link da fase copiado')
    pg.click('#ov-share [data-close=share]'); pg.wait_for_timeout(100)
    link = m.group(0) if m else None
    ctx.close()

    if link:
        ctx2, pg2 = novo(b)
        pg2.goto(link); pg2.wait_for_timeout(500)
        check(pg2.is_visible('#splashMsg'), 'link aberto: aviso na tela inicial')
        check(pg2.evaluate('S.cur.shared') is True and pg2.evaluate('S.cur.nome') == 'duas-barras', 'fase compartilhada carregada com o nome certo')
        check(pg2.evaluate('location.hash') == '', 'hash limpo depois de ler')
        pg2.screenshot(path=SC + 'v2-10-link-aberto.png')
        pg2.click('#btnJogar'); pg2.wait_for_timeout(200)
        jogar_arrastando(pg2); pg2.wait_for_selector('#ov-win.on', timeout=6000)
        pg2.click('#winActs .btn:has-text("Salvar em Minhas fases")'); pg2.wait_for_timeout(200)
        check(pg2.evaluate('custom.map(c => c.nome)') == ['duas-barras'], 'salvar fase recebida funciona')
        ctx2.close()

    ctx3, pg3 = novo(b)
    pg3.goto(URL + '#f=%%%lixo&n=x'); pg3.wait_for_timeout(500)
    check(pg3.evaluate('S.cur.k') == 'b', 'link inválido cai na fase normal (sem travar)')
    ctx3.close()

    # ---------------------------------------------------------------- 7. toque de verdade
    print('7. Toque (celular): selecionar peça e tocar no tabuleiro')
    ctx, pg = novo(b, has_touch=True, is_mobile=True)
    pg.goto(URL); pg.wait_for_timeout(300); pg.click('#btnJogar'); pg.wait_for_timeout(200)
    pg.evaluate("carregar({k:'b', i:1})")
    plano = pg.evaluate(PLANO); st = plano[0]
    pg.evaluate("(st) => { const p = S.jogo.reserva.find(q => q.uid === st.uid); p.formato = st.o; renderReserva(); }", st)
    box = pg.locator(f'.pw[data-uid="{st["uid"]}"]').bounding_box(); bb = pg.locator('#board').bounding_box(); cell = pg.evaluate('S.cell')
    pg.touchscreen.tap(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2); pg.wait_for_timeout(100)
    check(pg.evaluate('!!S.sel'), 'toque seleciona a peça')
    h, w = len(st['o']), len(st['o'][0])
    pg.touchscreen.tap(bb['x'] + (st['px'] + w // 2 + .5) * cell, bb['y'] + (st['py'] + h // 2 + .5) * cell); pg.wait_for_timeout(150)
    check(pg.evaluate('S.jog') == 1, 'toque no tabuleiro encaixa a peça')
    check(pg.evaluate('document.documentElement.scrollWidth') <= 390, 'sem rolagem horizontal no celular')
    ctx.close()

    # ---------------------------------------------------------------- 8. PWA
    print('8. PWA: manifesto, service worker e offline')
    ctx, pg = novo(b)
    pg.goto(URL); pg.wait_for_function('navigator.serviceWorker && navigator.serviceWorker.controller || false', timeout=8000) if False else None
    pg.wait_for_function("navigator.serviceWorker.ready.then(() => true)", timeout=8000)
    pg.wait_for_timeout(800)
    man = pg.evaluate("fetch('manifest.webmanifest').then(r => r.json())")
    check(man['display'] == 'standalone' and len(man['icons']) >= 3, 'manifesto válido (standalone + ícones)')
    for ic in man['icons']:
        r = pg.evaluate(f"fetch('{ic['src']}').then(r => r.status)")
        check(r == 200, 'ícone ' + ic['src'])
    chaves = pg.evaluate("caches.keys().then(ks => ks.length)")
    check(chaves >= 1, 'cache do service worker criado')
    pg.reload(); pg.wait_for_timeout(800)
    check(pg.evaluate('!!navigator.serviceWorker.controller'), 'página controlada pelo service worker')
    ctx.set_offline(True)
    pg.reload(); pg.wait_for_timeout(800)
    check(pg.title() == 'Shape Puzzle' and pg.evaluate('BUILTIN.length') == 50, 'abre offline com as 50 fases')
    pg.click('#btnJogar'); pg.wait_for_timeout(200)
    pg.evaluate("carregar({k:'b', i:1})"); jogar_arrastando(pg); pg.wait_for_selector('#ov-win.on', timeout=6000)
    check(True, 'dá para jogar e vencer offline')
    ctx.close()

    # iPhone: instrução de instalar
    ctx, pg = novo(b, user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
    pg.goto(URL); pg.click('#btnJogar'); pg.click('#btnMenu'); pg.wait_for_timeout(200)
    check(pg.is_visible('#dicaIOS'), 'iPhone: mostra como instalar (Compartilhar → Adicionar à Tela de Início)')
    pg.evaluate("document.querySelector('#ov-menu .card').scrollTo(0, 99999)"); pg.wait_for_timeout(150)
    pg.screenshot(path=SC + 'v2-11-menu-fim.png')
    ctx.close()
    b.close()

print()
print('ERROS DE CONSOLE:', erros if erros else 'nenhum')
print('RESULTADO:', 'TUDO OK' if not falhas and not erros else 'FALHAS: ' + '; '.join(falhas))
sys.exit(0 if not falhas and not erros else 1)
