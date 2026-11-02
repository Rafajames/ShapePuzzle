/* ---- Campeonatos: lógica pura (testada em Node) ---- */
const ALFA_COD = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function novoCodigo(rnd = Math.random){ let c = ''; for (let i = 0; i < 6; i++) c += ALFA_COD[Math.floor(rnd() * ALFA_COD.length)]; return c; }
const codigoValido = c => /^[A-HJ-NP-Z2-9]{6}$/.test(c || '');
function limparNome(n){ return String(n || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20); }
function normalizarNome(n){ return String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/ /g, '_').slice(0, 24); }
const nomeValido = n => limparNome(n).length >= 2 && normalizarNome(limparNome(n)).length >= 2;
/* só aceita bancos Firebase: um link de convite nunca faz o jogo falar com outro site */
function dbValido(u){
  try{
    const x = new URL(String(u || '').trim());
    if (x.protocol !== 'https:' || x.username || x.password) return '';
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.(firebaseio\.com|firebasedatabase\.app)$/.test(x.hostname)) return '';
    return x.origin;
  }catch(e){ return ''; }
}
const MAX_FASES_CAMP = 10;
function montarCampeonato(o, agora){
  const nome = limparNome(String(o.nome || '').slice(0, 40)).slice(0, 40), org = limparNome(o.org);
  const max = parseInt(o.max, 10);
  if (nome.length < 2) return {erro: 'Dê um nome ao campeonato.'};
  if (!nomeValido(org)) return {erro: 'Informe o seu nome.'};
  if (!(max >= 2 && max <= 200)) return {erro: 'O número de pessoas deve ficar entre 2 e 200.'};
  if (o.modo !== 'melhor' && o.modo !== 'primeira') return {erro: 'Escolha como o resultado vale.'};
  if (typeof o.uid !== 'string' || !o.uid || o.uid.length > 64) return {erro: 'Entre como organizador para criar o campeonato.'};
  if (!o.fases || o.fases.length < 1) return {erro: 'Adicione pelo menos uma fase.'};
  if (o.fases.length > MAX_FASES_CAMP) return {erro: 'No máximo ' + MAX_FASES_CAMP + ' fases.'};
  for (const f of o.fases) if (!f || !faseValida(f.text) || f.text.length > 2000) return {erro: 'Uma das fases é inválida.'};
  const dias = parseInt(o.prazoDias, 10) || 0;
  return {camp: {nome, org, max, modo: o.modo, fim: dias > 0 ? agora + dias * 86400000 : 0, criado: agora, uid: o.uid,
    fases: o.fases.map((f, i) => ({nome: String(f.nome || 'Fase ' + (i + 1)).replace(/[<>]/g, '').slice(0, 30), text: f.text}))}};
}
const listaDe = x => !x ? [] : Array.isArray(x) ? x : Object.keys(x).sort((a, b) => a - b).map(k => x[k]);
function rankear(camp, jogadores){
  const N = listaDe(camp.fases).length;
  const lista = Object.keys(jogadores || {}).map(key => {
    const p = jogadores[key] || {}, f = p.f || {};
    let feitas = 0, tempo = 0, jog = 0;
    for (let i = 0; i < N; i++){ const r = f[i]; if (r && r.t > 0){ feitas++; tempo += r.t; jog += r.j || 0; } }
    return {key, nome: p.n || key, feitas, tempo, jog, ts: p.ts || 0, completo: feitas === N};
  });
  lista.sort((a, b) => b.feitas - a.feitas || a.tempo - b.tempo || a.jog - b.jog || a.ts - b.ts || (a.key < b.key ? -1 : 1));
  lista.forEach((r, i) => { const q = lista[i - 1]; r.pos = q && q.feitas === r.feitas && q.tempo === r.tempo && q.jog === r.jog ? q.pos : i + 1; });
  return lista;
}
const emailOrganizador = nome => normalizarNome(nome) + '@organizador.shapepuzzle.app';
const MSG_AUTH = {
  EMAIL_EXISTS: 'Esse nome de organizador já tem conta. Use a senha dele ou escolha outro nome.',
  INVALID_LOGIN_CREDENTIALS: 'Nome ou senha não conferem.', INVALID_PASSWORD: 'Nome ou senha não conferem.', EMAIL_NOT_FOUND: 'Nome ou senha não conferem.',
  WEAK_PASSWORD: 'A senha precisa ter pelo menos 6 caracteres.', TOO_MANY_ATTEMPTS_TRY_LATER: 'Muitas tentativas. Espere alguns minutos e tente de novo.',
  OPERATION_NOT_ALLOWED: 'O login por e-mail/senha não está ligado no Firebase (Authentication → Método de login → E-mail/senha).',
  API_KEY_INVALID: 'A chave do app web está errada.', INVALID_EMAIL: 'Esse nome não pode ser usado. Use letras e números.'
};
const msgAuth = cod => MSG_AUTH[String(cod || '').split(' ')[0]] || 'Não consegui entrar agora. Tente de novo.';
function lerConviteHash(hash, dbSalvo){
  const h = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const id = (h.get('c') || '').toUpperCase();
  if (!codigoValido(id)) return null;
  const db = dbValido(h.get('db')) || dbValido(dbSalvo);
  return db ? {id, db} : null;
}


