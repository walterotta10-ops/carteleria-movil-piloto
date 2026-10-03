const CONFIG = {
  enforceCampaignDates: false,
  testMode: true,
  // El sitio estático existente usa este servicio para sincronizar celular ↔ escritorio.
  syncService: 'https://carteleria-movil-piloto-sync.onrender.com'
};

let DB = [];
let state = {
  token: localStorage.getItem('cid-token') || '',
  profile: readJSON(localStorage.getItem('cid-profile')),
  current: null,
  queue: [],
  view: 'loading',
  syncing: false
};

const app = document.getElementById('app');
const printArea = document.getElementById('printArea');

Promise.all([
  fetch('./data/products.json', { cache: 'no-store' }).then(r => r.json())
]).then(async ([j]) => {
  DB = j.products || [];
  if (state.token && state.profile) {
    const ok = await resumeSession();
    if (ok) return renderSearch();
  }
  state.token = '';
  state.profile = null;
  localStorage.removeItem('cid-token');
  localStorage.removeItem('cid-profile');
  renderWelcome();
}).catch(() => {
  app.innerHTML = '<div class="screen"><h2>No se pudo cargar la base de productos.</h2><p>Revisa que data/products.json esté publicado junto al sitio.</p></div>';
});

function apiBase() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return '';
  if (location.hostname === 'carteleria-movil-piloto-sync.onrender.com') return '';
  return CONFIG.syncService;
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(`${apiBase()}${path}`, { ...options, headers });
  let data = {};
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

async function resumeSession() {
  try {
    const data = await api('/api/me');
    state.profile = data.profile;
    state.queue = hydrateQueue(data.queue || []);
    saveLocalSession();
    return true;
  } catch (_) {
    return false;
  }
}

function readJSON(v) { try { return JSON.parse(v); } catch (_) { return null; } }
function saveLocalSession() {
  if (state.token) localStorage.setItem('cid-token', state.token);
  if (state.profile) localStorage.setItem('cid-profile', JSON.stringify(state.profile));
}
function queueIds() { return state.queue.map(p => String(p.itemNbr)); }
function hydrateQueue(ids) { return (ids || []).map(id => DB.find(p => String(p.itemNbr) === String(id))).filter(Boolean); }

async function saveQueueRemote() {
  if (!state.token) return;
  state.syncing = true;
  updateSyncBadge('Sincronizando…');
  try {
    await api('/api/queue', { method: 'PUT', body: JSON.stringify({ items: queueIds() }) });
    updateSyncBadge('Sincronizado');
  } catch (err) {
    updateSyncBadge('Pendiente');
    alert(`No se pudo sincronizar la cola. ${err.message}`);
  } finally {
    state.syncing = false;
  }
}

async function pullQueueRemote({ rerender = false } = {}) {
  if (!state.token || state.syncing) return;
  try {
    const data = await api('/api/queue');
    const remote = hydrateQueue(data.queue || []);
    const changed = JSON.stringify(remote.map(x => x.itemNbr)) !== JSON.stringify(queueIds());
    state.queue = remote;
    updateSyncBadge('Sincronizado');
    if (changed && rerender && state.view === 'queue') renderQueue(false);
  } catch (_) {
    updateSyncBadge('Sin conexión');
  }
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.token) pullQueueRemote({ rerender: state.view === 'queue' });
});

function money(n) { return '$' + Math.round(Number(n || 0)).toLocaleString('es-CL'); }
function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', timeZone: 'America/Santiago' }).format(d);
}
function isCampaignActive(p) {
  if (!CONFIG.enforceCampaignDates) return true;
  const now = Date.now();
  return (!p.campaignFromDate || now >= Date.parse(p.campaignFromDate)) && (!p.campaignToDate || now <= Date.parse(p.campaignToDate));
}
function isBlocked(p) { return /vencido/i.test(p.statusName || '') || !isCampaignActive(p); }
function mechanicName(id) { return ({ 1: 'Antes y Ahora', 2: 'Nx$', 4: 'Sin Mecánica' })[id] || 'Otro'; }
function priceForUnit(p) {
  return p.mechanicTypeId === 2 && p.offerPrice ? Number(p.offerPrice) / Number(p.quantity || 1) : Number(p.offerPrice ?? p.basePrice ?? 0);
}
function unitReference(p) {
  const base = priceForUnit(p);
  const unit = Number(p.sellQty || 0);
  if (!base || !unit) return '';
  if (['KG', 'LT', 'UN'].includes(p.sellUOMCode)) {
    const v = base / unit;
    return isFinite(v) && v > 0 ? `${money(v)} x ${p.sellUOMCode}` : '';
  }
  // Productos cosméticos del listado: 1000ML y sellQty=10 equivalen a precio por 100 ml.
  if (p.sellUOMCode === 'ZO' && /ML/i.test(p.sizeDesc || '') && unit > 0) {
    const v = base / unit;
    return isFinite(v) && v > 0 ? `${money(v)} x 100 ml` : '';
  }
  return '';
}
function savings(p) {
  if (p.mechanicTypeId === 1) return Math.max(0, Number(p.basePrice || 0) - Number(p.offerPrice || 0));
  if (p.mechanicTypeId === 2) return Math.max(0, Number(p.basePrice || 0) * Number(p.quantity || 1) - Number(p.offerPrice || 0));
  return 0;
}
function mechKey(p) { return p.mechanicTypeId === 2 ? 'nx' : (p.mechanicTypeId === 1 ? 'offer' : 'plain'); }
function mainPrice(p) { return mechKey(p) === 'nx' ? `${p.quantity}x${money(p.offerPrice)}` : mechKey(p) === 'offer' ? money(p.offerPrice) : money(p.basePrice); }
function productText(p) { return `${p.desc1 || ''}${p.sizeDesc ? ` ${p.sizeDesc}` : ''}`.trim(); }
function productSizeClass(p) { const n = productText(p).length; return n > 31 ? 'product-xs' : n > 25 ? 'product-sm' : ''; }

function header() {
  const logged = state.profile;
  return `<header class="topbar"><div class="tag-icon"></div><h1>Nuevo CID cartelería</h1>${logged ? `<div class="identity"><span>${escapeHTML(firstName(logged.name))}</span><button id="headerAccount" type="button">Local ${escapeHTML(logged.local)}</button></div>` : ''}</header>`;
}
function firstName(name) { return String(name || '').trim().split(/\s+/)[0] || ''; }
function wireHeaderAccount() {
  const b = document.getElementById('headerAccount');
  if (b) b.onclick = logoutToWelcome;
}
function updateSyncBadge(text) {
  const e = document.getElementById('syncBadge');
  if (e) e.textContent = text;
}

function renderWelcome(message = '') {
  state.view = 'welcome'; state.current = null;
  app.innerHTML = `${header()}<section class="screen welcome"><div class="store-mark"><div class="awning"><i></i><i></i><i></i><i></i></div><div class="store-body"></div></div><h2 class="welcome-title">Nuevo CID<br>cartelería</h2><p class="welcome-sub">Identifícate para mantener tu cola sincronizada entre celular y computador.</p><div class="login-card"><label>Nombre<input id="nameInput" autocomplete="name" placeholder="Nombre" maxlength="60"></label><label>Número de local<input id="storeInput" inputmode="numeric" autocomplete="off" placeholder="Número de local" maxlength="6"></label><label>PIN<input id="pinInput" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN de 4 a 8 números" maxlength="8"></label>${message ? `<div class="login-error">${escapeHTML(message)}</div>` : ''}<button class="primary" id="enterBtn">Ingresar</button></div><small class="login-note">El mismo nombre, local y PIN abren la misma cola en el computador.</small></section>`;
  const name = document.getElementById('nameInput');
  const local = document.getElementById('storeInput');
  const pin = document.getElementById('pinInput');
  name.focus();
  const submit = async () => {
    const btn = document.getElementById('enterBtn');
    btn.disabled = true; btn.textContent = 'Conectando…';
    try {
      const data = await api('/api/login', { method: 'POST', body: JSON.stringify({ name: name.value.trim(), local: local.value.trim(), pin: pin.value.trim() }) });
      state.token = data.token; state.profile = data.profile; state.queue = hydrateQueue(data.queue || []); state.current = null;
      saveLocalSession(); renderSearch();
    } catch (err) {
      renderWelcome(err.message.includes('Failed to fetch') ? 'El servicio de sincronización está iniciando. Intenta nuevamente en unos segundos.' : err.message);
    }
  };
  document.getElementById('enterBtn').onclick = submit;
  [name, local, pin].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); }));
}

function logoutToWelcome() {
  state.token = ''; state.profile = null; state.queue = []; state.current = null;
  localStorage.removeItem('cid-token'); localStorage.removeItem('cid-profile');
  renderWelcome();
}

function renderSearch() {
  state.view = 'search'; state.current = null;
  app.innerHTML = `${header()}<section class="screen"><div class="screen-meta"><span id="syncBadge">Sincronizado</span></div><h2 class="section-title">Ingresar ítem</h2><div class="search-row"><div class="search-field"><span>▥</span><input id="itemInput" inputmode="numeric" placeholder="Ingresar ítem" aria-label="Número de ítem"></div><button class="search-btn" id="searchBtn">Buscar</button></div><div id="searchMsg"></div>${state.queue.length ? `<button class="secondary" id="queueOpen">Ver cola (${state.queue.length})</button>` : ''}<button class="secondary account-btn" id="changeAccount">Cambiar usuario / local</button></section>`;
  wireHeaderAccount();
  const inp = document.getElementById('itemInput'); inp.value = ''; inp.focus();
  const go = () => {
    const id = inp.value.trim();
    const p = DB.find(x => String(x.itemNbr) === id);
    if (!p) {
      document.getElementById('searchMsg').innerHTML = `<div class="status-card status-warn"><strong>Ítem no encontrado</strong><small>Este prototipo contiene 30 productos de prueba.</small></div>`;
      return;
    }
    state.current = p; renderProduct();
  };
  document.getElementById('searchBtn').onclick = go;
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  const q = document.getElementById('queueOpen'); if (q) q.onclick = async () => { await pullQueueRemote(); renderQueue(); };
  document.getElementById('changeAccount').onclick = logoutToWelcome;
}

function renderProduct() {
  state.view = 'product';
  const p = state.current; const blocked = isBlocked(p);
  app.innerHTML = `${header()}<section class="screen"><div class="screen-meta"><span id="syncBadge">Sincronizado</span></div><h2 class="section-title">Ingresar ítem</h2><div class="search-row"><div class="search-field"><span>▥</span><input id="itemInput" inputmode="numeric" value="${p.itemNbr}" aria-label="Número de ítem"></div><button class="search-btn" id="searchBtn">Buscar</button></div><div class="status-card ${blocked ? 'status-warn' : 'status-ok'}"><strong>${blocked ? 'Producto no imprimible' : '✓ Producto encontrado'}</strong><small>Ítem ${p.itemNbr} · ${mechanicName(p.mechanicTypeId)}${blocked ? ` · Estado: ${p.statusName}` : ''}</small></div><div class="preview-wrap">${previewSignHTML(p, state.profile.local)}</div><button class="queue-btn" id="addQueue" ${blocked ? 'disabled' : ''}>▣ &nbsp; Agregar a cola</button><button class="secondary" id="another">＋ &nbsp; Buscar otro ítem</button>${state.queue.length ? `<button class="secondary" id="queueOpen">Ver cola (${state.queue.length})</button>` : ''}<button class="secondary account-btn" id="changeAccount">Cambiar usuario / local</button></section>`;
  wireHeaderAccount();
  const search = () => {
    const id = document.getElementById('itemInput').value.trim();
    const np = DB.find(x => String(x.itemNbr) === id);
    if (!np) return alert('Ítem no encontrado en la base de prueba.');
    state.current = np; renderProduct();
  };
  document.getElementById('searchBtn').onclick = search;
  document.getElementById('addQueue').onclick = async () => { state.queue.push(p); await saveQueueRemote(); state.current = null; renderQueue(); };
  document.getElementById('another').onclick = renderSearch;
  const qo = document.getElementById('queueOpen'); if (qo) qo.onclick = async () => { await pullQueueRemote(); renderQueue(); };
  document.getElementById('changeAccount').onclick = logoutToWelcome;
}

async function renderQueue(refreshFirst = true) {
  state.view = 'queue'; state.current = null;
  if (refreshFirst) await pullQueueRemote();
  app.innerHTML = `${header()}<section class="screen"><div class="queue-head"><div class="toolbar"><h2>Cola de impresión</h2><span class="badge">${state.queue.length}</span></div><button class="sync-button" id="refreshQueue">↻ <span id="syncBadge">Sincronizado</span></button></div><div class="queue-list">${state.queue.length ? state.queue.map((p, i) => queueItemHTML(p, i)).join('') : '<div class="empty">Aún no hay carteles en la cola.</div>'}</div>${state.queue.length ? `<button class="print-btn" id="printBtn">▣ &nbsp; Imprimir cola (${state.queue.length})</button>` : ''}<button class="secondary" id="addAnother">＋ &nbsp; Agregar otro ítem</button><button class="secondary account-btn" id="changeAccount">Cambiar usuario / local</button></section>`;
  wireHeaderAccount();
  document.querySelectorAll('[data-remove]').forEach(b => b.onclick = async () => { state.queue.splice(Number(b.dataset.remove), 1); await saveQueueRemote(); renderQueue(false); });
  const pb = document.getElementById('printBtn'); if (pb) pb.onclick = printQueue;
  document.getElementById('addAnother').onclick = renderSearch;
  document.getElementById('changeAccount').onclick = logoutToWelcome;
  document.getElementById('refreshQueue').onclick = async () => { updateSyncBadge('Actualizando…'); await pullQueueRemote(); renderQueue(false); };
}

function queueItemHTML(p, i) {
  return `<article class="queue-item"><div class="thumb">${miniSignHTML(p)}</div><div class="queue-info"><b>${p.itemNbr}</b><div>${escapeHTML(p.desc1)}</div><div class="brand">${escapeHTML(p.brand)}</div></div><button class="trash" data-remove="${i}" aria-label="Eliminar">⌫</button></article>`;
}

/* Vista móvil compacta: no incluye el aire físico reservado para la hoja de impresión. */
function previewSignHTML(p, local) {
  const mech = mechKey(p), sav = savings(p), uom = unitReference(p), text = productText(p);
  const details = mech === 'nx'
    ? `<div class="preview-details dark"><span>P. unitario: ${money(p.basePrice)}</span><span>Ahorro: ${money(sav)}</span></div>`
    : mech === 'offer'
      ? `<div class="preview-details light"><span>Antes: ${money(p.basePrice)}</span><span>Ahorro: ${money(sav)}</span></div>`
      : '';
  return `<div class="preview-sign preview-${mech}"><div class="preview-head"><strong>${escapeHTML(text)}</strong><span>${escapeHTML(p.brand)}</span></div><div class="preview-price">${mainPrice(p)}</div><div class="preview-payment">pagando con todo medio de pago</div>${details}<div class="preview-copy"><strong>${escapeHTML(text)}</strong><span>${escapeHTML(p.brand)}</span>${uom ? `<span>${escapeHTML(uom)}</span>` : ''}</div><div class="preview-bottom"><div class="preview-barcode">${ean13SVG(p.upc)}<small>${escapeHTML(p.upc)}</small><p>Destacado: ${escapeHTML(p.campaignName)}<br>Item: ${p.itemNbr}<br>Categoría: ${p.categoryId} - ${escapeHTML(p.categoryName)}<br><b>Local: ${escapeHTML(local)}</b></p></div><div class="preview-validity">Vigencia: del ${shortDate(p.campaignFromDate)} al ${shortDate(p.campaignToDate)}</div></div></div>`;
}

function miniSignHTML(p) {
  const mech = mechKey(p), uom = unitReference(p);
  return `<div class="mini-sign mini-${mech}"><div class="mini-price">${mainPrice(p)}</div>${mech === 'nx' ? `<div class="mini-strip"><span>P. unit. ${money(p.basePrice)}</span><span>Ahorro ${money(savings(p))}</span></div>` : mech === 'offer' ? `<div class="mini-offer"><span>Antes ${money(p.basePrice)}</span><span>Ahorro ${money(savings(p))}</span></div>` : ''}<div class="mini-product">${escapeHTML(productText(p))}</div><div class="mini-brand">${escapeHTML(p.brand)}</div>${uom ? `<div class="mini-uom">${escapeHTML(uom)}</div>` : ''}<div class="mini-barcode">${ean13SVG(p.upc)}</div></div>`;
}

/* Cartel físico: A4 2x2. El aire vertical existe solo aquí. */
function signHTML(p, local) {
  const sav = savings(p), mech = mechKey(p), uom = unitReference(p);
  const details = mech === 'nx'
    ? `<div class="price-details dark"><span>P. unitario: ${money(p.basePrice)}</span><span>Ahorro: ${money(sav)}</span></div>`
    : mech === 'offer'
      ? `<div class="price-details light"><span>Antes: ${money(p.basePrice)}</span><span>Ahorro: ${money(sav)}</span></div>`
      : '';
  return `<div class="sign sign-${mech}"><div class="sign-price">${mainPrice(p)}</div><div class="payment-note">pagando con todo medio de pago</div>${details}<div class="sign-product ${productSizeClass(p)}">${escapeHTML(productText(p))}</div><div class="sign-brand">${escapeHTML(p.brand)}</div>${uom ? `<div class="sign-uom">${escapeHTML(uom)}</div>` : ''}<div class="sign-barcode">${ean13SVG(p.upc)}<div class="barcode-digits">${escapeHTML(p.upc)}</div></div><div class="sign-meta">Destacado: ${escapeHTML(p.campaignName)} Item: ${p.itemNbr}<br>Categoría: ${p.categoryId} - ${escapeHTML(p.categoryName)}<div class="local-line">Local: ${escapeHTML(local)}</div></div><div class="sign-validity">Vigencia: del ${shortDate(p.campaignFromDate)} al ${shortDate(p.campaignToDate)}</div></div>`;
}

function printQueue() {
  const chunks = [];
  for (let i = 0; i < state.queue.length; i += 4) chunks.push(state.queue.slice(i, i + 4));
  printArea.innerHTML = chunks.map(ch => `<section class="print-sheet">${[0, 1, 2, 3].map(i => `<div class="print-cell">${ch[i] ? signHTML(ch[i], state.profile.local) : ''}</div>`).join('')}</section>`).join('');
  printArea.setAttribute('aria-hidden', 'false');
  document.body.classList.add('printing');
  setTimeout(() => window.print(), 120);
}
window.addEventListener('afterprint', () => { document.body.classList.remove('printing'); printArea.setAttribute('aria-hidden', 'true'); });

function escapeHTML(s) { return String(s ?? '').replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c])); }

function ean13SVG(code) {
  code = String(code || '').replace(/\D/g, ''); if (code.length === 12) code += eanCheck(code); if (code.length !== 13) return '';
  const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
  const P = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
  let bits = '101'; const par = P[Number(code[0])];
  for (let i = 1; i <= 6; i++) bits += (par[i - 1] === 'L' ? L : G)[Number(code[i])];
  bits += '01010'; for (let i = 7; i <= 12; i++) bits += R[Number(code[i])]; bits += '101';
  let bars = ''; for (let i = 0; i < bits.length; i++) if (bits[i] === '1') bars += `<rect x="${i + 8}" y="2" width="1" height="42" fill="#000"/>`;
  return `<svg viewBox="0 0 111 46" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="111" height="46" fill="#fff"/>${bars}</svg>`;
}
function eanCheck(code12) { let s = 0; for (let i = 0; i < 12; i++) s += Number(code12[i]) * (i % 2 ? 3 : 1); return String((10 - (s % 10)) % 10); }
