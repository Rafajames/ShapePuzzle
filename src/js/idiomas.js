/* ======================= Idiomas =======================
   Os textos do jogo são escritos em português. Para os outros idiomas existe um dicionário (DICT, no bloco acima do jogo) com
   a frase em português como chave. Chaves com {nome} funcionam como modelo: tr('Fase 3') acha o modelo 'Fase {n}'. */
const IDIOMAS = {pt: 'Português', en: 'English', es: 'Español'};
const LANG_HTML = {pt: 'pt-BR', en: 'en', es: 'es'};
function idiomaDoAparelho(){ const l = String(navigator.language || 'pt').toLowerCase(); return l.startsWith('en') ? 'en' : l.startsWith('es') ? 'es' : 'pt'; }
let lang = store.get('lang', null); if (!IDIOMAS[lang]) lang = idiomaDoAparelho();
const LEX = {};
function lexico(l){
  if (LEX[l]) return LEX[l];
  const d = (window.DICT || {})[l] || {}, exato = new Map(), pad = [];
  for (const k in d){
    exato.set(k, d[k]);
    if (/\{\w+\}/.test(k)){
      const nomes = []; let re = '^', lit = 0;
      k.split(/\{(\w+)\}/).forEach((x, i) => { if (i % 2){ nomes.push(x); re += /^(n|a|b|max)$/.test(x) ? '(\\d+)' : '([\\s\\S]+?)'; } else { re += x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); lit += x.length; } });
      pad.push({re: new RegExp(re + '$'), nomes, v: d[k], lit});
    }
  }
  pad.sort((a, b) => b.lit - a.lit);
  return LEX[l] = {exato, pad};
}
/* tr(frase): traduz. tr(modelo, {a: 1}): troca {a} pelos valores (valores já traduzidos por quem chama). */
function tr(txt, par){
  if (txt === null || txt === undefined) return txt;
  let r = String(txt);
  if (lang !== 'pt'){
    const L = lexico(lang);
    if (L.exato.has(r)) r = L.exato.get(r);
    else if (!par) for (const e of L.pad){
      const m = e.re.exec(r);
      if (m){ r = e.v.replace(/\{(\w+)\}/g, (_, n) => { const i = e.nomes.indexOf(n); return i < 0 ? '' : m[i + 1]; }); break; }
    }
  }
  return par ? r.replace(/\{(\w+)\}/g, (_, n) => n in par ? par[n] : '{' + n + '}') : r;
}
/* HTML estático: guarda o texto original (em português) de cada nó para poder trocar de idioma a qualquer hora. */
const REG = {txt: [], atr: [], html: []};
function registrarI18n(){
  REG.html = [...document.querySelectorAll('[data-th]')].map(el => ({el, orig: el.innerHTML, shown: el.innerHTML}));
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {acceptNode: n => {
    const pe = n.parentElement;
    return !pe || /^(SCRIPT|STYLE)$/.test(pe.tagName) || pe.closest('[data-th]') || !n.data.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }});
  for (let n; (n = w.nextNode());){
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(n.data);
    REG.txt.push({n, lead: m[1], core: m[2], trail: m[3], orig: n.data, shown: n.data});
  }
  document.querySelectorAll('[aria-label],[title],[placeholder]').forEach(el => ['aria-label', 'title', 'placeholder'].forEach(a => {
    if (el.hasAttribute(a)) REG.atr.push({el, a, orig: el.getAttribute(a), shown: el.getAttribute(a)});
  }));
}
function aplicarIdioma(){
  document.documentElement.lang = LANG_HTML[lang];
  if (window.__pronto){ rotuloTabuleiro(); renderSelo(); if (S.jogo) renderBoard(); }
  if (window.__pronto){ renderAtualizacao(); msgAtualizacao(''); if (Upd.nova && !$('#upd').hidden) $('#updTxt').textContent = textoAvisoAtualizacao(); }
  REG.txt = REG.txt.filter(r => r.n.isConnected);
  for (const r of REG.txt){
    if (r.n.data !== r.shown && r.n.data !== r.orig) continue;      /* o jogo mudou esse texto sozinho: ele cuida da tradução */
    r.n.data = r.lead + tr(r.core) + r.trail; r.shown = r.n.data;
  }
  for (const r of REG.atr){
    const v = r.el.getAttribute(r.a); if (v !== r.shown && v !== r.orig) continue;
    r.el.setAttribute(r.a, tr(r.orig)); r.shown = r.el.getAttribute(r.a);
  }
  for (const r of REG.html){ if (r.el.innerHTML !== r.shown && r.el.innerHTML !== r.orig) continue; r.el.innerHTML = tr(r.orig); r.shown = r.el.innerHTML; }
}

