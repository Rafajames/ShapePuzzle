import os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'tests', 'saida') + os.sep
os.makedirs(SAIDA, exist_ok=True)
import re, sys, json
from playwright.sync_api import sync_playwright
SC = SAIDA + ''
URL = 'http://127.0.0.1:8765/index.html'
erros, falhas = [], []
def check(c, m):
    print(('  ok   ' if c else '  FALHA ') + m)
    if not c: falhas.append(m)
def novo(b, w=390, h=844, init=None):
    ctx = b.new_context(locale='pt-BR', viewport={'width': w, 'height': h}, device_scale_factor=2)
    if init: ctx.add_init_script(init)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: erros.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: erros.append('console.' + m.type + ': ' + m.text) if m.type == 'error' else None)
    return ctx, pg
def abrir_fase(pg, i):
    pg.evaluate(f"carregar({{k:'b', i:{i}}})"); pg.wait_for_timeout(200)
def n_visiveis(pg): return pg.locator('.pw').count()
DICA = "() => { const d = dicaDe(S.jogo); if (d.tipo !== 'ok') return {tipo: d.tipo}; return {tipo: 'ok', uid: d.peca.uid, o: d.o, px: d.px, py: d.py}; }"
def colocar_por_arrasto(pg, d):
    pg.evaluate("(d) => { const p = S.jogo.reserva.find(q => q.uid === d.uid); p.formato = d.o; renderReserva(); }", d)
    cell = pg.evaluate('S.cell'); box = pg.locator(f'.pw[data-uid="{d["uid"]}"]').bounding_box(); bb = pg.locator('#board').bounding_box()
    h, w = len(d['o']), len(d['o'][0])
    tx, ty = bb['x'] + (d['px'] + w / 2) * cell, bb['y'] + (d['py'] + h / 2) * cell
    pg.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2); pg.mouse.down()
    pg.mouse.move(tx - 20, ty - 20, steps=5); pg.mouse.move(tx, ty, steps=4); pg.mouse.up(); pg.wait_for_timeout(70)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])

    print('1. Progresso antigo (30 fases feitas) libera a fase 31')
    prog_antigo = json.dumps({'max': 29, 'done': list(range(30))})
    ctx, pg = novo(b, init=f"try{{ if(!localStorage.getItem('shapepuzzle.prog')) localStorage.setItem('shapepuzzle.prog', JSON.stringify({prog_antigo})); }}catch(e){{}}")
    pg.goto(URL); pg.wait_for_timeout(400)
    check(pg.evaluate('prog.max') == 30, 'prog.max sobe de 29 para 30 (fase 31 liberada)')
    check(pg.evaluate('BUILTIN.length') == 50, '50 fases')
    pg.click('#btnJogar'); pg.click('#btnMenu'); pg.wait_for_timeout(200)
    check(pg.locator('#tiles .tile').count() == 50, 'menu tem 50 quadradinhos')
    check(not pg.locator('#tiles .tile').nth(30).is_disabled(), 'quadradinho 31 clicável')
    check(pg.locator('#tiles .tile').nth(31).is_disabled(), 'quadradinho 32 ainda trancado')
    check('6×6 e 7×7' in pg.inner_text('#ov-menu'), 'legenda explica tabuleiro maior e fila')
    pg.screenshot(path=SC + 'v3-01-menu.png')
    pg.locator('#tiles .tile').nth(30).click(); pg.wait_for_timeout(300)
    check(pg.evaluate('S.n') == 6 and pg.locator('#board .cell').count() == 36, 'fase 31: tabuleiro 6×6 (36 casas)')
    check(n_visiveis(pg) == 3, 'fase 31: 3 peças por vez (padrão do nível)')
    check(pg.inner_text('#titulo .t2') == '6×6', 'subtítulo mostra 6×6')
    pg.screenshot(path=SC + 'v3-02-fase31.png')
    check(pg.evaluate("document.documentElement.scrollWidth") <= 390, 'fase 31 sem rolagem horizontal')
    ctx.close()

    print('2. Fila de 3 (fase 36, 6×6)')
    ctx, pg = novo(b); pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(200)
    abrir_fase(pg, 35)
    check(n_visiveis(pg) == 3, 'só 3 peças aparecem')
    check('11 restantes' in pg.inner_text('#contagem').lower(), 'contador: ' + pg.inner_text('#contagem'))
    check(pg.evaluate("document.querySelector('#toast').classList.contains('on')") and 'fila' in pg.inner_text('#toast').lower(), 'aviso explica a fila: ' + pg.inner_text('#toast')[:60])
    ids_antes = pg.evaluate("[...document.querySelectorAll('.pw')].map(w => +w.dataset.uid)")
    d = pg.evaluate(DICA); colocar_por_arrasto(pg, d)
    ids_dep = pg.evaluate("[...document.querySelectorAll('.pw')].map(w => +w.dataset.uid)")
    check(pg.evaluate('S.jog') == 1 and n_visiveis(pg) == 3, 'após encaixar, a próxima da fila entra (continuam 3)')
    check(len(set(ids_dep) - set(ids_antes)) == 1, 'entrou exatamente 1 peça nova')
    check('10 restantes' in pg.inner_text('#contagem').lower(), 'contador avança: ' + pg.inner_text('#contagem'))
    pg.screenshot(path=SC + 'v3-03-fila3.png')
    # aviso só uma vez por modo
    pg.evaluate("document.querySelector('#toast').classList.remove('on')")
    abrir_fase(pg, 36)
    check(not pg.evaluate("document.querySelector('#toast').classList.contains('on')"), 'aviso não repete na fase seguinte com mesma fila')
    ctx.close()

    print('3. Uma peça por vez (fase 40) — jogar inteira e testar devolução à frente')
    ctx, pg = novo(b); pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(200)
    abrir_fase(pg, 39)
    check(n_visiveis(pg) == 1, 'só 1 peça aparece')
    check(pg.evaluate('!!S.sel') and pg.is_enabled('#btnGirar'), 'a peça da vez já vem selecionada')
    uid1 = pg.evaluate("+document.querySelector('.pw').dataset.uid")
    d = pg.evaluate(DICA); colocar_por_arrasto(pg, d)
    uid2 = pg.evaluate("+document.querySelector('.pw').dataset.uid")
    check(uid2 != uid1 and n_visiveis(pg) == 1, 'depois de encaixar aparece a próxima')
    # tira a primeira de volta: ela deve ficar na frente
    bb = pg.locator('#board').bounding_box(); cell = pg.evaluate('S.cell')
    gx, gy = d['px'], d['py']
    pg.mouse.move(bb['x'] + (gx + .5) * cell, bb['y'] + (gy + .5) * cell); pg.mouse.down(); pg.mouse.up(); pg.wait_for_timeout(120)
    uid3 = pg.evaluate("+document.querySelector('.pw').dataset.uid")
    check(uid3 == uid1 and n_visiveis(pg) == 1, 'peça tirada do tabuleiro volta para a frente da fila')
    colocar_por_arrasto(pg, d)  # recoloca no mesmo lugar
    check(pg.evaluate('S.jog') == 2, 'recolocar funciona')
    guard = 0
    while not pg.evaluate('S.venceu') and guard < 30:
        guard += 1
        d = pg.evaluate(DICA)
        if d['tipo'] != 'ok': check(False, 'dica falhou: ' + d['tipo']); break
        colocar_por_arrasto(pg, d)
    pg.wait_for_selector('#ov-win.on', timeout=8000)
    check(pg.evaluate('S.venceu'), f'fase 40 concluída ({pg.evaluate("S.jog")} jogadas)')
    check(pg.evaluate('prog.max') >= 40, 'fase 41 liberada')
    ctx.close()

    print('4. 7×7 e telas pequenas')
    for w in (390, 360, 320):
        ctx, pg = novo(b, w=w, h=740); pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(200)
        for idx in (40, 49):
            abrir_fase(pg, idx)
            bb = pg.locator('#board').bounding_box()
            ok = bb['x'] >= 0 and bb['x'] + bb['width'] <= w and pg.evaluate("document.documentElement.scrollWidth") <= w
            check(ok, f'{w}px — fase {idx+1}: tabuleiro {pg.evaluate("S.n")}×{pg.evaluate("S.n")} cabe na largura (célula {pg.evaluate("S.cell")}px)')
        if w == 390:
            abrir_fase(pg, 49); pg.screenshot(path=SC + 'v3-04-fase50.png')
            abrir_fase(pg, 40); pg.screenshot(path=SC + 'v3-05-fase41.png')
        if w == 320:
            abrir_fase(pg, 49); pg.screenshot(path=SC + 'v3-06-fase50-320.png')
        ctx.close()

    print('5. Dica e girar/espelhar na fila de 1 (touch-friendly)')
    ctx, pg = novo(b); pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(200)
    abrir_fase(pg, 46)
    pg.click('#btnDica'); pg.wait_for_timeout(150)
    check(pg.locator('#board .cell.dica').count() > 0, 'dica destaca onde vai a peça da vez')
    pg.click('#btnGirar'); pg.click('#btnFlip'); pg.wait_for_timeout(60)
    check(n_visiveis(pg) == 1, 'girar/espelhar mantém uma peça visível')
    ctx.close()
    b.close()
print('\nERROS DE CONSOLE:', erros if erros else 'nenhum')
print('RESULTADO:', 'TUDO OK' if not falhas and not erros else 'FALHAS: ' + '; '.join(falhas))
sys.exit(0 if not falhas and not erros else 1)
