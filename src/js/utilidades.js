/* ======================= Utilidades ======================= */
const $ = s => document.querySelector(s);
/* mk('div', 'classe', 'texto'): cria um elemento. icBtn: botão só de ícone. fecharTodos: fecha os painéis abertos (menos o `poupar`). */
const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const icBtn = (icone, rotulo, fn, titulo) => { const b = mk('button', 'ib'); b.innerHTML = ic(icone); b.setAttribute('aria-label', rotulo); if (titulo) b.title = titulo; b.onclick = fn; return b; };
const fecharTodos = poupar => document.querySelectorAll('.ov.on').forEach(o => o.id !== poupar && o.classList.remove('on'));
const store = {
  get(k, d){ try{ const v = localStorage.getItem('shapepuzzle.' + k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem('shapepuzzle.' + k, JSON.stringify(v)); }catch(e){} }
};

