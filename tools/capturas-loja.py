# Gera as capturas de tela da Play Store (1080×1920) em cada idioma e a imagem de destaque (1024×500).
# Uso: python3 -m http.server 8765 --bind 127.0.0.1   (na raiz do repositório, em outro terminal)
#      python3 tools/capturas-loja.py [idiomas...]      (padrão: todos)
# Saída: docs/loja/capturas/<idioma>/1-tabuleiro.png …, as mesmas com legenda em docs/loja/capturas/<idioma>/legenda/
#        e docs/loja/capturas/<idioma>/destaque.png
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
# legendas das capturas da loja (uma frase curta por tela, no idioma da página)
TELAS = ['1-tabuleiro', '2-inicio', '3-ranking', '4-avatares', '5-provador', '6-tema-pixel', '7-tema-papel']
LEGENDAS = {
  'pt':    ['Encaixe as peças e preencha o tabuleiro', 'Fase do dia, desafio da semana e modo infinito', 'Suba no ranking e dispute campeonatos', 'Monte seu visual com avatares, molduras e fundos', 'Experimente antes de gastar suas estrelas', 'Temas que mudam o jogo inteiro', 'Fases novas sem parar, do fácil ao mestre'],
  'pt-PT': ['Encaixa as peças e preenche o tabuleiro', 'Nível do dia, desafio da semana e modo infinito', 'Sobe no ranking e disputa campeonatos', 'Cria o teu visual com avatares, molduras e fundos', 'Experimenta antes de gastar as tuas estrelas', 'Temas que mudam o jogo inteiro', 'Níveis novos sem parar, do fácil ao mestre'],
  'en':    ['Fit the pieces and fill the board', 'Daily level, weekly challenge and endless mode', 'Climb the ranking and join tournaments', 'Style your look with avatars, frames and backgrounds', 'Try it on before you spend your stars', 'Themes that change the whole game', 'Endless new levels, from easy to master'],
  'es':    ['Encaja las piezas y llena el tablero', 'Nivel del día, desafío semanal y modo infinito', 'Sube en el ranking y juega torneos', 'Crea tu estilo con avatares, marcos y fondos', 'Pruébatelo antes de gastar tus estrellas', 'Temas que cambian todo el juego', 'Niveles nuevos sin parar, de fácil a maestro'],
  'fr':    ['Place les pièces et remplis le plateau', 'Niveau du jour, défi de la semaine et mode infini', 'Grimpe au classement et joue des tournois', 'Crée ton style : avatars, cadres et fonds', 'Essaie avant de dépenser tes étoiles', 'Des thèmes qui changent tout le jeu', 'Des niveaux sans fin, du facile au maître'],
  'de':    ['Lege die Teile und fülle das Brett', 'Level des Tages, Wochen­challenge und Endlos­modus', 'Steig im Ranking auf und spiel Turniere', 'Gestalte deinen Look mit Avataren, Rahmen und Hinter­gründen', 'Erst anprobieren, dann Sterne ausgeben', 'Themen, die das ganze Spiel verändern', 'Endlos neue Level, von leicht bis Meister'],
  'it':    ['Incastra i pezzi e riempi il tabellone', 'Livello del giorno, sfida settimanale e modalità infinita', 'Scala la classifica e gioca i tornei', 'Crea il tuo stile con avatar, cornici e sfondi', 'Provalo prima di spendere le stelle', 'Temi che cambiano tutto il gioco', 'Livelli nuovi senza fine, da facile a maestro'],
  'nl':    ['Pas de stukken en vul het bord', 'Level van de dag, weekuitdaging en eindeloze modus', 'Klim in de ranglijst en speel toernooien', 'Maak je eigen look met avatars, lijsten en achtergronden', 'Pas het eerst, geef daarna je sterren uit', 'Thema’s die het hele spel veranderen', 'Eindeloos nieuwe levels, van makkelijk tot meester'],
  'pl':    ['Dopasuj elementy i wypełnij planszę', 'Poziom dnia, wyzwanie tygodnia i tryb bez końca', 'Awansuj w rankingu i graj w turniejach', 'Stwórz swój wygląd: awatary, ramki i tła', 'Przymierz, zanim wydasz gwiazdki', 'Motywy, które zmieniają całą grę', 'Bez końca nowe poziomy, od łatwych po mistrza'],
  'sv':    ['Lägg bitarna och fyll brädet', 'Dagens nivå, veckans utmaning och oändligt läge', 'Klättra på topplistan och spela turneringar', 'Skapa din stil med avatarer, ramar och bakgrunder', 'Prova innan du spenderar stjärnor', 'Teman som ändrar hela spelet', 'Oändligt med nya nivåer, från lätt till mästare'],
  'ru':    ['Размещай фигуры и заполняй поле', 'Уровень дня, испытание недели и бесконечный режим', 'Поднимайся в рейтинге и играй в турнирах', 'Создай свой облик: аватары, рамки и фоны', 'Примерь, прежде чем тратить звёзды', 'Темы, которые меняют всю игру', 'Бесконечно новые уровни — от лёгких до мастерских'],
  'uk':    ['Розміщуй фігури й заповнюй поле', 'Рівень дня, виклик тижня та режим без кінця', 'Піднімайся в рейтингу та грай у турнірах', 'Створи свій вигляд: аватари, рамки й тла', 'Приміряй, перш ніж витрачати зірки', 'Теми, що змінюють усю гру', 'Нескінченно нові рівні — від легких до майстерних'],
  'tr':    ['Parçaları yerleştir, tahtayı doldur', 'Günün seviyesi, haftanın görevi ve sonsuz mod', 'Sıralamada yüksel, turnuvalara katıl', 'Avatar, çerçeve ve arka planlarla tarzını oluştur', 'Yıldızlarını harcamadan önce dene', 'Tüm oyunu değiştiren temalar', 'Kolaydan ustaya, bitmeyen yeni seviyeler'],
}
def legendar(b, out, l):
    import base64
    os.makedirs(os.path.join(out, 'legenda'), exist_ok=True)
    c = b.new_context(viewport={'width': 1080, 'height': 1920}); p = c.new_page()
    for i, nome in enumerate(TELAS):
        arq = os.path.join(out, nome + '.png')
        if not os.path.exists(arq): continue
        img = 'data:image/png;base64,' + base64.b64encode(open(arq, 'rb').read()).decode()
        txt = LEGENDAS.get(l, LEGENDAS['en'])[i]
        p.set_content(f"""<html lang="{l}"><body style="margin:0;width:1080px;height:1920px;overflow:hidden;font-family:system-ui,'Segoe UI',Roboto,sans-serif;
          background:radial-gradient(130% 80% at 50% 0%,#6a4426,#24150b 75%);color:#fff3df;display:flex;flex-direction:column;align-items:center">
          <div style="height:380px;box-sizing:border-box;padding:70px 80px 0;display:flex;align-items:center;justify-content:center;text-align:center;
            font-size:76px;font-weight:800;line-height:1.1;text-wrap:balance;hyphens:manual;text-shadow:0 4px 0 rgba(0,0,0,.35)">{txt}</div>
          <img src="{img}" style="width:820px;height:1458px;margin-top:20px;border-radius:56px;border:10px solid #120a04;box-shadow:0 30px 80px rgba(0,0,0,.6)">
          </body></html>"""); p.wait_for_timeout(150)
        p.screenshot(path=os.path.join(out, 'legenda', nome + '.png'))
    c.close()
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
          p.evaluate("fecharTodos(); abrir('splash'); abrirConta('visual'); document.querySelector('#cnSecAv').open = true"); p.wait_for_timeout(300)
          p.evaluate("document.querySelector('#cnSecAv').scrollIntoView({block:'start'})"); p.wait_for_timeout(200); p.screenshot(path=os.path.join(out, '4-avatares.png'))
          p.evaluate("abrirProvador('av:a10', nomeAvatar('a10'))"); p.wait_for_timeout(300); p.screenshot(path=os.path.join(out, '5-provador.png'))
          c.close()
          c, p = pagina(b, l, 'pixel'); meio_jogo(p, 20, 2); p.screenshot(path=os.path.join(out, '6-tema-pixel.png')); c.close()
          c, p = pagina(b, l, 'papel'); meio_jogo(p, 8, 2); p.screenshot(path=os.path.join(out, '7-tema-papel.png')); c.close()
          legendar(b, out, l)
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
