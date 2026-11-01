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
COLOCA = "(()=>{const r=dicaDe(S.jogo); if(r.tipo!=='ok') return false; r.peca.formato=r.o; return tentarColocar(r.peca,r.px,r.py);})()"
# palavras e letras que só existem em português (para achar texto que ficou sem tradução)
PT = re.compile(r"[ãõçê]|\b(peça|peças|fase|fases|tabuleiro|você|não|senha|prazo|ainda|aparelho|jogar|jogada|jogadas|dica|dicas|campeonato|campeonatos)\b", re.I)
IGNORA = {'Português'}
IGNORA_PREFIXO = ('https://', 'Agora aparecem')   # endereço de exemplo e avisos que já estavam na tela antes de trocar
def textos_visiveis(pg):
    return pg.evaluate("""() => {
      const out = [], vistos = new Set();
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n; (n = w.nextNode());){
        const t = n.data.trim(); const pe = n.parentElement;
        if (!t || /^(SCRIPT|STYLE)$/.test(pe.tagName) || pe.closest('#live,.sr')) continue;
        out.push(t);
      }
      document.querySelectorAll('[aria-label],[title],[placeholder]').forEach(e => ['aria-label','title','placeholder'].forEach(a => { const v = e.getAttribute(a); if (v) out.push(v); }));
      document.querySelectorAll('select option').forEach(o => out.push(o.textContent.trim()));
      return [...new Set(out)];
    }""")
def sobras(pg, rot):
    # lê o texto de TODOS os painéis (mesmo fechados): mostra-os só para a leitura
    ts = textos_visiveis(pg)
    ruins = sorted(set(t for t in ts if PT.search(re.sub(r'CAMPEONATOS\.md', '', t)) and t not in IGNORA and not t.startswith(IGNORA_PREFIXO)))
    check(not ruins, f'{rot}: nenhum texto em português sobrando' + ('' if not ruins else ' -> ' + ' | '.join(r[:70] for r in ruins[:12])))
with sync_playwright() as pw:
    b = pw.chromium.launch()
    print('Detecção do idioma do aparelho')
    for loc, esperado, titulo in [('pt-BR', 'pt', 'Jogar'), ('en-US', 'en', 'Play'), ('es-ES', 'es', 'Jugar')]:
        c = b.new_context(locale=loc, viewport={'width': 390, 'height': 844}); c.add_init_script("try{" + FIM + "}catch(e){}")
        p = c.new_page(); p.on('pageerror', lambda e: erros.append(str(e)))
        p.goto(URL); p.wait_for_timeout(300)
        check(p.evaluate('lang') == esperado and p.inner_text('#btnJogar').strip() == titulo and p.evaluate("document.documentElement.lang") in ('pt-BR', 'en', 'es'), f'{loc} abre em {esperado} (botão "{p.inner_text("#btnJogar").strip()}")')
        c.close()
    ctx = b.new_context(locale='pt-BR', viewport={'width': 1000, 'height': 800}); ctx.add_init_script("try{" + FIM + "}catch(e){}")
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.goto(URL); pg.click('#btnJogar'); pg.wait_for_timeout(300)
    pg.evaluate("carregar({k:'b',i:0})"); pg.wait_for_timeout(200)
    check(pg.inner_text('#titulo .t1') == 'Fase 1' and 'Girar' in pg.inner_text('#btnGirar'), 'português por padrão')
    for lg, nome in [('en', 'inglês'), ('es', 'espanhol')]:
        print('Trocar para ' + nome)
        pg.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on')); carregar({k:'b',i:0})"); pg.wait_for_timeout(200)
        pg.evaluate("abrirMenu()"); pg.wait_for_timeout(200)
        pg.select_option('#selIdioma', lg); pg.wait_for_timeout(300)
        t1 = pg.inner_text('#titulo .t1'); g = pg.inner_text('#btnGirar')
        esp = {'en': ('Level 1', 'Rotate', 'Levels', '0 moves'), 'es': ('Nivel 1', 'Girar', 'Niveles', '0 jugadas')}[lg]
        check(t1 == esp[0], f'título da fase: {t1}')
        check(esp[1] in g, f'botão: {g.strip()}')
        check(pg.inner_text('#ov-menu h1') == esp[2], 'título do menu: ' + pg.inner_text('#ov-menu h1'))
        check(pg.inner_text('#stJog') == esp[3], 'jogadas: ' + pg.inner_text('#stJog'))
        check(pg.evaluate("document.documentElement.lang") == lg, 'atributo lang da página')
        check(pg.evaluate("JSON.parse(localStorage.getItem('shapepuzzle.lang'))") == lg, 'escolha salva')
        check(pg.get_attribute('#btnDica', 'aria-label') == {'en': 'Hint (H)', 'es': 'Pista (H)'}[lg], 'rótulo do botão Dica')
        check(pg.evaluate("document.querySelector('#ajudaTeclado p').innerHTML.includes('<kbd>Enter</kbd>')") and 'Espaço' not in pg.inner_text('#ajudaTeclado p'), 'ajuda do teclado traduzida (HTML)')
        check(pg.evaluate("document.querySelector('.how li:nth-child(2) span').textContent") .count('(') >= 1 and 'Gire' not in pg.inner_text('.how li:nth-child(2) span'), 'passo 2 da abertura traduzido (HTML)')
        sobras(pg, 'telas fixas em ' + nome)
        pg.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))")
        # jogo: dica, jogadas, vitória
        pg.evaluate(COLOCA)
        check(re.search(r'1 (move|jugada)', pg.inner_text('#stJog')) is not None, 'contador singular: ' + pg.inner_text('#stJog'))
        pg.evaluate("S.sel=null; renderDica()")
        n = 0
        while not pg.evaluate("S.venceu") and n < 40:
            pg.evaluate(COLOCA); n += 1
        pg.wait_for_selector('#ov-win.on', timeout=5000); pg.wait_for_timeout(300)
        check(pg.inner_text('#winTitulo') == {'en': 'Level 1 complete!', 'es': '¡Nivel 1 completado!'}[lg], 'título da vitória: ' + pg.inner_text('#winTitulo'))
        sobras(pg, 'vitória em ' + nome)
        check(pg.evaluate("document.querySelector('#winEstrelas').getAttribute('aria-label')") in ('3 stars out of 3', '3 estrellas de 3'), 'estrelas para leitor de tela')
        pg.evaluate("document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'))")
        # frases com números e nomes (campeonato, avisos, compartilhar)
        casos = [
            "Fase 7 concluída!", "As 50 fases estão completas. Que tal criar as suas?",
            "Tente a fase \"Minha\" que eu criei no Shape Puzzle!", "Faltam 7 casas para preencher", "No máximo 10 fases.",
            "Agora aparecem 3 peças por vez.", "Fase \"x\" salva em Minhas fases", "Fase 3 de 5", "Peça 2 de 8", "5 restantes",
"4º", "1 estrela de 3", "2 estrelas de 3", "fila de 3", "de 50", 
        ]
        ruins = []
        for caso in casos:
            r = pg.evaluate("(s)=>tr(s)", caso)
            if (r == caso and caso not in ('de 50',) and not (lg == 'es' and caso in ('5 restantes', '4º'))) or PT.search(r.replace('Shape Puzzle', '')): ruins.append(f'{caso[:40]} -> {r[:40]}')
        check(not ruins, 'frases com números e nomes traduzidas' + ('' if not ruins else ': ' + ' | '.join(ruins)))
        sh = pg.evaluate("tr('Passei da fase {n} do Shape Puzzle em {tempo} ({jog})! Tenta aí:', {n: 4, tempo: '1:02', jog: '9'})")
        check('4' in sh and '1:02' in sh and '{' not in sh, 'modelos com valores: ' + sh)
    print('Voltar ao português')
    pg.evaluate("abrirMenu()"); pg.select_option('#selIdioma', 'pt'); pg.wait_for_timeout(300)
    check(pg.inner_text('#titulo .t1') == 'Fase 1' and 'Girar' in pg.inner_text('#btnGirar') and pg.inner_text('#ov-menu h1') == 'Fases', 'tudo de volta em português')
    sobras_pt = [t for t in textos_visiveis(pg) if re.search(r'\b(Level|Rotate|Nivel|Voltear)\b', t) and 'completa' not in t]   # o título da vitória só é refeito na próxima vitória
    check(not sobras_pt, 'nada em inglês/espanhol sobrando: ' + str(sobras_pt[:5]))
    # recarregar mantém a escolha
    pg.select_option('#selIdioma', 'en'); pg.wait_for_timeout(200); pg.reload(); pg.wait_for_timeout(300)
    check(pg.evaluate('lang') == 'en' and pg.inner_text('#btnJogar').strip() == 'Play', 'depois de recarregar continua em inglês')
    ctx.close(); b.close()
print('erros de página:', erros)
if erros: falhas.append('erros de página')
print('\nFALHAS:' if falhas else '\nTUDO OK', falhas if falhas else '')
sys.exit(1 if falhas else 0)
