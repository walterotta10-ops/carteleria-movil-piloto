(() => {
  const rules = window.CARTELERIA_RULES;
  if (!rules) throw new Error('Falta cartel-rules.js. No se habilita impresión.');
  const catalog = (window.CARTELERIA_CATALOG || []).map(p => ({...p, ...rules.calc(p)}));
  const VERSION = 'v34-occam-sba-fichas';
  const app = document.getElementById("app");
  const printRoot = document.getElementById("printRoot");

  const MOBILE_MAC_KEY = "carteleria.rf.mobile.mac";
  const CARTA_REMOTE_URL = "https://carteleria-puente-carta.walterotta10.workers.dev";

  const state = {
    local: localStorage.getItem("carteleria.local") || "",
    itemCode: "",
    product: null,
    queue: [],
    mobileMac: localStorage.getItem(MOBILE_MAC_KEY) || "",
    selectedLayout: new Set(),
    layoutZoom: 1
  };

  function isMobileDevice() {
    // Rama móvil estricta: por ahora NO cambia ningún comportamiento de escritorio.
    // Solo entra a móvil cuando el viewport realmente es de teléfono/tablet angosto.
    return window.matchMedia("(max-width: 760px)").matches;
  }

  const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  function queueKey() {
    return `carteleria.queue.${state.local || "sin-local"}`;
  }
  function loadQueue() {
    try {
      state.queue = JSON.parse(localStorage.getItem(queueKey()) || "[]");
      if (!Array.isArray(state.queue)) state.queue = [];
      // Nunca reutilizar precios/fechas guardados de versiones antiguas.
      state.queue = state.queue.map(p => rules.canonical(p, catalog));
      localStorage.setItem(queueKey(), JSON.stringify(state.queue));
    } catch {
      state.queue = [];
    }
  }
  function printErrors() {
    return rules.auditQueue(state.queue);
  }
  function ensureQueuePrintable() {
    // Vuelve a leer los ítems actuales justo antes de imprimir o enviar al puente.
    loadQueue();
    if (!state.queue.length) { window.alert('No hay carteles en la cola.'); return false; }
    const errors=printErrors();
    if (errors.length) {
      const list=errors.slice(0,8).map(x => `Ítem ${x.code}: ${x.error}`).join('\n');
      window.alert(`IMPRESIÓN BLOQUEADA: ${errors.length} dato(s) por revisar.\n${list}${errors.length>8?'\n...':''}\nRetira o corrige estos ítems antes de imprimir.`);
      return false;
    }
    return true;
  }
  function saveQueue() {
    localStorage.setItem(queueKey(), JSON.stringify(state.queue));
  }
  function typeLabel(type) {
    if (type === "nx") return "Lleva más, paga menos";
    if (type === "offer") return "Ahora más barato";
    return "Precio normal";
  }

  function header() {
    return `
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">◆</span>
          <span class="brand-text"><strong>Nuevo C&amp;D</strong><small>Cartelería · v34 SBA</small></span>
        </div>
        <button class="local-badge" id="changeLocalTop" type="button">Local ${esc(state.local)}</button>
      </header>
    `;
  }

  function landing() {
    app.innerHTML = `
      <section class="landing">
        <img class="landing-logo" src="assets/acuenta-logo.png" alt="Super Bodega aCuenta">
        <h1>Nuevo C&amp;D<br><span>Cartelería</span></h1>
        <p class="landing-copy">Ingresa el número de local para comenzar.</p>
        <form class="local-card" id="localForm" autocomplete="off">
          <label for="localNumber">Número de local</label>
          <input id="localNumber" inputmode="numeric" pattern="[0-9]*" placeholder="Número de local" maxlength="6" autofocus>
          <button class="btn primary" type="submit">Ingresar</button>
        </form>
      </section>
    `;
    document.getElementById("localForm").addEventListener("submit", e => {
      e.preventDefault();
      const local = document.getElementById("localNumber").value.trim();
      if (!/^\d{1,6}$/.test(local)) {
        document.getElementById("localNumber").classList.add("invalid");
        return;
      }
      state.local = local;
      localStorage.setItem("carteleria.local", local);
      loadQueue();
      state.product = null;
      state.itemCode = "";
      renderMenu();
    });
  }

  // Menú de dos accesos. El módulo de impresión existente permanece intacto.
  function renderMenu() {
    if (!state.local) return landing();
    app.innerHTML = `${header()}<section class="screen mode-screen">
      <h1>¿Qué deseas hacer?</h1><p>Elige cómo revisar tus promociones.</p>
      <div class="mode-grid">
        <button type="button" class="mode-tile" id="modeItem"><span class="mode-emoji">▣</span><strong>Ingresar o escanear ítem</strong><small>Buscar un cartel por código o escanearlo</small></button>
        <button type="button" class="mode-tile" id="modeLayout"><span class="mode-emoji">▦</span><strong>Layout panorámico promociones</strong><small>Recorrer zonas, revisar categorías e imprimir</small></button>
      </div></section>`;
    document.getElementById("modeItem").onclick = renderMain;
    document.getElementById("modeLayout").onclick = () => renderLayout();
    document.getElementById("changeLocalTop").onclick = changeLocal;
  }

  // Categorías transcritas y normalizadas del plano Excel de referencia (sin tienda).
  // Categorías de referencia transcritas del Excel, agrupadas en un layout genérico.
  // Las cantidades NO salen del Excel: se calculan con las listas importadas.
  const zoneDefinitions = [
    {
        "name": "Abarrotes",
        "icon": "🍚",
        "groups": [
            "Arroz",
            "Pastas",
            "Aceites",
            "Puré y legumbres",
            "Dressing",
            "Harina",
            "Té y hierbas",
            "Leche en polvo y saborizantes",
            "Mermeladas y miel",
            "Cereales",
            "Galletas",
            "Conservas de pescado",
            "Conservas de mariscos",
            "Sopas y caldos",
            "Sal y condimentos",
            "Platos instantáneos",
            "Azúcar",
            "Conservas de frutas y verduras",
            "Salsas y queso rallado",
            "Postres listos",
            "Café",
            "Endulzantes",
            "Caramelos",
            "Chocolates",
            "Vinagre y sucedáneos",
            "Sabores de América",
            "Repostería",
            "Colación",
            "Cóctel y frutos secos",
            "Snacks"
        ]
    },
    {
        "name": "Bebestibles",
        "icon": "🥤",
        "groups": [
            "Aguas",
            "Bebidas",
            "Jugos líquidos",
            "Jugos en polvo",
            "Energéticas e isotónicas"
        ]
    },
    {
        "name": "Licores",
        "icon": "🍷",
        "groups": [
            "Vinos",
            "Cervezas",
            "Licores"
        ]
    },
    {
        "name": "Perfumería",
        "icon": "🧴",
        "groups": [
            "Champú",
            "Coloración",
            "Afeitado y depilación",
            "Desodorantes",
            "Baño y spa",
            "Jabones",
            "Higiene bucal",
            "Puericultura",
            "Alimentos y fórmulas para bebé",
            "Higiene femenina",
            "Incontinencia",
            "Pañales"
        ]
    },
    {
        "name": "Limpieza",
        "icon": "🧼",
        "groups": [
            "Papel higiénico",
            "Servilletas y pañuelos",
            "Limpiadores de piso",
            "Guantes y paños húmedos",
            "Accesorios de piso",
            "Ambientales y plaguicidas",
            "Suavizantes",
            "Detergentes",
            "Wipes",
            "Limpiadores de baño",
            "Esponjas y virutillas",
            "Toalla de papel",
            "Pulidores y antigrasas",
            "Limpiavidrios",
            "Lavaloza",
            "Bolsas de basura",
            "Blanqueamiento",
            "Ceras",
            "Tratamiento de ropa",
            "Lustramuebles y calzado"
        ]
    },
    {
        "name": "Lácteos y refrigerados",
        "icon": "🥛",
        "groups": [
            "Lácteos",
            "Leches blancas",
            "Leches saborizadas",
            "Pan industrial",
            "Leche condensada y manjar",
            "Hora del té",
            "Huevos",
            "Crema",
            "Vegetales fríos"
        ]
    },
    {
        "name": "Fiambrería y Deli",
        "icon": "🧀",
        "groups": [
            "Fiambrería",
            "Fiambres y quesos",
            "Deli",
            "Quesos",
            "Fiambres"
        ]
    },
    {
        "name": "Carnes y pollos",
        "icon": "🥩",
        "groups": [
            "Carnes",
            "Pollos",
            "Asistido carnes",
            "Carnes congeladas"
        ]
    },
    {
        "name": "Congelados",
        "icon": "🧊",
        "groups": [
            "Congelados",
            "Congelados carnes",
            "Congelados lácteos"
        ]
    },
    {
        "name": "Panadería",
        "icon": "🍞",
        "groups": [
            "Panadería",
            "Pan a granel",
            "Hornos de pollo"
        ]
    },
    {
        "name": "Mascotas",
        "icon": "🐾",
        "groups": [
            "Alimento perro",
            "Alimento gato",
            "Accesorios mascotas"
        ]
    },
    {
        "name": "Hogar y cocina",
        "icon": "🏠",
        "groups": [
            "Decoración hogar",
            "Ferretería",
            "Automóvil",
            "Envolturas y protección",
            "Juguetería",
            "Librería",
            "Cumpleaños",
            "Sartenes",
            "Baterías y cacerolas",
            "Moldes",
            "Cajas organizadoras",
            "Accesorios baño",
            "Accesorios lavado",
            "Frascos",
            "Textil mesa",
            "Utensilios",
            "Accesorios mesa y cocina",
            "Herméticos",
            "Termos y botellas",
            "Tazones",
            "Cristalería",
            "Loza"
        ]
    },
    {
        "name": "Textil",
        "icon": "👕",
        "groups": [
            "Mujer",
            "Hombre",
            "Infantil",
            "Pijamas",
            "Ropa niña",
            "Ropa niño",
            "Bebé niña",
            "Bebé niño",
            "Bodys bebé",
            "Ropa interior hombre",
            "Ropa interior",
            "Calcetines",
            "Calzado mujer",
            "Calzado hombre",
            "Calzado infantil",
            "Ropa interior niña",
            "Ropa interior niño",
            "Ropa interior bebé",
            "Set de cama",
            "Frazadas",
            "Plumones",
            "Sábanas",
            "Cojines, alfombras y bajadas",
            "Toallas a granel"
        ]
    },
    {
        "name": "Otros y electrónica",
        "icon": "🛒",
        "groups": [
            "Audio",
            "Pequeños electrodomésticos",
            "Liquidación"
        ]
    }
];
  const norm = value => String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const categories = zoneDefinitions.flatMap(z => z.groups);
  const aliases = {
    'vino':'Vinos','vinos':'Vinos','cerveza':'Cervezas','cervezas':'Cervezas',
    'licores':'Licores','licor':'Licores','bebida':'Bebidas','bebidas':'Bebidas',
    'agua':'Aguas','aguamineral':'Aguas','arroz':'Arroz',
    'jabon':'Jabones','jabonestocador':'Jabones','shampoo':'Champú',
    'papelhigienico':'Papel higiénico','detergente':'Detergentes','lavalozas':'Lavaloza',
    'fiambres':'Fiambres','fiambreria':'Fiambrería','quesos':'Quesos',
    'lacteos':'Lácteos','frio':'Lácteos','mascotas':'Accesorios mascotas',
    'textil':'Ropa interior','pae':'Pequeños electrodomésticos'
  };
  function categoryFor(p) {
    const raw=String(p.categoryName||'').trim();
    const normalized=norm(raw);
    if(aliases[normalized])return aliases[normalized];
    const match=categories.find(g=>norm(g)===normalized);
    if(match)return match;
    // Las categorías no existentes en el Excel no se pierden: aparecen para clasificar.
    return raw || 'Sin clasificar';
  }
  const groupProducts = name => catalog.filter(p => norm(categoryFor(p)) === norm(name));
  const zoneProducts = zone => zone.groups.flatMap(groupProducts);
  function layoutZones() {
    const allKnown=new Set(categories.map(norm));
    const extras=[...new Set(catalog.map(categoryFor).filter(x=>!allKnown.has(norm(x))))];
    return extras.length?[...zoneDefinitions,{name:'Por clasificar',icon:'📋',groups:extras}]:zoneDefinitions;
  }
  function renderLayoutLegacy(activeZone = null, activeGroup = null) {
    if (!state.local) return landing();
    loadQueue();
    const total = catalog.length;
    const zones = layoutZones();
    const zone = zones.find(z => z.name === activeZone);
    const products = activeGroup ? groupProducts(activeGroup) : [];
    const checked = products.filter(p => state.selectedLayout.has(String(p.signId || p.code))).length;
    app.innerHTML = `${header()}<section class="screen panorama-screen">
      <div class="panorama-head"><button class="btn back-home" id="layoutBack">← ${activeGroup ? "Categorías" : zone ? "Plano" : "Menú"}</button>
      <div><h1>Layout panorámico promociones</h1><p>Plano tipo · ${total} carteles cargados · sin referencia a un local específico</p></div></div>
      ${!zone ? `<div class="panorama-tools"><span>Vista superior de zonas</span><div><button class="btn" id="zoomOut">−</button><strong id="layoutZoomPercent">${Math.round(state.layoutZoom*100)}%</strong><button class="btn" id="zoomIn">+</button></div></div>
      <div class="panorama-viewport" id="occamViewport" tabindex="0" aria-label="Mapa desplazable de subgrupos"><div class="panorama-map" id="panoramaMap" style="zoom:${state.layoutZoom}">
        <div class="panorama-entrance">ZONAS DE PROMOCIONES</div>
        ${zones.map(z=>`<button class="panorama-zone" data-zone="${esc(z.name)}"><span class="zone-icon">${z.icon}</span><strong>${esc(z.name)}</strong><span>${zoneProducts(z).length} carteles</span></button>`).join("")}
      </div></div><p class="panorama-hint">Toca una zona para abrir sus categorías. En celular, usa dos dedos para ampliar o reducir; en PC, usa + y −.</p>` :
      !activeGroup ? `<div class="panorama-breadcrumb">${esc(zone.name)} · ${zoneProducts(zone).length} carteles</div>
        <div class="category-grid">${[...zone.groups,...new Set(zoneProducts(zone).map(categoryFor).filter(n=>!zone.groups.includes(n)))].map(g=>`<button class="category-tile" data-group="${esc(g)}"><strong>${esc(g)}</strong><span>${groupProducts(g).length} carteles</span></button>`).join("")}</div>` :
      `<div class="panorama-breadcrumb">${esc(zone.name)} › ${esc(activeGroup)} · ${products.length} carteles</div>
       <div class="selection-tools"><label><input type="checkbox" id="selectAllLayout" ${products.length && checked===products.length ? "checked" : ""}> Seleccionar todos (${checked}/${products.length})</label><button class="btn primary" id="sendLayoutQueue" ${checked ? "" : "disabled"}>Agregar ${checked} a cola</button></div>
       <div class="layout-product-list">${products.map(p=>`<label class="layout-product"><input type="checkbox" data-sign="${esc(String(p.signId || p.code))}" ${state.selectedLayout.has(String(p.signId || p.code)) ? "checked" : ""}><span><strong>${esc(p.name)}</strong><small>${esc(p.brand || "")} · Ítem ${esc(p.code)} · ${esc(p.listName || p.campaignName || "")}</small></span><b>${esc(p.price || "")}</b></label>`).join("") || `<p>No hay carteles cargados en esta categoría todavía.</p>`}</div>
       <p class="panorama-hint">Puedes seleccionar carteles y agregarlos a la cola. No se imprimen automáticamente.</p>`}
      <div class="layout-queue-bar"><span>Cola de impresión: <strong>${state.queue.length}</strong></span><button class="btn primary" id="goToQueue">Ver cola e imprimir</button></div>
    </section>`;
    document.getElementById("changeLocalTop").onclick = changeLocal;
    document.getElementById("layoutBack").onclick = () => activeGroup ? renderLayoutLegacy(activeZone) : zone ? renderLayoutLegacy() : renderMenu();
    document.getElementById("goToQueue").onclick = renderMain;
    const viewport = document.querySelector(".panorama-viewport");
    if (viewport) {
      let startDistance = 0, startZoom = state.layoutZoom;
      const distance = touches => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
      viewport.addEventListener("touchstart", e => {
        if (e.touches.length === 2) {
          startDistance = distance(e.touches);
          startZoom = state.layoutZoom;
        }
      }, {passive:true});
      viewport.addEventListener("touchmove", e => {
        if (e.touches.length === 2 && startDistance > 0) {
          e.preventDefault();
          state.layoutZoom = Math.max(.6, Math.min(2.8, startZoom * distance(e.touches) / startDistance));
          const map = document.getElementById("panoramaMap");
          if (map) map.style.transform = `scale(${state.layoutZoom})`;
          const pct = document.getElementById("layoutZoomPercent");
          if (pct) pct.textContent = `${Math.round(state.layoutZoom*100)}%`;
        }
      }, {passive:false});
      viewport.addEventListener("touchend", e => { if (e.touches.length < 2) startDistance = 0; }, {passive:true});
    }
    document.getElementById("zoomIn")?.addEventListener("click",()=>{state.layoutZoom=Math.min(2.8,Math.round((state.layoutZoom+.2)*10)/10);renderLayoutLegacy();});
    document.getElementById("zoomOut")?.addEventListener("click",()=>{state.layoutZoom=Math.max(.6,Math.round((state.layoutZoom-.2)*10)/10);renderLayoutLegacy();});
    document.querySelectorAll("[data-zone]").forEach(b=>b.onclick=()=>renderLayoutLegacy(b.dataset.zone));
    document.querySelectorAll("[data-group]").forEach(b=>b.onclick=()=>renderLayoutLegacy(activeZone,b.dataset.group));
    document.querySelectorAll("[data-sign]").forEach(b=>b.onchange=()=>{if(b.checked)state.selectedLayout.add(b.dataset.sign);else state.selectedLayout.delete(b.dataset.sign);renderLayoutLegacy(activeZone,activeGroup);});
    const selectAll=document.getElementById("selectAllLayout");
    if(selectAll)selectAll.onchange=()=>{products.forEach(p=>{const id=String(p.signId||p.code);if(selectAll.checked)state.selectedLayout.add(id);else state.selectedLayout.delete(id)});renderLayoutLegacy(activeZone,activeGroup);};
    const send=document.getElementById("sendLayoutQueue");
    if(send)send.onclick=()=>{
      const chosen=products.filter(p=>state.selectedLayout.has(String(p.signId||p.code)));
      const bad=chosen.flatMap(p=>rules.validate(p).map(error=>`Ítem ${p.code}: ${error}`));
      if(bad.length){window.alert('No es posible agregar carteles con datos incompletos:\n'+bad.slice(0,10).join('\n'));return;}
      chosen.forEach(p=>state.queue.push({...p,qid:Date.now()+Math.random()}));
      saveQueue();chosen.forEach(p=>state.selectedLayout.delete(String(p.signId||p.code)));renderMain();
    };
  }


  // V31: vista exclusivamente basada en el OCCAM SBA. G=Subgrupo, I=Categoría.
  // Los artículos OCCAM no se envían a imprimir sin match inequívoco con el response técnico.
  const occamSba = (window.CARTELERIA_OCCAM_SBA || []).filter(p => p.formato === 'SBA');
  const occamSelected = new Set();
  const groupLabel = text => String(text || '').trim() || 'Sin clasificar';
  const occamGroups = [...new Set(occamSba.map(p=>groupLabel(p.subgrupo)))].sort((a,b)=>a.localeCompare(b,'es'));
  const same = (a,b)=>groupLabel(a)===groupLabel(b);
  function renderLayout(activeGroup=null,activeCategory=null) {
    if (!state.local) return landing();
    loadQueue();
    const items=activeGroup?occamSba.filter(p=>same(p.subgrupo,activeGroup)):occamSba;
    const cats=[...new Set(items.map(p=>groupLabel(p.categoria)))].sort((a,b)=>a.localeCompare(b,'es'));
    const hasCategoryStep=cats.length>=4;
    const listing=activeGroup ? (hasCategoryStep && !activeCategory ? null : activeCategory?items.filter(p=>same(p.categoria,activeCategory)):items) : null;
    const checked=(listing||[]).filter(p=>occamSelected.has(p.layoutId)).length;
    const fmt=n=>Number.isFinite(n)?('$'+Math.round(n).toLocaleString('es-CL')):'Precio sin verificar';
    const groupTitle=activeGroup ? `${esc(activeGroup)} · ${items.length} productos`:'';
    app.innerHTML=`${header()}<section class="screen panorama-screen">
      <div class="panorama-head"><button class="btn back-home" id="layoutBack">← ${listing?'Volver':activeGroup?'Subgrupos':'Menú'}</button>
        <div><h1>Layout panorámico promociones</h1><p>OCCAM · Solo SBA · ${occamSba.length} registros · Subgrupo (G) y Categoría (I)</p></div></div>
      ${!activeGroup?`<div class="panorama-tools"><span>Agrupadores por subgrupo (columna G)</span><div><button class="btn" id="zoomOut">−</button><strong id="layoutZoomPercent">${Math.round(state.layoutZoom*100)}%</strong><button class="btn" id="zoomIn">+</button></div></div>
      <div class="panorama-viewport" id="occamViewport" tabindex="0" aria-label="Mapa desplazable de subgrupos"><div class="panorama-map" id="panoramaMap" style="zoom:${state.layoutZoom}">
      <div class="panorama-entrance">SUBGRUPOS DE PROMOCIONES SBA</div>
      ${occamGroups.map(g=>`<button class="panorama-zone" data-subgroup="${esc(g)}"><strong>${esc(g)}</strong><span>${occamSba.filter(p=>same(p.subgrupo,g)).length} productos</span></button>`).join('')}</div></div>
      `:
      listing===null ? `<div class="panorama-breadcrumb">${groupTitle} › Categorías</div>
      <div class="category-grid">${cats.map(c=>`<button class="category-tile" data-category="${esc(c)}"><strong>${esc(c)}</strong><span>${items.filter(p=>same(p.categoria,c)).length} productos</span></button>`).join('')}</div>`:
      `<div class="panorama-breadcrumb">${groupTitle}${activeCategory?' › '+esc(activeCategory):''} · ${listing.length} productos</div>
      <div class="selection-tools"><label><input type="checkbox" id="selectAllOccam" ${listing.length&&checked===listing.length?'checked':''}> Seleccionar todos (${checked}/${listing.length})</label><button class="btn primary" id="sendOccam" ${checked?'':'disabled'}>Enviar ${checked} a cola</button></div>
      <div class="layout-product-list">${listing.map(p=>`<label class="layout-product"><input type="checkbox" data-occam="${esc(p.layoutId)}" ${occamSelected.has(p.layoutId)?'checked':''}><span><strong>${esc(p.nombre||'Sin descripción')}</strong><small>${esc(p.marca)} · ${esc(p.contenido)} · Producto ${esc(p.codigo)} · ${esc(p.mecanica)} · ${esc(p.categoria)}</small><small>${(catalog.find(c=>String(c.signId)===String(p.matchSignId)&&String(c.campaignId)===String(p.matchCampaignId))?.dataIssues||[]).length ? 'Revisar datos antes de imprimir' : 'Ficha generada desde OCCAM SBA'}</small></span><b>${fmt(p.precioPromo)}</b></label>`).join('')}</div>
      <p class="panorama-hint">Fichas construidas con OCCAM SBA. Los registros con datos inconsistentes se bloquean para evitar errores de impresión.</p>`}
      <div class="layout-queue-bar"><span>Cola existente: <strong>${state.queue.length}</strong></span><button class="btn primary" id="goToQueue">Ver cola e imprimir</button></div></section>`;
    document.getElementById('changeLocalTop').onclick=changeLocal;
    document.getElementById('layoutBack').onclick=()=>{
      if(listing)hasCategoryStep&&activeCategory?renderLayout(activeGroup):renderLayout();
      else if(activeGroup)renderLayout();else renderMenu();
    };
    document.getElementById('goToQueue').onclick=renderMain;
    document.querySelectorAll('[data-subgroup]').forEach(b=>b.onclick=()=>renderLayout(b.dataset.subgroup));
    document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>renderLayout(activeGroup,b.dataset.category));
    // Zoom que cambia también el tamaño desplazable: no usar transform:scale.
    const viewport=document.getElementById('occamViewport');
    const map=document.getElementById('panoramaMap');
    function zoomLayout(next,clientX,clientY){
      const bounded=Math.max(.65,Math.min(2.6,Math.round(next*100)/100));
      if(!viewport||!map||bounded===state.layoutZoom)return;
      const old=state.layoutZoom;
      const bounds=viewport.getBoundingClientRect();
      const px=(clientX===undefined?bounds.left+bounds.width/2:clientX)-bounds.left;
      const py=(clientY===undefined?bounds.top+bounds.height/2:clientY)-bounds.top;
      const contentX=(viewport.scrollLeft+px)/old;
      const contentY=(viewport.scrollTop+py)/old;
      state.layoutZoom=bounded;
      map.style.zoom=String(bounded);
      document.getElementById('layoutZoomPercent').textContent=Math.round(bounded*100)+'%';
      viewport.scrollLeft=contentX*bounded-px;
      viewport.scrollTop=contentY*bounded-py;
    }
    document.getElementById('zoomIn')?.addEventListener('click',()=>zoomLayout(state.layoutZoom+.2));
    document.getElementById('zoomOut')?.addEventListener('click',()=>zoomLayout(state.layoutZoom-.2));
    if(viewport){
      // El desplazamiento táctil con un dedo permanece nativo y fluido.
      let pinchStart=0,zoomStart=1;
      const touchDistance=ts=>Math.hypot(ts[0].clientX-ts[1].clientX,ts[0].clientY-ts[1].clientY);
      viewport.addEventListener('touchstart',e=>{
        if(e.touches.length===2){pinchStart=touchDistance(e.touches);zoomStart=state.layoutZoom;}
      },{passive:true});
      viewport.addEventListener('touchmove',e=>{
        if(e.touches.length===2&&pinchStart){
          e.preventDefault();
          const midX=(e.touches[0].clientX+e.touches[1].clientX)/2;
          const midY=(e.touches[0].clientY+e.touches[1].clientY)/2;
          zoomLayout(zoomStart*touchDistance(e.touches)/pinchStart,midX,midY);
        }
      },{passive:false});
      viewport.addEventListener('touchend',e=>{if(e.touches.length<2)pinchStart=0;},{passive:true});
      viewport.addEventListener('wheel',e=>{
        if(e.ctrlKey||e.metaKey){e.preventDefault();zoomLayout(state.layoutZoom*(e.deltaY>0?.9:1.1),e.clientX,e.clientY);}
      },{passive:false});
      // Desktop: arrastrar el fondo, sin bloquear clics sobre las tarjetas.
      let drag=null;
      viewport.addEventListener('pointerdown',e=>{
        if(e.pointerType==='mouse'&&e.button===0&&!e.target.closest('button')){
          drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
          viewport.setPointerCapture(e.pointerId);
          viewport.classList.add('is-dragging');
        }
      });
      viewport.addEventListener('pointermove',e=>{
        if(drag){viewport.scrollLeft=drag.left-(e.clientX-drag.x);viewport.scrollTop=drag.top-(e.clientY-drag.y);}
      });
      const endDrag=()=>{drag=null;viewport.classList.remove('is-dragging');};
      viewport.addEventListener('pointerup',endDrag);
      viewport.addEventListener('pointercancel',endDrag);
      viewport.addEventListener('keydown',e=>{
        const steps={ArrowLeft:[-90,0],ArrowRight:[90,0],ArrowUp:[0,-90],ArrowDown:[0,90]};
        if(steps[e.key]){e.preventDefault();viewport.scrollBy({left:steps[e.key][0],top:steps[e.key][1],behavior:'smooth'});}
      });
    }
    document.querySelectorAll('[data-occam]').forEach(b=>b.onchange=()=>{if(b.checked)occamSelected.add(b.dataset.occam);else occamSelected.delete(b.dataset.occam);renderLayout(activeGroup,activeCategory);});
    document.getElementById('selectAllOccam')?.addEventListener('change',e=>{
      listing.forEach(p=>{if(e.target.checked)occamSelected.add(p.layoutId);else occamSelected.delete(p.layoutId)});
      renderLayout(activeGroup,activeCategory);
    });
    document.getElementById('sendOccam')?.addEventListener('click',()=>{
      const selected=listing.filter(p=>occamSelected.has(p.layoutId));
      const resolved=selected.map(p=>({row:p,sign:catalog.find(c=>String(c.signId)===String(p.matchSignId)&&String(c.campaignId)===String(p.matchCampaignId))}));
      const invalid=resolved.filter(({sign})=>!sign||rules.validate(sign).length);
      const printable=resolved.filter(({sign})=>sign && rules.validate(sign).length===0);
      if(!printable.length){window.alert('Ninguno de los carteles seleccionados puede imprimirse todavía: faltan o contradicen datos de OCCAM.');return;}
      printable.forEach(({sign})=>state.queue.push({...sign,qid:Date.now()+Math.random()}));
      printable.forEach(({row})=>occamSelected.delete(row.layoutId));
      saveQueue();
      if(invalid.length)window.alert(`${printable.length} carteles válidos agregados a la cola. ${invalid.length} requieren revisión y NO se agregaron.`);
      renderMain();
    });
  }

  function renderMain() {
    if (!state.local) return landing();
    loadQueue();
    app.innerHTML = `
      ${header()}
      <section class="screen">
        <div class="search-card">
          <div class="search-head">
            <h2>Ingresar ítem</h2>
            <button class="btn back-home" id="backHome" type="button">Volver a inicio</button>
          </div>
          <form id="searchForm" class="search-row" autocomplete="off">
            <input id="itemInput" inputmode="numeric" pattern="[0-9]*" placeholder="Ingresar ítem" value="${esc(state.itemCode)}">
            <button class="btn search" type="submit">Buscar</button>
          </form>
          ${isMobileDevice() ? `<button class="btn scan-item-btn" id="scanItemBtn" type="button">▣ Escanear ítem</button>` : ""}
          <div id="searchStatus"></div>
        </div>

        <section id="previewArea"></section>

        <section class="queue-section">
          <div class="section-title">
            <div class="queue-title-group">
              <h2>Cola de impresión</h2>
              <span class="count">${state.queue.length}</span>
            </div>
            <button class="btn print print-inline" id="printBtn" type="button" ${state.queue.length ? "" : "disabled"}>
              Imprimir cola
            </button>
          </div>
          <div id="queueList"></div>
          <button class="btn clear-queue-bottom" id="clearQueue" type="button" ${state.queue.length ? "" : "disabled"}>
            Borrar toda la cola
          </button>
        </section>
      </section>
    `;

    document.getElementById("searchForm").addEventListener("submit", e => {
      e.preventDefault();
      searchItem();
    });
    if (isMobileDevice()) {
      document.getElementById("scanItemBtn")?.addEventListener("click", () => openCameraScanner("item"));
    }
    document.getElementById("backHome").addEventListener("click", renderMenu);
    document.getElementById("changeLocalTop").addEventListener("click", changeLocal);
    const printBtn = document.getElementById("printBtn");
    // Tanto PC como móvil abren la selección de impresora.
    // En PC se conserva exactamente la ruta v18.
    // En móvil se ofrecen Tamaño Carta + RF móvil.
    printBtn.addEventListener("click", renderPrintOptions);
    document.getElementById("clearQueue").addEventListener("click", () => {
      if (!state.queue.length) return;
      if (!window.confirm("¿Borrar todos los carteles de la cola de impresión?")) return;

      state.queue = [];
      saveQueue();
      renderQueue();
      renderPreview();
    });

    renderPreview();
    renderQueue();
  }

  function changeLocal() {
    state.local = "";
    state.itemCode = "";
    state.product = null;
    state.queue = [];
    localStorage.removeItem("carteleria.local");
    landing();
  }

  function searchItem() {
    const input = document.getElementById("itemInput");
    const code = input.value.trim();
    state.itemCode = code;
    const matches = catalog.filter(p => p.code === code || (isMobileDevice() && String(p.barcode || "") === code));
    state.product = matches.length === 1 ? matches[0] : null;
    const status = document.getElementById("searchStatus");
    if (matches.length > 1) {
      status.innerHTML = `<div class="status error">Se encontró el ítem en varias campañas. Abre «Layout panorámico promociones» para elegir la campaña.</div>`;
      renderPreview();
      return;
    }

    if (!code) {
      status.innerHTML = "";
      renderPreview();
      return;
    }

    if (!state.product) {
      status.innerHTML = `<div class="status error">Ítem no encontrado en el piloto.</div>`;
    } else {
      status.innerHTML = `<div class="status ok">✓ Producto encontrado <small>Ítem ${esc(state.product.code)} · ${esc(state.product.brand || "")}</small></div>`;
    }
    renderPreview();
  }

  function money(n) {
    return "$" + Math.round(Number(n || 0)).toLocaleString("es-CL");
  }

  function posterProductName(p) {
    const n = String(p.name || "").trim();
    const z = String(p.size || "").trim();
    if (!z || n.toUpperCase().includes(z.toUpperCase())) return n;
    return `${n} ${z}`;
  }

  function unitPriceText(p) { return rules.unitMeasurePrice(p); }

  function categoryText(p) {
    return p.categoryId && p.categoryName ? `${p.categoryId} - ${p.categoryName}` : 'CATEGORÍA SIN CONFIRMAR';
  }

  function campaignText(p) {
    return p.campaignName || (p.type === "normal" ? "LISTA 3 BARATO TODOS LOS DIAS" : "LISTA 3 SBA - AHORA MAS BARATO");
  }

  function promoLine(p) {
    if (p.type === "offer") {
      const values=rules.calc(p);
      const normal = values.before;
      const ahorro = values.saving.replace(/^Ahorro\s*:?[ ]*/i, "");
      return `<div class="promo-strip offer-strip"><svg class="promo-strip-bg" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="0" width="100" height="20" fill="#000"/></svg><span>Normal: ${esc(normal)}</span><span>Ahorro: ${esc(ahorro)}</span></div>`;
    }
    if (p.type === "nx") {
      const values=rules.calc(p);
      const unitario = values.unitLabel.replace(/^P\.\s*unitario\s*:?[ ]*/i, "");
      const ahorro = values.saving.replace(/^Ahorro\s*:?[ ]*/i, "");
      return `<div class="promo-strip nx-strip"><svg class="promo-strip-bg" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="0" width="100" height="20" fill="#000"/></svg><span>P. unitario: ${esc(unitario)}</span><span>Ahorro: ${esc(ahorro)}</span></div>`;
    }
    return "";
  }

  function priceMarkup(p) {
    const txt = rules.calc(p).price;
    if (p.type === "nx") return `<div class="price nx-main-price">${esc(txt)}</div>`;
    const amount = txt.replace(/^\$/, "");
    return `<div class="price standard-main-price"><span class="currency">$</span><span class="price-amount">${esc(amount)}</span></div>`;
  }

  function campaignValidity(p) {
    // Texto exacto acordado, con mes en español y fechas del response.
    return rules.validity(p) || 'Vigencia: SIN DATOS — NO IMPRIMIR';
  }

  function productCard(p, mode="preview") {
    const violations = rules.validate(p);
    if (violations.length) return `<article class="poster-blocked">CARTEL BLOQUEADO · Ítem ${esc(p.code || '?')}<small>${esc(violations.join('; '))}</small></article>`;
    const unitText = unitPriceText(p);
    return `
      <article class="poster ${mode} ${p.type}">
        <div class="poster-inner">
          <div class="price-block">
            ${priceMarkup(p)}
            <div class="payment-line">pagando con todo medio de pago</div>
            ${promoLine(p)}
          </div>

          <div class="product-block">
            <div class="product-name">${esc(posterProductName(p))}</div>
            <div class="product-brand">${esc(p.brand || "")}</div>
            ${unitText ? `<div class="unit-price">${esc(unitText)}</div>` : ""}
          </div>

          <div class="poster-bottom">
            <div class="barcode-zone">
              ${ean13Svg(p.barcode || p.code)}
              <div class="barcode-number">${esc(p.barcode || p.code)}</div>
              <div class="footer-info">Destacado: ${esc(campaignText(p))} &nbsp; Item: ${esc(p.code)}</div>
              <div class="footer-info">Categoría: ${esc(categoryText(p))}</div>
              <div class="footer-info local-line">Local: ${esc(state.local)}</div>
            </div>
            <div class="validity">${esc(campaignValidity(p))}</div>
          </div>
        </div>
      </article>
    `;
  }

  function ean13Svg(value) {
    const code = String(value || "").replace(/\D/g, "");
    if (code.length !== 13) return fallbackBars(code);

    const L = {
      0:"0001101",1:"0011001",2:"0010011",3:"0111101",4:"0100011",
      5:"0110001",6:"0101111",7:"0111011",8:"0110111",9:"0001011"
    };
    const G = {
      0:"0100111",1:"0110011",2:"0011011",3:"0100001",4:"0011101",
      5:"0111001",6:"0000101",7:"0010001",8:"0001001",9:"0010111"
    };
    const R = {
      0:"1110010",1:"1100110",2:"1101100",3:"1000010",4:"1011100",
      5:"1001110",6:"1010000",7:"1000100",8:"1001000",9:"1110100"
    };
    const parity = {
      0:"LLLLLL",1:"LLGLGG",2:"LLGGLG",3:"LLGGGL",4:"LGLLGG",
      5:"LGGLLG",6:"LGGGLL",7:"LGLGLG",8:"LGLGGL",9:"LGGLGL"
    };
    const first = Number(code[0]);
    let bits = "101";
    for (let i=1; i<=6; i++) {
      const n = Number(code[i]);
      bits += parity[first][i-1] === "L" ? L[n] : G[n];
    }
    bits += "01010";
    for (let i=7; i<=12; i++) bits += R[Number(code[i])];
    bits += "101";

    const module = 1.05;
    let bars = "";
    for (let i=0; i<bits.length; i++) {
      if (bits[i] === "1") {
        const guard = i < 3 || (i >= 45 && i < 50) || i >= 92;
        bars += `<rect x="${(i*module).toFixed(2)}" y="0" width="${module.toFixed(2)}" height="${guard ? 28 : 24}"/>`;
      }
    }
    return `<svg class="barcode" viewBox="0 0 100 28" role="img" aria-label="Código de barras ${esc(code)}">${bars}</svg>`;
  }

  function fallbackBars(code) {
    const digits = String(code || "").replace(/\D/g, "");
    let bars = "";
    let x = 3;
    for (let i=0; i<digits.length*3+12; i++) {
      const d = Number(digits[i % Math.max(digits.length,1)] || 1);
      const w = ((d + i) % 3) + 1;
      if (i % 2 === 0) bars += `<rect x="${x}" y="1" width="${w}" height="${18 + (i%3)*2}"/>`;
      x += w + 1;
      if (x > 94) break;
    }
    return `<svg class="barcode" viewBox="0 0 100 24">${bars}</svg>`;
  }

  function renderPreview() {
    const area = document.getElementById("previewArea");
    if (!area) return;

    if (!state.product) {
      area.innerHTML = "";
      return;
    }

    area.innerHTML = `
      <div class="preview-block">
        ${productCard(state.product, "preview")}
        ${rules.validate(state.product).length ? `<div class="status error">No se puede imprimir: ${esc(rules.validate(state.product).join('; '))}</div>` : ''}
        <button class="btn add" id="addQueue" type="button" ${rules.validate(state.product).length ? 'disabled' : ''}>Agregar a cola</button>
      </div>
    `;

    document.getElementById("addQueue").addEventListener("click", () => {
      if (rules.validate(state.product).length) return window.alert('Cartel con datos por revisar.');
      state.queue.push({...state.product, qid: Date.now() + Math.random()});
      saveQueue();

      // Flujo continuo: agrega el cartel y deja el campo listo para el próximo.
      state.product = null;
      state.itemCode = "";

      const input = document.getElementById("itemInput");
      if (input) {
        input.value = "";
        input.focus();
      }
      const status = document.getElementById("searchStatus");
      if (status) status.innerHTML = "";

      renderPreview();
      renderQueue();
    });


  }

  function renderQueue() {
    const list = document.getElementById("queueList");
    const count = document.querySelector(".count");
    const printBtn = document.getElementById("printBtn");
    const clearQueueBtn = document.getElementById("clearQueue");
    if (!list) return;

    if (count) count.textContent = state.queue.length;
    if (printBtn) {
      printBtn.disabled = !state.queue.length || printErrors().length > 0;
      printBtn.textContent = printErrors().length ? `Revisar ${printErrors().length} dato(s)` : 'Imprimir cola';
    }
    if (clearQueueBtn) {
      clearQueueBtn.disabled = !state.queue.length;
    }

    if (!state.queue.length) {
      list.innerHTML = `<div class="empty-queue">La cola está vacía.</div>`;
      return;
    }

    list.innerHTML = state.queue.map((p, i) => `
      <div class="queue-item">
        <div class="queue-mini">${productCard(p, "mini")}</div>
        <div class="queue-copy">
          <strong>${esc(p.price)}</strong>
          <span>Ítem ${esc(p.code)}</span>
          <small>${esc(p.name)}</small>
        </div>
        <button class="remove" data-index="${i}" type="button" aria-label="Eliminar de la cola">×</button>
      </div>
    `).join("");

    list.querySelectorAll(".remove").forEach(btn => btn.addEventListener("click", () => {
      state.queue.splice(Number(btn.dataset.index), 1);
      saveQueue();
      renderQueue();
    }));
  }


  let scannerStream = null;
  let scannerTimer = null;

  function closeCameraScanner() {
    if (scannerTimer) { clearTimeout(scannerTimer); scannerTimer = null; }
    if (scannerStream) {
      scannerStream.getTracks().forEach(t => t.stop());
      scannerStream = null;
    }
    document.getElementById("cameraScanner")?.remove();
  }

  function normalizeMac(value="") {
    return String(value).toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 12);
  }

  async function openCameraScanner(mode="item") {
    closeCameraScanner();
    const title = mode === "mac" ? "Escanear código de impresora" : "Escanear ítem";
    const hint = mode === "mac" ? "Apunta al código de la Zebra que contiene la MAC." : "Apunta al código de barras del producto.";
    document.body.insertAdjacentHTML("beforeend", `
      <div class="camera-scanner" id="cameraScanner">
        <div class="camera-card">
          <div class="camera-head"><strong>${title}</strong><button id="closeCameraScanner" type="button">×</button></div>
          <video id="scannerVideo" playsinline muted></video>
          <div class="camera-target"></div>
          <p>${hint}</p>
          <div id="scannerStatus" class="scanner-status">Abriendo cámara…</div>
          <button class="btn back-home" id="cancelScanner" type="button">Cancelar</button>
        </div>
      </div>`);

    document.getElementById("closeCameraScanner").onclick = closeCameraScanner;
    document.getElementById("cancelScanner").onclick = closeCameraScanner;
    const status = document.getElementById("scannerStatus");
    const video = document.getElementById("scannerVideo");

    try {
      scannerStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}, audio:false});
      video.srcObject = scannerStream;
      await video.play();
      status.textContent = "Buscando código…";

      if (!("BarcodeDetector" in window)) {
        status.textContent = "Este navegador no permite lectura automática. Usa ingreso manual.";
        return;
      }

      const supported = await BarcodeDetector.getSupportedFormats().catch(() => []);
      const wanted = mode === "mac"
        ? ["qr_code","code_128","data_matrix","aztec","code_39"].filter(f => supported.includes(f))
        : ["ean_13","ean_8","upc_a","upc_e","code_128","qr_code"].filter(f => supported.includes(f));
      const detector = new BarcodeDetector(wanted.length ? {formats:wanted} : undefined);

      const scan = async () => {
        if (!document.getElementById("cameraScanner")) return;
        try {
          const codes = await detector.detect(video);
          if (codes && codes.length) {
            const raw = String(codes[0].rawValue || "").trim();
            if (mode === "mac") {
              const mac = normalizeMac(raw);
              if (mac.length !== 12) {
                status.textContent = `Código leído (${raw}), pero no contiene una MAC válida de 12 caracteres.`;
              } else {
                state.mobileMac = mac;
      localStorage.setItem(MOBILE_MAC_KEY, mac);
                closeCameraScanner();
                renderRFMobileSetup(mac);
                return;
              }
            } else {
              closeCameraScanner();
              const input = document.getElementById("itemInput");
              if (input) { input.value = raw; state.itemCode = raw; searchItem(); }
              return;
            }
          }
        } catch (e) {}
        scannerTimer = setTimeout(scan, 180);
      };
      scan();
    } catch (error) {
      status.textContent = "No se pudo abrir la cámara. Revisa el permiso de cámara de Chrome.";
    }
  }

  function saveMobileMac() {
    const input = document.getElementById("mobileMacInput");
    const mac = normalizeMac(input?.value || "");
    if (input) input.value = mac;
    if (mac.length === 12) {
      state.mobileMac = mac;
      localStorage.setItem(MOBILE_MAC_KEY, mac);
      const s = document.getElementById("mobileRFStatus");
      if (s) { s.className = "rf-status ok"; s.textContent = `✓ Impresora guardada: ${mac}`; }
      return mac;
    }
    const s = document.getElementById("mobileRFStatus");
    if (s) { s.className = "rf-status error"; s.textContent = "La MAC debe tener 12 caracteres hexadecimales."; }
    return "";
  }

  function renderRFMobileSetup(forcedMac="") {
    if (!state.queue.length) return renderMain();
    const savedMac = normalizeMac(forcedMac || state.mobileMac || localStorage.getItem(MOBILE_MAC_KEY) || "");
    if (savedMac.length === 12) {
      state.mobileMac = savedMac;
      localStorage.setItem(MOBILE_MAC_KEY, savedMac);
    }
    app.innerHTML = `
      ${header()}
      <section class="screen print-choice-screen mobile-rf-screen">
        <div class="print-choice-card rf-setup-card">
          <div class="print-choice-top">
            <div>
              <span class="print-choice-kicker">Modo móvil · Local ${esc(state.local)}</span>
              <h2>Impresora Portátil (RF)</h2>
              <p>En móvil no se solicita IP. Identifica la Zebra por su código MAC.</p>
            </div>
            <button class="btn back-home" id="backMobileRF" type="button">Volver</button>
          </div>

          <div class="rf-form-grid">
            <label class="rf-field">
              <span>Cartel a imprimir</span>
              <select id="rfItemSelect">
                ${state.queue.map((p,i) => `<option value="${i}">Ítem ${esc(p.code)} · ${esc(p.price)} · ${esc(p.name)}</option>`).join("")}
              </select>
            </label>

            <label class="rf-field">
              <span>MAC de impresora Zebra</span>
              <input id="mobileMacInput" autocomplete="off" autocapitalize="characters" maxlength="17" placeholder="Ej. 6095325D07AA" value="${esc(savedMac)}">
            </label>
            <div class="mobile-mac-actions">
              <button class="btn scan-item-btn" id="scanMacBtn" type="button">▣ Escanear MAC</button>
              <button class="btn ghost" id="saveMacBtn" type="button">Guardar MAC</button>
            </div>
          </div>

          <div class="rf-proof-box">
            <strong>Formato RF aprobado</strong>
            <span>58 mm de ancho útil · 2 flejes de 35 mm por cartel.</span>
            <span>Esta versión móvil no modifica el funcionamiento actual de PC.</span>
          </div>

          <div id="mobileRFStatus" class="rf-status ${savedMac ? "ok" : ""}">${savedMac ? `✓ Impresora guardada: ${esc(savedMac)}` : "Escanea o escribe la MAC de la impresora."}</div>

          <div class="rf-actions rf-actions-main">
            <button class="btn print" id="prepareMobileRF" type="button">Preparar impresión móvil</button>
          </div>
          <div id="mobilePrintInfo" class="mobile-print-info"></div>
        </div>
      </section>`;

    document.getElementById("changeLocalTop").addEventListener("click", changeLocal);
    document.getElementById("backMobileRF").addEventListener("click", () => {
      const input = document.getElementById("mobileMacInput");
      const mac = normalizeMac(input?.value || state.mobileMac || "");
      if (mac.length === 12) {
        state.mobileMac = mac;
        localStorage.setItem(MOBILE_MAC_KEY, mac);
      }
      renderMain();
    });
    document.getElementById("scanMacBtn").addEventListener("click", () => openCameraScanner("mac"));
    document.getElementById("saveMacBtn").addEventListener("click", saveMobileMac);
    document.getElementById("mobileMacInput").addEventListener("change", saveMobileMac);
    document.getElementById("mobileMacInput").addEventListener("input", (e) => {
      const mac = normalizeMac(e.target.value);
      if (mac.length === 12) {
        state.mobileMac = mac;
        localStorage.setItem(MOBILE_MAC_KEY, mac);
      }
    });
    document.getElementById("prepareMobileRF").addEventListener("click", () => {
      if (!ensureQueuePrintable()) return;
      const mac = saveMobileMac();
      if (!mac) return;
      const product = getRFSelection();
      const info = document.getElementById("mobilePrintInfo");
      if (info) info.innerHTML = `<strong>Listo para conexión móvil</strong><span>Ítem ${esc(product?.code || "")} · Zebra ${esc(mac)}</span><span>El ZPL de los 2 flejes ya está preparado. El siguiente paso es enlazar el canal Android → Zebra sin tocar la versión PC.</span>`;
    });
  }


  function renderPrintOptions() {
    if (!ensureQueuePrintable()) return;

    app.innerHTML = `
      ${header()}
      <section class="screen print-choice-screen">
        <div class="print-choice-card">
          <div class="print-choice-top">
            <div>
              <span class="print-choice-kicker">Cola de impresión · ${state.queue.length} cartel${state.queue.length === 1 ? "" : "es"}</span>
              <h2>Selecciona dónde imprimir</h2>
              <p>Elige el tipo de impresora que vas a utilizar.</p>
            </div>
            <button class="btn back-home" id="backToQueue" type="button">Volver a la cola</button>
          </div>

          <div class="printer-options">
            <button class="printer-option letter-option" id="printLetter" type="button">
              <span class="printer-option-icon" aria-hidden="true">▣</span>
              <span class="printer-option-copy">
                <strong>Impresora Tamaño Carta</strong>
                <small>${isMobileDevice() ? "Envío remoto al PC del local · selecciona la impresora por IP" : "Impresora fija · mantiene la configuración actual de impresión"}</small>
              </span>
              <span class="printer-option-arrow" aria-hidden="true">›</span>
            </button>

            <button class="printer-option rf-option" id="printRF" type="button">
              <span class="printer-option-icon" aria-hidden="true">▤</span>
              <span class="printer-option-copy">
                <strong>Impresora Portátil (RF)</strong>
                <small>${isMobileDevice() ? "Modo móvil · MAC Zebra · flujo RF en prueba" : "Impresión desde equipo portátil · configuración RF por puente local"}</small>
              </span>
              <span class="printer-option-arrow" aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </section>
    `;

    document.getElementById("changeLocalTop").addEventListener("click", changeLocal);
    document.getElementById("backToQueue").addEventListener("click", renderMain);
    document.getElementById("printLetter").addEventListener("click", () => {
      if (isMobileDevice()) {
        renderLetterMobileSetup();
      } else {
        // Escritorio conserva exactamente la impresión Carta local ya aprobada.
        printQueue();
      }
    });
    document.getElementById("printRF").addEventListener("click", () => {
      if (isMobileDevice()) {
        renderRFMobileSetup();
      } else {
        // Escritorio conserva exactamente la ruta RF v18 por puente local.
        renderRFSetup();
      }
    });
  }


  function cartaIpStorageKey() {
    return `carteleria.carta.ip.${state.local || "sin-local"}`;
  }

  function normalizePrinterIp(value="") {
    return String(value).trim().replace(/\s+/g, "");
  }

  function isValidIpv4(value="") {
    const ip = normalizePrinterIp(value);
    const parts = ip.split(".");
    return parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
  }

  function buildLetterPrintPages() {
    const chunks = [];
    for (let i=0; i<state.queue.length; i += 4) chunks.push(state.queue.slice(i, i+4));

    return chunks.map((chunk, pageIndex) => `
      <section class="print-page ${pageIndex < chunks.length-1 ? "page-break" : ""}">
        ${[0,1,2,3].map(i => `
          <div class="print-cell">
            ${chunk[i] ? productCard(chunk[i], "print") : ""}
          </div>
        `).join("")}
      </section>
    `).join("");
  }

  function buildRemoteLetterHtml(printCss) {
    // v23: la hoja de estilos viaja DENTRO del trabajo.
    // El PC ya no depende de Render para cargar styles.css al momento de imprimir.
    // Esto conserva exactamente la maqueta Carta aprobada: 4 por hoja + subida de 10 mm.
    const pages = buildLetterPrintPages();
    const embeddedCss = String(printCss || "").replace(/<\/style/gi, "<\\/style");
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Cartelería · Local ${esc(state.local)}</title>
  <style>${embeddedCss}</style>
  <style>
    html,body{margin:0!important;padding:0!important;background:#fff!important}
    #remoteInfo{display:none!important}
    @media screen{#printRoot{display:block!important}}
  </style>
</head>
<body>
  <div id="app"></div>
  <div id="printRoot">${pages}</div>
  <script>
    window.addEventListener('load', function(){
      setTimeout(function(){ window.print(); }, 350);
    });
    window.addEventListener('afterprint', function(){
      setTimeout(function(){ window.close(); }, 400);
    });
  <\/script>
</body>
</html>`;
  }

  function setLetterRemoteStatus(message, kind="") {
    const box = document.getElementById("letterRemoteStatus");
    if (!box) return;
    box.className = `rf-status ${kind}`.trim();
    box.textContent = message;
  }

  async function sendLetterRemoteJob() {
    if (!ensureQueuePrintable()) return;

    const input = document.getElementById("letterPrinterIp");
    const button = document.getElementById("sendLetterRemote");
    const printerIp = normalizePrinterIp(input?.value || "");

    if (!isValidIpv4(printerIp)) {
      setLetterRemoteStatus("Ingresa una IP válida de la impresora Tamaño Carta.", "error");
      input?.focus();
      return;
    }

    localStorage.setItem(cartaIpStorageKey(), printerIp);
    if (button) button.disabled = true;
    setLetterRemoteStatus(`Enviando ${state.queue.length} cartel${state.queue.length === 1 ? "" : "es"} al local ${state.local}…`, "working");

    try {
      // Se toma la CSS de la misma versión que el usuario tiene abierta en el móvil
      // y se incrusta en el HTML. Si no puede cargarse, NO se manda un trabajo incompleto.
      const cssResponse = await fetch("styles.css", {cache: "no-store"});
      if (!cssResponse.ok) throw new Error(`No se pudo preparar el formato Carta (CSS ${cssResponse.status})`);
      const printCss = await cssResponse.text();
      if (!printCss.includes("@media print") || !printCss.includes(".print-cell")) {
        throw new Error("La hoja de estilos de impresión no es válida");
      }

      const payload = {
        kind: "carta_html",
        version: "v23",
        local: String(state.local),
        printer_ip: printerIp,
        cantidad: state.queue.length,
        html: buildRemoteLetterHtml(printCss)
      };

      const response = await fetch(`${CARTA_REMOTE_URL}/trabajo`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          local: String(state.local),
          printer_ip: printerIp,
          contenido: JSON.stringify(payload)
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);

      setLetterRemoteStatus(`✓ Trabajo ${data.id} enviado al local ${state.local} · impresora ${printerIp}`, "ok");
      const info = document.getElementById("letterRemoteInfo");
      if (info) {
        info.innerHTML = `<strong>Enviado correctamente</strong><span>El PC del local ${esc(state.local)} recibirá la cola y la enviará a la impresora ${esc(printerIp)}.</span><span>La cola del teléfono se mantiene para permitir una reimpresión si fuera necesario.</span>`;
      }
    } catch (error) {
      setLetterRemoteStatus(`No se pudo enviar la impresión: ${error.message || "error de conexión"}`, "error");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderLetterMobileSetup() {
    if (!state.queue.length) return renderMain();

    const savedIp = localStorage.getItem(cartaIpStorageKey()) || "";
    app.innerHTML = `
      ${header()}
      <section class="screen print-choice-screen mobile-letter-screen">
        <div class="print-choice-card rf-setup-card">
          <div class="print-choice-top">
            <div>
              <span class="print-choice-kicker">Tamaño Carta · Local ${esc(state.local)}</span>
              <h2>Enviar a impresora del local</h2>
              <p>Indica la IP de la impresora. El teléfono envía la cola a Cloudflare y el PC del local la imprime automáticamente.</p>
            </div>
            <button class="btn back-home" id="backMobileLetter" type="button">Volver</button>
          </div>

          <div class="rf-form-grid letter-remote-grid">
            <label class="rf-field">
              <span>IP impresora Tamaño Carta</span>
              <input id="letterPrinterIp" inputmode="decimal" autocomplete="off" placeholder="Ej. 22.117.224.123" value="${esc(savedIp)}">
            </label>
          </div>

          <div class="rf-proof-box">
            <strong>Destino remoto</strong>
            <span>Local ${esc(state.local)} identifica el PC receptor. La IP identifica cuál impresora instalada en ese PC debe usar.</span>
            <span>La última IP usada queda guardada en este teléfono para este local.</span>
          </div>

          <div id="letterRemoteStatus" class="rf-status">Listo para enviar ${state.queue.length} cartel${state.queue.length === 1 ? "" : "es"}.</div>

          <div class="rf-actions rf-actions-main">
            <button class="btn print" id="sendLetterRemote" type="button">Enviar impresión Tamaño Carta</button>
          </div>

          <div id="letterRemoteInfo" class="rf-pending-box letter-remote-info">
            <strong>Formato conservado</strong>
            <span>4 carteles por hoja y desplazamiento de 10 mm hacia arriba, igual a la impresión Carta ya aprobada.</span>
          </div>
        </div>
      </section>`;

    document.getElementById("changeLocalTop").addEventListener("click", changeLocal);
    document.getElementById("backMobileLetter").addEventListener("click", renderPrintOptions);
    document.getElementById("sendLetterRemote").addEventListener("click", sendLetterRemoteJob);
    document.getElementById("letterPrinterIp").addEventListener("change", (e) => {
      const ip = normalizePrinterIp(e.target.value);
      e.target.value = ip;
      if (isValidIpv4(ip)) localStorage.setItem(cartaIpStorageKey(), ip);
    });
  }

  function rfStorageKey(name) {
    return `carteleria.rf.${name}.${state.local || "sin-local"}`;
  }

  function rfAscii(value="") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\^~]/g, " ")
      .replace(/[^\x20-\x7E]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildRFZpl(p) {
    // Formato RF v18: un cartel se compone de DOS flejes fisicos.
    // Cada fleje usa 58 mm de ancho util x 35 mm de alto.
    // Al instalar el cartel, se deja aprox. 5 mm de separacion entre ambos flejes.
    const widthDots = 464;   // 58 mm a 203 dpi (~8 dots/mm)
    const flejeDots = 280;   // 35 mm a 203 dpi

    const name = rfAscii(posterProductName(p)).slice(0, 30);
    const brand = rfAscii(p.brand || "").slice(0, 18);
    const size = rfAscii(p.size || "").slice(0, 12);
    const price = rfAscii(p.price || "");
    const code = rfAscii(p.code || "");
    const local = rfAscii(state.local || "");
    const note = rfAscii(p.note || p.saving || p.unitLabel || "").slice(0, 38);
    const barcode = String(p.barcode || "").replace(/\D/g, "");

    // FLEJE 1: promo/precio grande. Se usa practicamente completo para impacto visual.
    const top = `^XA
^PW${widthDots}
^LL${flejeDots}
^LH0,0
^FO16,18^GB432,2,2^FS
^FO16,48^A0N,30,30^FB432,1,0,C,0^FDPRECIO / PROMO^FS
^FO12,92^A0N,82,74^FB440,1,0,C,0^FD${price}^FS
^FO16,220^A0N,19,19^FB432,1,0,C,0^FDPAGANDO CON TODO MEDIO DE PAGO^FS
^FO16,258^GB432,2,2^FS
^XZ`;

    // FLEJE 2: descripcion, marca/gramaje, mecanica y codigo de barras.
    let barcodeZpl = "";
    if (barcode.length >= 8 && barcode.length <= 14) {
      barcodeZpl = `^FO52,154^BY2,2,54^BCN,54,Y,N,N^FD${barcode}^FS`;
    }

    const details = `^XA
^PW${widthDots}
^LL${flejeDots}
^LH0,0
^FO16,14^A0N,26,24^FB432,1,0,L,0^FD${name}^FS
^FO16,46^A0N,21,20^FD${brand}${size ? "  " + size : ""}^FS
${note ? `^FO16,76^A0N,18,18^FB432,2,2,L,0^FD${note}^FS` : ""}
^FO16,122^A0N,18,18^FDItem ${code}   Local ${local}^FS
${barcodeZpl}
^XZ`;

    // Dos formatos ZPL consecutivos = dos flejes consecutivos para un solo cartel.
    return top + "\n" + details;
  }

  function setRFStatus(message, kind="") {
    const box = document.getElementById("rfStatus");
    if (!box) return;
    box.className = `rf-status ${kind}`.trim();
    box.textContent = message;
  }

  function getRFSelection() {
    const select = document.getElementById("rfItemSelect");
    const index = Number(select ? select.value : 0);
    return state.queue[index] || state.queue[0] || null;
  }

  function saveRFPrinterFields() {
    const ip = (document.getElementById("rfPrinterIp")?.value || "").trim();
    const id = (document.getElementById("rfPrinterId")?.value || "").trim().toUpperCase().replace(/[^0-9A-F]/g, "");
    if (ip) localStorage.setItem(rfStorageKey("ip"), ip);
    if (id) localStorage.setItem(rfStorageKey("id"), id);
    return {ip, id};
  }

  async function testRFBridge() {
    setRFStatus("Comprobando puente RF…", "working");
    try {
      const response = await fetch("http://127.0.0.1:8787/health", {method:"GET", cache:"no-store"});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setRFStatus(data && data.ok ? "✓ Puente RF conectado" : "Puente RF respondió, pero no está listo.", data && data.ok ? "ok" : "error");
    } catch (error) {
      setRFStatus("No se detecta el puente RF. Ejecuta rf-print-bridge.ps1 en este PC y vuelve a probar.", "error");
    }
  }

  async function printRFSelected() {
    if (!ensureQueuePrintable()) return;
    const product = getRFSelection();
    if (!product) {
      setRFStatus("No hay un cartel seleccionado.", "error");
      return;
    }

    const {ip, id} = saveRFPrinterFields();
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
      setRFStatus("Ingresa la IP de la impresora RF.", "error");
      return;
    }
    if (id && !/^[0-9A-F]{12}$/.test(id)) {
      setRFStatus("El código de impresora debe tener 12 caracteres hexadecimales.", "error");
      return;
    }

    setRFStatus(`Enviando ítem ${product.code} a la RF…`, "working");
    try {
      const response = await fetch("http://127.0.0.1:8787/print", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          ip,
          port:9100,
          printerId:id,
          local:state.local,
          item:product.code,
          zpl:buildRFZpl(product)
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      setRFStatus(`✓ Ítem ${product.code} enviado a ${ip}:9100`, "ok");
    } catch (error) {
      setRFStatus(`No se pudo imprimir por RF: ${error.message || "error de conexión"}`, "error");
    }
  }

  function renderRFSetup() {
    if (!state.queue.length) return renderMain();

    const savedIp = localStorage.getItem(rfStorageKey("ip")) || "";
    const savedId = localStorage.getItem(rfStorageKey("id")) || "";

    app.innerHTML = `
      ${header()}
      <section class="screen print-choice-screen">
        <div class="print-choice-card rf-setup-card">
          <div class="print-choice-top">
            <div>
              <span class="print-choice-kicker">Impresora Portátil (RF) · Local ${esc(state.local)}</span>
              <h2>Prueba directa Zebra</h2>
              <p>Formato RF: cada cartel se imprime en 2 flejes consecutivos. El primero lleva la promo/precio y el segundo los datos del producto.</p>
            </div>
            <button class="btn back-home" id="backToPrintOptions" type="button">Volver</button>
          </div>

          <div class="rf-form-grid">
            <label class="rf-field">
              <span>Cartel a imprimir</span>
              <select id="rfItemSelect">
                ${state.queue.map((p,i) => `<option value="${i}">Ítem ${esc(p.code)} · ${esc(p.price)} · ${esc(p.name)}</option>`).join("")}
              </select>
            </label>

            <label class="rf-field">
              <span>IP impresora RF</span>
              <input id="rfPrinterIp" inputmode="decimal" placeholder="Ej. 23.117.226.10" value="${esc(savedIp)}">
            </label>

            <label class="rf-field">
              <span>Código impresora / MAC (opcional para esta prueba)</span>
              <input id="rfPrinterId" autocomplete="off" maxlength="17" placeholder="Ej. 6095325D07AA" value="${esc(savedId)}">
            </label>
          </div>

          <div class="rf-proof-box">
            <strong>Formato piloto RF</strong>
            <span>58 mm de ancho útil · 2 flejes de 35 mm por cartel · separación física sugerida de 5 mm · ZPL por TCP 9100.</span>
            <span>La impresión Tamaño Carta no se modifica.</span>
          </div>

          <div id="rfStatus" class="rf-status">Primero comprueba que el puente RF esté activo.</div>

          <div class="rf-actions rf-actions-main">
            <button class="btn ghost" id="testRFBridge" type="button">Probar puente RF</button>
            <button class="btn print" id="sendRFPrint" type="button">Imprimir 1 cartel RF (2 flejes)</button>
          </div>

          <div class="rf-actions">
            <button class="btn back-home" id="backToQueueFromRF" type="button">Volver a la cola</button>
          </div>
        </div>
      </section>
    `;

    document.getElementById("changeLocalTop").addEventListener("click", changeLocal);
    document.getElementById("backToPrintOptions").addEventListener("click", renderPrintOptions);
    document.getElementById("backToQueueFromRF").addEventListener("click", renderMain);
    document.getElementById("testRFBridge").addEventListener("click", testRFBridge);
    document.getElementById("sendRFPrint").addEventListener("click", printRFSelected);
    document.getElementById("rfPrinterIp").addEventListener("change", saveRFPrinterFields);
    document.getElementById("rfPrinterId").addEventListener("change", saveRFPrinterFields);
  }

  function printQueue() {
    if (!ensureQueuePrintable()) return;

    const chunks = [];
    for (let i=0; i<state.queue.length; i += 4) chunks.push(state.queue.slice(i, i+4));

    printRoot.innerHTML = chunks.map((chunk, pageIndex) => `
      <section class="print-page ${pageIndex < chunks.length-1 ? "page-break" : ""}">
        ${[0,1,2,3].map(i => `
          <div class="print-cell">
            ${chunk[i] ? productCard(chunk[i], "print") : ""}
          </div>
        `).join("")}
      </section>
    `).join("");

    window.print();
  }

  if (state.local) {
    loadQueue();
    renderMenu();
  } else {
    landing();
  }
})();
