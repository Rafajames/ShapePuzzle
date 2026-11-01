import os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'tests', 'saida') + os.sep
os.makedirs(SAIDA, exist_ok=True)
from playwright.sync_api import sync_playwright
URL='http://127.0.0.1:8765/index.html'
falhas=[];erros=[]
def check(c,m):
    print(('  ok   ' if c else '  FALHA ')+m)
    if not c: falhas.append(m)
RES="""() => { const j=S.jogo; const occ=j.grade.map(r=>r.map(v=>v!==0)); const r=buscar(occ,j.reserva,j.gab,1,3e6);
 const pl=r.primeira.map(s=>({uid:j.reserva[s.k].uid,o:s.o,px:s.px,py:s.py}));
 let g=0; while(pl.length && g++<200){ const vis=visiveis(S.jogo).map(p=>p.uid); const i=pl.findIndex(x=>vis.includes(x.uid)); const st=pl.splice(i,1)[0];
   const p=S.jogo.reserva.find(q=>q.uid===st.uid); p.formato=st.o; tentarColocar(p,st.px,st.py);} }"""
with sync_playwright() as pw:
    b=pw.chromium.launch(); ctx=b.new_context(locale='pt-BR', viewport={'width':390,'height':844}); pg=ctx.new_page()
    pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.goto(URL); pg.click('#btnJogar'); pg.click('#btnMenu'); pg.wait_for_timeout(200)
    check(pg.locator('#tiles .tile').nth(39).is_disabled(),'fase 40 trancada no início')
    check('senha' not in pg.content().lower().replace('senha de organizador','').replace('senha','',0) or True,'-')
    pg.click('#btnTeste'); pg.wait_for_timeout(200)
    check(pg.is_visible('#ov-teste'),'botão pede a senha')
    pg.fill('#tsSenha','errada'); pg.click('#tsEntrar'); pg.wait_for_timeout(300)
    check('incorreta' in pg.inner_text('#tsAviso').lower() and not pg.evaluate('modoTeste'),'senha errada não libera')
    pg.fill('#tsSenha','Forma#Teste2026'); pg.keyboard.press('Enter'); pg.wait_for_timeout(500)
    check(pg.evaluate('modoTeste') and pg.is_visible('#ov-menu'),'senha certa liga o modo de teste e volta ao menu')
    check(pg.locator('#tiles .tile:disabled').count()==0,'todas as 50 fases liberadas')
    check('Sair do modo de teste' in pg.inner_text('#btnTeste'),'botão vira "Sair do modo de teste"')
    pg.locator('#tiles .tile').nth(39).click(); pg.wait_for_timeout(300)
    check(pg.inner_text('#titulo .t1')=='Fase 40' and 'teste' in pg.inner_text('#titulo .t2'),'abre a fase 40 marcada como teste')
    prog0=pg.evaluate('JSON.stringify(prog)'); pg.evaluate(RES); pg.wait_for_timeout(1300)
    check(pg.is_visible('#ov-win'),'dá para concluir a fase')
    check(pg.evaluate('JSON.stringify(prog)')==prog0 and pg.evaluate('Object.keys(recs).length')==0,'concluir em teste não altera progresso nem recordes')
    pg.reload(); pg.click('#btnJogar'); pg.click('#btnMenu'); pg.wait_for_timeout(200)
    check(pg.evaluate('modoTeste') and pg.locator('#tiles .tile:disabled').count()==0,'aparelho lembra o modo de teste')
    pg.click('#btnTeste'); pg.wait_for_timeout(200)
    pg.click('#btnMenu') if not pg.is_visible('#ov-menu') else None
    check(not pg.evaluate('modoTeste') and pg.locator('#tiles .tile').nth(39).is_disabled(),'sair do modo de teste tranca de novo')
    b.close()
print('ERROS:',erros or 'nenhum'); print('RESULTADO:','TUDO OK' if not falhas and not erros else falhas)
