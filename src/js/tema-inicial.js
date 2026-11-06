/* tema escolhido: aplicado antes de desenhar a tela para não piscar */
try{var __t=JSON.parse(localStorage.getItem('shapepuzzle.tema')),__c=JSON.parse(localStorage.getItem('shapepuzzle.a11y')||'{}');
if(__t==='auto')__t=matchMedia('(prefers-color-scheme: light)').matches?'claro':'escuro';
if(__c&&__c.cont)__t='escuro';
if(__t===null||__t===undefined)__t='madeira';
document.documentElement.setAttribute('data-tema',['claro','oceano','floresta','poente','retro','madeira','pixel','pedra','papel'].indexOf(__t)>=0?__t:'escuro');}catch(e){}
