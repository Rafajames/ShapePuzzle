const fs=require('fs');const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const logic=html.split('// ==LOGIC-START==')[1].split('// ==LOGIC-END==')[0];
const L=new Function(logic+';return {novoCodigo,codigoValido,limparNome,normalizarNome,nomeValido,dbValido,montarCampeonato,rankear,lerConviteHash,gerarFase,listaDe,emailOrganizador,msgAuth};')();
let ok=true;const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b)){ok=false;console.log('FALHA',m,JSON.stringify(a),'!=',JSON.stringify(b));}};
// nomes
eq(L.normalizarNome('  João  da Silva '),'joao_da_silva','norm acento');
eq(L.normalizarNome('JOAO da silva'),'joao_da_silva','norm caixa');
eq(L.normalizarNome('a.b$c#d[e]/f'),'a_b_c_d_e_f','norm caracteres proibidos');
eq(L.nomeValido('A'),false,'nome curto');eq(L.nomeValido('!!'),false,'só símbolos');eq(L.nomeValido('Ana'),true,'nome ok');
eq(L.limparNome('<b>Ana</b>   Maria'),'bAna/b Maria','sem < >');
eq(L.limparNome('x'.repeat(50)).length,20,'limite 20');
// código
const seq=[0,.1,.5,.99,.3,.7];let i=0;eq(L.codigoValido(L.novoCodigo(()=>seq[i++%6])),true,'código válido');
for(let k=0;k<500;k++)if(!L.codigoValido(L.novoCodigo())){ok=false;console.log('código inválido');}
eq(L.codigoValido('ABC0DE'),false,'0 proibido');eq(L.codigoValido('abcdef'),false,'minúsculo');
// db
eq(L.dbValido('https://meu-jogo-default-rtdb.firebaseio.com/'),'https://meu-jogo-default-rtdb.firebaseio.com','db firebaseio');
eq(L.dbValido('https://x-default-rtdb.europe-west1.firebasedatabase.app/algo?x=1'),'https://x-default-rtdb.europe-west1.firebasedatabase.app','db app');
for(const u of ['http://x.firebaseio.com','https://evil.com','https://firebaseio.com.evil.com','https://x.firebaseio.com@evil.com','https://u:p@x.firebaseio.com','javascript:alert(1)','','lixo',null,'https://evilfirebaseio.com'])eq(L.dbValido(u),'','db rejeita '+u);
// convite
eq(L.lerConviteHash('#c=abcd23&db='+encodeURIComponent('https://x.firebaseio.com'),''),{id:'ABCD23',db:'https://x.firebaseio.com'},'convite');
eq(L.lerConviteHash('#c=ABCD23&db='+encodeURIComponent('https://evil.com'),''),null,'convite db inválido sem salvo');
eq(L.lerConviteHash('#c=ABCD23&db='+encodeURIComponent('https://evil.com'),'https://ok.firebaseio.com'),{id:'ABCD23',db:'https://ok.firebaseio.com'},'convite cai no db salvo');
eq(L.lerConviteHash('#c=ZZZ&db=x',''),null,'código curto');eq(L.lerConviteHash('#f=abc',''),null,'não é convite');
// montar
const fase=L.gerarFase(5,{n:5,minEstrelas:14});
const base={nome:'Copa',org:'Ana',max:10,modo:'melhor',prazoDias:3,uid:'uid123',fases:[{nome:'F1',text:fase.text}]};
const m=L.montarCampeonato(base,1000);eq(!!m.camp,true,'monta');eq(m.camp.uid,'uid123','uid vai no campeonato');eq(m.camp.fim,1000+3*86400000,'prazo');eq(L.montarCampeonato({...base,prazoDias:0},1000).camp.fim,0,'sem prazo');
for(const [k,v,msg] of [['nome','',' nome'],['org','','org'],['max',1,'max baixo'],['max',201,'max alto'],['modo','x','modo'],['fases',[],'sem fases'],['fases',Array(11).fill({nome:'a',text:fase.text}),'fases demais'],['fases',[{nome:'a',text:'lixo'}],'fase inválida'],['uid','','sem uid'],['uid',null,'uid nulo']])
  eq(!!L.montarCampeonato({...base,[k]:v},1).erro,true,'rejeita '+msg);
// ranking
const camp={fases:[{},{},{}]};
const J={ana:{n:'Ana',ts:1,f:{0:{t:5000,j:8},1:{t:6000,j:9},2:{t:7000,j:10}}},
 beto:{n:'Beto',ts:2,f:{0:{t:4000,j:8},1:{t:5000,j:9},2:{t:8000,j:10}}},
 caio:{n:'Caio',ts:3,f:{0:{t:1000,j:5}}},
 dani:{n:'Dani',ts:4,f:[{t:3000,j:7},{t:3000,j:7}]},
 edu:{n:'Edu',ts:5},
 fe:{n:'Fe',ts:6,f:{0:{t:5000,j:8},1:{t:6000,j:9},2:{t:7000,j:10}}}};
const R=L.rankear(camp,J);
eq(R.map(r=>r.nome),['Beto','Ana','Fe','Dani','Caio','Edu'],'ordem');
eq(R.map(r=>r.pos),[1,2,2,4,5,6],'posições com empate (Ana e Fe empatam)');
eq(R.map(r=>r.completo),[true,true,true,false,false,false],'completo');
eq(R[0].tempo,17000,'tempo total');
eq(L.rankear(camp,null),[],'sem jogadores');eq(L.rankear(camp,{x:{}})[0].feitas,0,'jogador sem dados');
eq(L.rankear({fases:{0:{},1:{}}},{a:{n:'A',f:{0:{t:1,j:1},1:{t:1,j:1}}}})[0].completo,true,'fases como objeto');
eq(L.rankear(camp,{a:{n:'A',f:{5:{t:1,j:1}}}})[0].feitas,0,'fase fora do intervalo ignorada');
eq(L.emailOrganizador('  João da Silva '),'joao_da_silva@organizador.shapepuzzle.app','e-mail sintético do organizador');
eq(L.msgAuth('EMAIL_EXISTS').includes('já tem conta'),true,'mensagem EMAIL_EXISTS');eq(L.msgAuth('WEAK_PASSWORD : Password should be at least 6 characters').includes('6'),true,'mensagem senha fraca');
console.log(ok?'LÓGICA DE CAMPEONATOS: TUDO OK':'COM FALHAS');process.exit(ok?0:1);
