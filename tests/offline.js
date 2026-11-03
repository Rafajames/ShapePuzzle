// Campeonato sem internet: código, validação, junção de resultados, ranking e estatísticas.
const fs=require('fs');const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const logic=html.split('// ==LOGIC-START==')[1].split('// ==LOGIC-END==')[0];
const L=new Function('btoa','atob','escape','unescape',logic+';return {perfilJogador,limparOff,codigoOff,lerCodigoOff,juntarOff,rankOff,estatOff,defOff};')(
  s=>Buffer.from(s,'binary').toString('base64'),s=>Buffer.from(s,'base64').toString('binary'),escape,unescape);
let ok=true;const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b)){ok=false;console.log('FALHA',m,JSON.stringify(a),'!=',JSON.stringify(b));}};
const base={v:1,i:'ABC234',n:'Copa da Família',f:[['b',2],['g','facil',123456],['g','dificil',999]],j:['Rafa','Maria','João'],r:{}};
const v=limparOff(base,50);eq(!!v.pacote,true,'pacote válido');
const p=v.pacote;
// ida e volta (com acento)
const cod=codigoOff(p);eq(/^SPO1\.[A-Za-z0-9_-]+\.[0-9a-f]{8}$/.test(cod),true,'formato do código');
const l=lerCodigoOff(cod,50);eq(l.pacote,p,'ida e volta');eq(l.eu,null,'sem eu');
eq(lerCodigoOff('https://x.github.io/ShapePuzzle/#o='+cod+'&eu=2',50).eu,2,'eu no link');
eq(lerCodigoOff('#o='+cod+'&eu=7',50).eu,null,'eu fora do intervalo');
eq(lerCodigoOff('veja: '+cod.slice(0,20)+'\n'+cod.slice(20)+' ok',50).pacote.i,'ABC234','código quebrado em linhas');
function lerCodigoOff(t,n){return L.lerCodigoOff(t,n);}function limparOff(a,b){return L.limparOff(a,b);}function codigoOff(a){return L.codigoOff(a);}
// erros
eq(typeof lerCodigoOff('',50).erro,'string','vazio');eq(typeof lerCodigoOff('abc',50).erro,'string','lixo');
eq(typeof lerCodigoOff(cod.slice(0,-12)+'AAAA.'+cod.split('.')[2],50).erro,'string','adulterado');
eq(typeof lerCodigoOff(cod.slice(0,cod.length-15),50).erro,'string','cortado');
// validação
const ruim=(o,m)=>eq(typeof limparOff(Object.assign({},base,o),50).erro,'string',m);
ruim({v:2},'versão');ruim({i:'abc'},'código do campeonato');ruim({n:'x'},'nome curto');ruim({j:['Rafa']},'1 jogador');
ruim({j:Array.from({length:13},(_,i)=>'Jogador'+i)},'13 jogadores');ruim({j:['Rafa','rafa']},'nomes repetidos');
ruim({f:[]},'sem fases');ruim({f:Array.from({length:9},()=>['b',1])},'9 fases');ruim({f:[['b',99]]},'fase fora do jogo');
ruim({f:[['g','mestre',5]]},'nível não permitido');ruim({f:[['g','facil',0]]},'semente inválida');ruim({f:[['x',1]]},'tipo');
// resultados: lixo é limpo
const r1=limparOff(Object.assign({},base,{r:{0:[[60000,10],[1e12,5],null],9:[[1,1]],x:1,1:[[0,3],[-5,2],'a']}}),50).pacote.r;
eq(r1,{0:[[60000,10],[864e5,5],null]},'resultados limpos (índice inválido, zero e negativos saem)');
// junção
const a=limparOff(Object.assign({},base,{r:{0:[[60000,10],null,null]}}),50).pacote;
const b=limparOff(Object.assign({},base,{r:{0:[[50000,12],[70000,9],null],1:[[80000,11],null,null]}}),50).pacote;
const m=L.juntarOff(a,b);eq(m.r[0],[[50000,12],[70000,9],null],'junta: fica o menor tempo');eq(m.r[1],[[80000,11],null,null],'junta: jogador novo');
eq(L.juntarOff(a,Object.assign({},b,{i:'ZZZ999'})),null,'outro campeonato');
eq(L.juntarOff(a,Object.assign({},b,{f:[['b',3]]})),null,'mesmas fases são exigidas');
eq(a.r[0][0],[60000,10],'não altera o original');
// ranking
const t=limparOff(Object.assign({},base,{r:{
  0:[[60000,10],[50000,9],[70000,12]],          // Rafa: tudo, 180000
  1:[[50000,10],[50000,9],[80000,12]],          // Maria: tudo, 180000, mesmas jogadas -> empate
  2:[[40000,5],null,null]}}),50).pacote;        // João: 1 fase
const rk=L.rankOff(t);
eq(rk.map(x=>x.nome),['Rafa','Maria','João'],'ordem (empate mantém a ordem dos nomes)');
eq(rk.map(x=>x.pos),[1,1,3],'empate divide a posição');eq(rk.map(x=>x.completo),[true,true,false],'quem terminou');
const t2=limparOff(Object.assign({},t,{r:{0:[[60000,10],[50000,9],[70000,12]],1:[[50000,10],[50000,9],[70000,11]]}}),50).pacote;
eq(L.rankOff(t2).map(x=>x.nome),['Maria','Rafa','João'],'menos jogadas desempata');eq(L.rankOff(t2).map(x=>x.pos),[1,2,0],'sem resultado: posição 0');
// uma fase só, rápida, não vence quem terminou tudo
const t3=limparOff(Object.assign({},t,{r:{0:[[60000,10],[50000,9],[70000,12]],2:[[1000,1],null,null]}}),50).pacote;
eq(L.rankOff(t3)[0].nome,'Rafa','quem terminou todas vem antes de quem fez só uma');
// estatísticas
const e=L.estatOff(t);
eq([e.jogadores,e.terminaram,e.comResultado,e.tempoTotal,e.jogadasTotal],[3,2,3,180000*2+40000,10+9+12+10+9+12+5],'totais');
eq(e.porFase[0].melhor.nome,'João','melhor da fase 1');eq(e.porFase[0].n,3,'3 resultados na fase 1');eq(e.porFase[0].media,Math.round((60000+50000+40000)/3),'média da fase 1');
eq(e.maisRapida.i,0,'fase mais rápida (menor média)');eq(e.maisDificil.i,2,'fase mais demorada');
eq(L.estatOff(a).maisDificil,null,'uma fase só com resultado: sem "mais difícil"');
// perfil de um jogador (usado também pelo campeonato online)
const todos=[0,1,2].map(i=>t.r[i]||[]);
const pr=L.perfilJogador(todos,0,3);
eq([pr.feitas,pr.total,pr.tempo,pr.jog,pr.medio,pr.melhores],[3,3,180000,31,60000,2],'perfil de Rafa');
eq(pr.fases.map(f=>[f.pos,f.n,f.melhor]),[[3,3,40000],[1,2,50000],[1,2,70000]],'posição em cada fase (empate fica com a mesma posição)');
eq(L.perfilJogador(todos,2,3).fases[1],{r:null,n:2,melhor:50000,media:50000,pos:0},'fase não jogada');
eq(L.perfilJogador([[]],0,2).feitas,0,'sem resultados');
// tamanho do convite (tem que caber num QR)
const grande=limparOff({v:1,i:'ABC234',n:'Campeonato bem grande do escritório',f:Array.from({length:8},(_,i)=>['g','dificil',900000000+i]),j:Array.from({length:12},(_,i)=>'Jogador numero '+i),r:{}},50).pacote;
console.log('convite máximo:',codigoOff(grande).length,'caracteres');if(codigoOff(grande).length>1000){ok=false;console.log('FALHA convite grande demais');}
const cheio=Object.assign({},grande,{r:Object.fromEntries(grande.j.map((_,i)=>[i,grande.f.map(()=>[123456,45])]))});
console.log('ranking final máximo:',codigoOff(cheio).length,'caracteres');if(codigoOff(cheio).length>2500){ok=false;console.log('FALHA ranking cheio grande demais');}
console.log(ok?'OFFLINE: TUDO OK':'OFFLINE: COM FALHAS');process.exit(ok?0:1);
