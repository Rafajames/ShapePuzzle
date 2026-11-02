/* ======================= Utilidades ======================= */
const $ = s => document.querySelector(s);
const store = {
  get(k, d){ try{ const v = localStorage.getItem('shapepuzzle.' + k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem('shapepuzzle.' + k, JSON.stringify(v)); }catch(e){} }
};

