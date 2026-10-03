const CONFIG = { enforceCampaignDates: false, testMode: true };
let DB = [];
let state = { store: sessionStorage.getItem('cid-store') || '', current: null, queue: [] };
const app = document.getElementById('app');
const printArea = document.getElementById('printArea');

fetch('./data/products.json').then(r=>r.json()).then(j=>{ DB=j.products; render(); }).catch(()=>{
  app.innerHTML='<div class="screen"><h2>No se pudo cargar la base de productos.</h2><p>Revisa que data/products.json esté publicado junto al sitio.</p></div>';
});

function money(n){ return '$' + Math.round(Number(n||0)).toLocaleString('es-CL'); }
function shortDate(iso){ if(!iso) return ''; const d=new Date(iso); return new Intl.DateTimeFormat('es-CL',{day:'numeric',month:'long',timeZone:'America/Santiago'}).format(d); }
function isCampaignActive(p){ if(!CONFIG.enforceCampaignDates) return true; const now=Date.now(); return (!p.campaignFromDate||now>=Date.parse(p.campaignFromDate))&&(!p.campaignToDate||now<=Date.parse(p.campaignToDate)); }
function isBlocked(p){ return /vencido/i.test(p.statusName||'') || !isCampaignActive(p); }
function mechanicName(id){ return ({1:'Antes y Ahora',2:'Nx$',4:'Sin Mecánica'})[id] || 'Otro'; }
function unitReference(p){
  const unit = Number(p.sellQty||0);
  if(!unit || !['KG','LT','UN'].includes(p.sellUOMCode)) return '';
  const base = p.mechanicTypeId===2 && p.offerPrice ? Number(p.offerPrice)/Number(p.quantity||1) : Number(p.offerPrice ?? p.basePrice ?? 0);
  const v = base/unit;
  if(!isFinite(v)||v<=0) return '';
  return `${money(v)} x ${p.sellUOMCode}`;
}
function savings(p){
  if(p.mechanicTypeId===1) return Math.max(0,Number(p.basePrice||0)-Number(p.offerPrice||0));
  if(p.mechanicTypeId===2) return Math.max(0,Number(p.basePrice||0)*Number(p.quantity||1)-Number(p.offerPrice||0));
  return 0;
}

function render(){ if(!state.store) return renderWelcome(); if(state.current) return renderProduct(); return renderQueueOrSearch(); }
function header(extra=''){ return `<header class="topbar"><div class="tag-icon"></div><h1>Nuevo CID cartelería</h1>${extra}</header>`; }
function storeChip(){ return `<button class="local-chip" id="headerChangeStore" type="button" title="Cambiar local">Local ${escapeHTML(state.store)}</button>`; }
function wireHeaderStore(){ const b=document.getElementById('headerChangeStore'); if(b) b.onclick=changeStore; }
function changeStore(){
  if(state.queue.length && !confirm('Hay carteles en la cola. ¿Cambiar de local y vaciar la cola?')) return;
  state.store=''; state.queue=[]; state.current=null; sessionStorage.removeItem('cid-store'); render();
}

function renderWelcome(){
  app.innerHTML = `${header()}<section class="screen welcome"><div class="store-mark"><div class="awning"><i></i><i></i><i></i><i></i></div><div class="store-body"></div></div><h2 class="welcome-title">Nuevo CID<br>cartelería</h2><p>Ingresa tu número de local<br>para comenzar</p><div class="field"><span class="shop-emoji">🏪</span><input id="storeInput" inputmode="numeric" maxlength="6" placeholder="622" aria-label="Número de local"></div><button class="primary" id="enterBtn">Ingresar</button></section>`;
  const input=document.getElementById('storeInput'); input.value=''; input.focus();
  document.getElementById('enterBtn').onclick=()=>{ const v=input.value.trim(); if(!/^\d{1,6}$/.test(v)){ input.focus(); return; } state.store=v; sessionStorage.setItem('cid-store',v); renderSearch(); };
  input.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('enterBtn').click()});
}

function renderQueueOrSearch(){ state.queue.length?renderQueue():renderSearch(); }
function renderSearch(){
  state.current=null;
  app.innerHTML=`${header(storeChip())}<section class="screen"><h2 class="section-title">Ingresar ítem</h2><div class="search-row"><div class="search-field"><span>▥</span><input id="itemInput" inputmode="numeric" placeholder="646205" aria-label="Número de ítem"></div><button class="search-btn" id="searchBtn">Buscar</button></div><div id="searchMsg"></div>${state.queue.length?`<button class="secondary" id="queueOpen">Ver cola (${state.queue.length})</button>`:''}<button class="secondary" id="changeStore">Cambiar local</button></section>`;
  wireHeaderStore();
  const inp=document.getElementById('itemInput'); inp.focus();
  const go=()=>{ const id=inp.value.trim(); const p=DB.find(x=>x.itemNbr===id); if(!p){ document.getElementById('searchMsg').innerHTML=`<div class="status-card status-warn"><strong>Ítem no encontrado</strong><small>Este prototipo contiene 30 productos de prueba.</small></div>`; return; } state.current=p; renderProduct(); };
  document.getElementById('searchBtn').onclick=go; inp.addEventListener('keydown',e=>{if(e.key==='Enter')go()});
  const q=document.getElementById('queueOpen'); if(q) q.onclick=renderQueue;
  document.getElementById('changeStore').onclick=changeStore;
}

function renderProduct(){
  const p=state.current; const blocked=isBlocked(p);
  app.innerHTML=`${header(storeChip())}<section class="screen"><h2 class="section-title">Ingresar ítem</h2><div class="search-row"><div class="search-field"><span>▥</span><input id="itemInput" inputmode="numeric" value="${p.itemNbr}" aria-label="Número de ítem"></div><button class="search-btn" id="searchBtn">Buscar</button></div><div class="status-card ${blocked?'status-warn':'status-ok'}"><strong>${blocked?'Producto no imprimible':'✓ Producto encontrado'}</strong><small>Ítem ${p.itemNbr} · ${mechanicName(p.mechanicTypeId)}${blocked?` · Estado: ${p.statusName}`:''}</small></div><div class="sign-wrap">${signHTML(p,state.store)}</div><button class="queue-btn" id="addQueue" ${blocked?'disabled':''}>▣ &nbsp; Agregar a cola</button><button class="secondary" id="another">+ &nbsp; Buscar otro ítem</button>${state.queue.length?`<button class="secondary" id="queueOpen">Ver cola (${state.queue.length})</button>`:''}<button class="secondary" id="changeStore">Cambiar local</button></section>`;
  wireHeaderStore();
  const search=()=>{ const id=document.getElementById('itemInput').value.trim(); const np=DB.find(x=>x.itemNbr===id); if(!np){ alert('Ítem no encontrado en la base de prueba.'); return;} state.current=np;renderProduct();};
  document.getElementById('searchBtn').onclick=search;
  document.getElementById('addQueue').onclick=()=>{ state.queue.push(p); state.current=null; renderQueue(); };
  document.getElementById('another').onclick=()=>{state.current=null;renderSearch()};
  const qo=document.getElementById('queueOpen'); if(qo) qo.onclick=renderQueue;
  document.getElementById('changeStore').onclick=changeStore;
}

function renderQueue(){
  state.current=null;
  app.innerHTML=`${header(storeChip())}<section class="screen"><div class="toolbar"><h2>Cola de impresión</h2><span class="badge">${state.queue.length}</span></div><div class="queue-list">${state.queue.length?state.queue.map((p,i)=>queueItemHTML(p,i)).join(''):'<div class="empty">Aún no hay carteles en la cola.</div>'}</div>${state.queue.length?`<button class="print-btn" id="printBtn">▣ &nbsp; Imprimir cola (${state.queue.length})</button>`:''}<button class="secondary" id="addAnother">＋ &nbsp; Agregar otro ítem</button><button class="secondary" id="changeStore">Cambiar local</button></section>`;
  wireHeaderStore();
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{state.queue.splice(Number(b.dataset.remove),1);renderQueue()});
  const pb=document.getElementById('printBtn'); if(pb) pb.onclick=printQueue;
  document.getElementById('addAnother').onclick=renderSearch;
  document.getElementById('changeStore').onclick=changeStore;
}

function queueItemHTML(p,i){ return `<article class="queue-item"><div class="thumb"><div class="mini">${signHTML(p,state.store,true)}</div></div><div class="queue-info"><b>${p.itemNbr}</b><div>${escapeHTML(p.desc1)}</div><div class="brand">${escapeHTML(p.brand)}</div></div><button class="trash" data-remove="${i}" aria-label="Eliminar">⌫</button></article>`; }

function signHTML(p,store,mini=false){
  const sav=savings(p);
  const mech = p.mechanicTypeId===2?'nx':(p.mechanicTypeId===1?'offer':'plain');
  let mainPrice='';
  if(mech==='nx') mainPrice=`${p.quantity}x${money(p.offerPrice)}`;
  else if(mech==='offer') mainPrice=money(p.offerPrice);
  else mainPrice=money(p.basePrice);
  const uom=unitReference(p);
  const details = mech==='nx'
    ? `<div class="price-details dark"><span>P. unitario: ${money(p.basePrice)}</span><span>Ahorro: ${money(sav)}</span></div>`
    : mech==='offer'
      ? `<div class="price-details light"><span>Antes: ${money(p.basePrice)}</span><span>Ahorro: ${money(sav)}</span></div>`
      : '';
  return `<div class="sign sign-${mech} ${mini?'sign-mini':''}">
    <div class="sign-price">${mainPrice}</div>
    <div class="payment-note">pagando con todo medio de pago</div>
    ${details}
    <div class="sign-product">${escapeHTML(p.desc1)} ${escapeHTML(p.sizeDesc)}</div>
    <div class="sign-brand">${escapeHTML(p.brand)}</div>
    ${uom?`<div class="sign-uom">${uom}</div>`:''}
    <div class="sign-barcode">${ean13SVG(p.upc)}<div class="barcode-digits">${escapeHTML(p.upc)}</div></div>
    <div class="sign-meta">Destacado: ${escapeHTML(p.campaignName)} Item: ${p.itemNbr}<br>Categoría: ${p.categoryId} - ${escapeHTML(p.categoryName)}<div class="local-line">Local: ${escapeHTML(store)}</div></div>
    <div class="sign-validity">Vigencia: del ${shortDate(p.campaignFromDate)} al ${shortDate(p.campaignToDate)}</div>
  </div>`;
}

function printQueue(){
  const chunks=[]; for(let i=0;i<state.queue.length;i+=4) chunks.push(state.queue.slice(i,i+4));
  printArea.innerHTML=chunks.map(ch=>`<section class="print-sheet">${[0,1,2,3].map(i=>`<div class="print-cell">${ch[i]?signHTML(ch[i],state.store):''}</div>`).join('')}</section>`).join('');
  printArea.setAttribute('aria-hidden','false');
  document.body.classList.add('printing');
  setTimeout(()=>window.print(),120);
}
window.addEventListener('afterprint',()=>{ document.body.classList.remove('printing'); printArea.setAttribute('aria-hidden','true'); });

function escapeHTML(s){ return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function ean13SVG(code){
  code=String(code||'').replace(/\D/g,''); if(code.length===12) code+=eanCheck(code); if(code.length!==13) return '';
  const L=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const G=['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  const R=['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
  const P=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
  let bits='101'; const par=P[Number(code[0])]; for(let i=1;i<=6;i++) bits+=(par[i-1]==='L'?L:G)[Number(code[i])]; bits+='01010'; for(let i=7;i<=12;i++) bits+=R[Number(code[i])]; bits+='101';
  let bars=''; for(let i=0;i<bits.length;i++) if(bits[i]==='1') bars+=`<rect x="${i+8}" y="2" width="1" height="42" fill="#000"/>`;
  return `<svg viewBox="0 0 111 46" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="111" height="46" fill="#fff"/>${bars}</svg>`;
}
function eanCheck(code12){ let s=0; for(let i=0;i<12;i++) s+=Number(code12[i])*(i%2?3:1); return String((10-(s%10))%10); }
