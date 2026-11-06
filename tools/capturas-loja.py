# Gera as capturas de tela da Play Store (1080×1920) em cada idioma e a imagem de destaque (1024×500).
# Uso: python3 -m http.server 8765 --bind 127.0.0.1   (na raiz do repositório, em outro terminal)
#      python3 tools/capturas-loja.py [idiomas...]      (padrão: todos)
# Saída: docs/loja/capturas/<idioma>/1-tabuleiro.png … e docs/loja/capturas/<idioma>/destaque.png
import os, re, sys, json
from playwright.sync_api import sync_playwright
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'http://127.0.0.1:8765/index.html'
html = open(os.path.join(RAIZ, 'index.html'), encoding='utf8').read()
DISPONIVEIS = ['pt'] + re.findall(r'^"([a-z]{2}(?:-[A-Z]{2})?)": \[', html.split('/*DICT-START*/')[1].split('/*DICT-END*/')[0], re.M)
SO_DESTAQUE = '--destaque' in sys.argv
langs = [a for a in sys.argv[1:] if not a.startswith('--')] or DISPONIVEIS
NOMES = ['Luna', 'Kenji', 'Sofia', 'Mateo', 'Aiko', 'Noah', 'Lea', 'Ravi', 'Emma', 'Yuki', 'Hugo', 'Mila', 'Ivan', 'Zoe', 'Omar', 'Nina', 'Theo', 'Sara', 'Leo', 'Ines']
PUB = {('u%02d' % i): {'nome': n, 'av': ['a7', 'a1', 'p3', 'a11', 'p8', 'a5', 'p23', 'a3', 'p10', 'a8'][i % 10], 'mold': ['galaxia', 'neon', 'ouro', '', 'cristal', 'madeira', 'lava', ''][i % 8],
        'fun': ['cosmos', '', 'aurora', 'estrelas', '', 'ceu'][i % 6], 'n': 140 - i * 6, 'ts': i} for i, n in enumerate(NOMES)}
INICIO = """try{localStorage.setItem('shapepuzzle.tuto',JSON.stringify({sel:true,giro:true,esp:true,fim:true}));
localStorage.setItem('shapepuzzle.prog',JSON.stringify({max:24,done:[...Array(23).keys()]}));
localStorage.setItem('shapepuzzle.lang',JSON.stringify(%s));localStorage.setItem('shapepuzzle.tema',JSON.stringify(%s));
localStorage.setItem('shapepuzzle.perfil',JSON.stringify({nome:'Luna',av:'a7',mold:'galaxia',fun:'cosmos'}));
localStorage.setItem('shapepuzzle.cart',JSON.stringify({g:{'a:x':480},s:{'i:av:a7':0,'i:mold:galaxia':0,'i:fun:cosmos':0},v:[]}));
localStorage.setItem('shapepuzzle.som',JSON.stringify({on:false}));for(let f=1;f<=8;f++)localStorage.setItem('shapepuzzle.avFila'+f,'true');}catch(e){}"""
def banco(route, req):
    h = {'access-control-allow-origin': '*'}
    if '/pub.json' in req.url: return route.fulfill(status=200, headers=h, body=json.dumps(PUB), content_type='application/json')
    route.fulfill(status=200, headers=h, body='null', content_type='application/json')
def pagina(b, l, tema='madeira'):
    c = b.new_context(viewport={'width': 360, 'height': 640}, device_scale_factor=3, locale=l)
    c.route(re.compile(r'https://.*\.firebaseio\.com/.*'), banco)
    c.add_init_script(INICIO % (json.dumps(l), json.dumps(tema)))
    p = c.new_page(); p.goto(URL); p.wait_for_timeout(700); return c, p
def meio_jogo(p, fase, n):
    p.evaluate("([f]) => { fecharTodos(); carregar({k:'b', i:f}); }", [fase]); p.wait_for_timeout(500)
    # encaixa as primeiras peças da solução, para a captura mostrar o jogo em andamento
    p.evaluate("""(n) => { const r = solucaoDe(S.jogo); if (r.tipo !== 'ok') return; r.passos.slice(0, n).forEach(q => { q.peca.formato = q.o; tentarColocar(q.peca, q.px, q.py); }); }""", n)
    p.wait_for_timeout(400); p.evaluate("document.querySelectorAll('#toast,.toast').forEach(t => { t.classList.remove('on'); t.hidden = true; })")
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for l in langs:
        out = os.path.join(RAIZ, 'docs', 'loja', 'capturas', l); os.makedirs(out, exist_ok=True)
        if not SO_DESTAQUE:
          c, p = pagina(b, l)
          meio_jogo(p, 14, 3); p.screenshot(path=os.path.join(out, '1-tabuleiro.png'))
          p.evaluate("fecharTodos(); abrir('splash'); renderInicio()"); p.wait_for_timeout(500); p.screenshot(path=os.path.join(out, '2-inicio.png'))
          p.evaluate("fecharTodos(); abrir('splash'); abrirRanking()"); p.wait_for_timeout(900); p.screenshot(path=os.path.join(out, '3-ranking.png'))
          p.evaluate("fecharTodos(); abrir('splash'); abrirConta(); document.querySelector('#cnSecAv').open = true"); p.wait_for_timeout(300)
          p.evaluate("document.querySelector('#cnSecAv').scrollIntoView({block:'start'})"); p.wait_for_timeout(200); p.screenshot(path=os.path.join(out, '4-avatares.png'))
          p.evaluate("abrirProvador('av:a10', nomeAvatar('a10'))"); p.wait_for_timeout(300); p.screenshot(path=os.path.join(out, '5-provador.png'))
          c.close()
          c, p = pagina(b, l, 'pixel'); meio_jogo(p, 20, 2); p.screenshot(path=os.path.join(out, '6-tema-pixel.png')); c.close()
          c, p = pagina(b, l, 'papel'); meio_jogo(p, 8, 2); p.screenshot(path=os.path.join(out, '7-tema-papel.png')); c.close()
        # imagem de destaque: título e frase curta da página da loja, sobre o tabuleiro
        md = os.path.join(RAIZ, 'docs', 'loja', ('pt-BR' if l == 'pt' else l) + '.md')
        partes = open(md, encoding='utf8').read().split('\n## ')[1:] if os.path.exists(md) else []
        titulo = partes[0].split('\n', 1)[1].strip() if partes else 'Shape Puzzle'
        frase = partes[1].split('\n', 1)[1].strip() if len(partes) > 1 else ''
        titulo = re.sub(r'\s*:\s*', ':<br>', titulo, count=1)   # "Shape Puzzle:" numa linha, o resto na outra
        c = b.new_context(viewport={'width': 1024, 'height': 500}); p = c.new_page()
        import base64; img = 'data:image/png;base64,' + base64.b64encode(open(os.path.join(out, '1-tabuleiro.png'), 'rb').read()).decode()
        p.set_content(f"""<html><body style="margin:0;width:1024px;height:500px;overflow:hidden;font-family:system-ui,'Segoe UI',Roboto,sans-serif;
          background:radial-gradient(120% 120% at 20% 10%,#5a3a1f,#24150b 70%);color:#fff3df;display:flex;align-items:center">
          <div style="flex:1;padding:0 40px 0 56px"><div style="font-size:52px;font-weight:800;line-height:1.08;hyphens:manual;overflow-wrap:normal;text-wrap:balance;text-shadow:0 3px 0 rgba(0,0,0,.35)">{titulo}</div>
          <div style="margin-top:18px;font-size:24px;line-height:1.35;color:#f3d9b0">{frase}</div></div>
          <img src="{img}" style="height:460px;margin-right:40px;border-radius:26px;box-shadow:0 20px 50px rgba(0,0,0,.55)">
          </body></html>"""); p.wait_for_timeout(300)
        p.screenshot(path=os.path.join(out, 'destaque.png')); c.close()
        print(l, 'ok')
    b.close()
