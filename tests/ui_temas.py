# Temas do jogo: troca no menu, salvo no aparelho, automático segue o aparelho, contraste legível e peças com as mesmas cores.
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
TEMAS = ['escuro', 'claro', 'oceano', 'floresta', 'poente']
def rgb(c):
    c = c.strip()
    if c.startswith('#'):
        c = c[1:]
        if len(c) == 3: c = ''.join(x*2 for x in c)
        return tuple(int(c[i:i+2], 16) for i in (0, 2, 4))
    m = re.findall(r'[\d.]+', c); return tuple(float(x) for x in m[:3])
def lum(c):
    f = lambda v: (v/255)/12.92 if v/255 <= .03928 else (((v/255)+.055)/1.055)**2.4
    r, g, b = [f(x) for x in c]; return .2126*r + .7152*g + .0722*b
def contraste(a, b):
    la, lb = sorted([lum(rgb(a)), lum(rgb(b))], reverse=True); return (la + .05)/(lb + .05)
VARS = "(()=>{const s=getComputedStyle(document.documentElement); const g=n=>s.getPropertyValue(n).trim(); return Object.fromEntries(['--bg','--bg2','--txt','--mut','--soft','--card1','--card2','--cel1','--board','--accent','--acc2','--onacc','--gold','--ok','--bad','--info','--acctxt'].map(n=>[n,g(n)]));})()"
with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(locale='pt-BR', viewport={'width': 1100, 'height': 800})
    ctx.add_init_script("try{" + FIM + "}catch(e){}")
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(300)

    print('Padrão e menu')
    check(pg.evaluate("document.documentElement.dataset.tema") == 'escuro', 'quem não escolheu nada continua com o tema escuro de sempre')
    pg.click('#btnMenu'); pg.wait_for_timeout(200)
    ops = pg.evaluate("[...document.querySelectorAll('#selTema option')].map(o=>o.value)")
    check(ops == ['auto', 'escuro', 'claro', 'oceano', 'floresta', 'poente'], f'seletor com os 6 temas: {ops}')
    check(pg.is_visible('#selTema'), 'seletor aparece no menu')
    check(pg.evaluate("document.querySelector('#selTema').closest('label').textContent.includes('Tema')"), 'rótulo "Tema"')

    print('Trocar de tema')
    fundos = {}
    for t in TEMAS[1:] + ['escuro']:
        pg.select_option('#selTema', t); pg.wait_for_timeout(150)
        check(pg.evaluate("document.documentElement.dataset.tema") == t, f'{t}: aplicado')
        fundos[t] = pg.evaluate("getComputedStyle(document.body).backgroundColor") + '|' + pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg')")
        check(pg.evaluate("document.querySelector('meta[name=theme-color]').content") != '', f'{t}: cor da barra do navegador definida')
    check(len(set(fundos.values())) >= 5, 'cada tema tem um fundo diferente')
    pg.select_option('#selTema', 'oceano'); pg.wait_for_timeout(150)
    check(pg.evaluate("JSON.parse(localStorage.getItem('shapepuzzle.tema'))") == 'oceano', 'escolha salva no aparelho')
    pg.reload(); pg.wait_for_timeout(300)
    check(pg.evaluate("document.documentElement.dataset.tema") == 'oceano', 'depois de recarregar continua no tema escolhido')
    check(pg.evaluate("document.querySelector('meta[name=theme-color]').content") == '#06161f', 'cor da barra do navegador acompanha o tema')
    pg.click('#btnJogar'); pg.click('#btnMenu'); pg.wait_for_timeout(200)
    check(pg.evaluate("document.querySelector('#selTema').value") == 'oceano', 'o menu mostra o tema atual')

    print('As cores das peças não mudam')
    pg.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))")
    pg.evaluate("carregar({k:'b',i:0})"); pg.wait_for_timeout(200)
    def cores(): return pg.evaluate("[...document.querySelectorAll('#reserva .pc:not(.e)')].map(e=>e.style.getPropertyValue('--c'))")
    c0 = cores()
    pg.evaluate("(()=>{const e=document.querySelector('#selTema'); e.value='claro'; e.dispatchEvent(new Event('change'))})()"); pg.wait_for_timeout(150)
    check(len(c0) > 5 and cores() == c0, 'peças têm as mesmas cores no tema claro')
    pg.evaluate("(()=>{const e=document.querySelector('#selTema'); e.value='escuro'; e.dispatchEvent(new Event('change'))})()")

    print('Automático segue o aparelho')
    pg.evaluate("(()=>{const e=document.querySelector('#selTema'); e.value='auto'; e.dispatchEvent(new Event('change'))})()"); pg.wait_for_timeout(150)
    pg.emulate_media(color_scheme='light'); pg.wait_for_timeout(200)
    check(pg.evaluate("document.documentElement.dataset.tema") == 'claro', 'aparelho em modo claro → tema claro')
    pg.emulate_media(color_scheme='dark'); pg.wait_for_timeout(200)
    check(pg.evaluate("document.documentElement.dataset.tema") == 'escuro', 'aparelho muda para escuro → o jogo acompanha na hora')
    pg.emulate_media(color_scheme='light'); pg.reload(); pg.wait_for_timeout(300)
    check(pg.evaluate("document.documentElement.dataset.tema") == 'claro', 'automático também vale ao abrir o jogo')
    pg.emulate_media(color_scheme='dark')

    print('Alto contraste manda no tema')
    pg.click('#btnJogar'); pg.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))")
    pg.evaluate("(()=>{const e=document.querySelector('#selTema'); e.value='claro'; e.dispatchEvent(new Event('change'))})()")
    pg.evaluate("salvarA11y('cont', true)"); pg.wait_for_timeout(150)
    check(pg.evaluate("document.documentElement.dataset.tema") == 'escuro', 'com alto contraste ligado usa o escuro')
    pg.evaluate("abrirMenu()"); pg.wait_for_timeout(200)
    check(pg.is_visible('#temaNota'), 'o menu avisa por quê')
    pg.evaluate("salvarA11y('cont', false)"); pg.wait_for_timeout(150)
    check(pg.evaluate("document.documentElement.dataset.tema") == 'claro', 'desligando, volta ao tema escolhido')
    pg.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))")

    print('Leitura: contraste dos textos em cada tema')
    for t in TEMAS:
        pg.evaluate(f"document.documentElement.dataset.tema='{t}'"); pg.wait_for_timeout(50)
        v = pg.evaluate(VARS)
        check(contraste(v['--txt'], v['--bg']) >= 7, f'{t}: texto principal no fundo ({contraste(v["--txt"], v["--bg"]):.1f})')
        check(contraste(v['--mut'], v['--bg']) >= 4.5, f'{t}: texto apagado no fundo ({contraste(v["--mut"], v["--bg"]):.1f})')
        check(contraste(v['--mut'], v['--card2']) >= 4.5, f'{t}: texto apagado no cartão ({contraste(v["--mut"], v["--card2"]):.1f})')
        check(contraste(v['--soft'], v['--card1']) >= 7, f'{t}: texto suave no cartão ({contraste(v["--soft"], v["--card1"]):.1f})')
        for n in ['--gold', '--ok', '--bad', '--info', '--acctxt']:
            check(contraste(v[n], v['--card2']) >= 4.5, f'{t}: {n} legível no cartão ({contraste(v[n], v["--card2"]):.1f})')
        minimo = 3.0 if t == 'escuro' else 4.5   # o escuro já era assim (botão branco no roxo)
        check(min(contraste(v['--onacc'], v['--accent']), contraste(v['--onacc'], v['--acc2'])) >= minimo, f'{t}: texto dos botões principais ({min(contraste(v["--onacc"], v["--accent"]), contraste(v["--onacc"], v["--acc2"])):.1f})')
    pg.evaluate("document.documentElement.dataset.tema='oceano'")

    print('Telas no tema claro (sem sobra de cor escura)')
    pg.evaluate("document.documentElement.dataset.tema='claro'")
    clar = pg.evaluate("""(()=>{const ruins=[]; const lumi=c=>{const m=c.match(/[\\d.]+/g).map(Number); return m.length>3 && m[3]<.3 ? 255 : (m[0]*.299+m[1]*.587+m[2]*.114)};
      for (const sel of ['body','.card','#board','.cell','.reserva','.pill','.btn','.ib']){ const e=document.querySelector(sel); if(!e) continue;
        const bg=getComputedStyle(e).backgroundColor; if(bg && bg!=='rgba(0, 0, 0, 0)' && lumi(bg)<110) ruins.push(sel+' '+bg);} return ruins;})()""")
    check(not clar, f'nenhum fundo escuro sobrando no tema claro: {clar}')
    b.close()
print('erros de página:', erros)
if erros: falhas.append('erros de página')
print('TUDO OK' if not falhas else 'FALHAS: ' + str(falhas)); sys.exit(1 if falhas else 0)
