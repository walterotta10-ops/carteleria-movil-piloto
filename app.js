(() => {
  const catalog = window.CARTELERIA_CATALOG || [];
  const app = document.getElementById("app");
  const printRoot = document.getElementById("printRoot");

  const state = {
    local: localStorage.getItem("carteleria.local") || "",
    itemCode: "",
    product: null,
    queue: []
  };

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
    } catch {
      state.queue = [];
    }
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
          <span class="brand-text"><strong>Nuevo C&amp;D</strong><small>Cartelería</small></span>
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
    document.getElementById("backHome").addEventListener("click", changeLocal);
    document.getElementById("changeLocalTop").addEventListener("click", changeLocal);
    document.getElementById("printBtn").addEventListener("click", renderPrintOptions);
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
    state.product = catalog.find(p => p.code === code) || null;
    const status = document.getElementById("searchStatus");

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

  function unitPriceText(p) {
    const price = Number(p.offer || String(p.price || "").replace(/[^0-9]/g, ""));
    const size = String(p.size || "").toUpperCase().replace(/\s/g, "");
    if (!price) return "";

    if (p.type === "nx") {
      const grams = parseFloat(size.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
      const totalKg = (grams * Number(p.qty || 1)) / 1000;
      return totalKg ? `${money(price / totalKg)} x KG` : "";
    }
    if (size.endsWith("GR")) {
      const grams = parseFloat(size.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
      return grams ? `${money(price / (grams / 1000))} x KG` : "";
    }
    if (size.endsWith("ML") || size.endsWith("CC")) {
      const ml = parseFloat(size.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
      if (!ml) return "";
      if (p.brand === "NIVEA BODY") return `${money(price / (ml / 100))} x 100 ml`;
      return `${money(price / (ml / 1000))} x LT`;
    }
    if (size.endsWith("LT")) {
      const lt = parseFloat(size.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
      return lt ? `${money(price / lt)} x LT` : "";
    }
    if (size.endsWith("UN")) {
      const un = parseFloat(size.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
      return un ? `${money(price / un)} x UN` : "";
    }
    return "";
  }

  function categoryText(p) {
    if (p.type === "nx") return "8468 - BEBIDAS DILUIBLES";
    if (String(p.name).includes("HUEVO")) return "8479 - HUEVOS";
    if (p.brand === "NIVEA BODY") return "9267 - CUIDADO CORPORAL";
    if (p.code === "673851") return "8471 - BEBIDAS - AGUA";
    if (p.code === "309922") return "9369 - DESAYUNO-CEREAL-BARRA";
    return "8475 - VINO";
  }

  function campaignText(p) {
    return p.type === "normal" ? "LISTA 3 BARATO TODOS LOS DIAS" : "LISTA 3 SBA - AHORA MAS BARATO";
  }

  function promoLine(p) {
    if (p.type === "offer") {
      const normal = p.before || money(p.regular);
      const ahorro = (p.saving || "").replace(/^Ahorro\s*:?[ ]*/i, "");
      return `<div class="promo-strip offer-strip"><svg class="promo-strip-bg" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="0" width="100" height="20" fill="#000"/></svg><span>Normal: ${esc(normal)}</span><span>Ahorro: ${esc(ahorro)}</span></div>`;
    }
    if (p.type === "nx") {
      const unitario = (p.unitLabel || "").replace(/^P\.\s*unitario\s*:?[ ]*/i, "");
      const ahorro = (p.saving || "").replace(/^Ahorro\s*:?[ ]*/i, "");
      return `<div class="promo-strip nx-strip"><svg class="promo-strip-bg" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="0" width="100" height="20" fill="#000"/></svg><span>P. unitario: ${esc(unitario)}</span><span>Ahorro: ${esc(ahorro)}</span></div>`;
    }
    return "";
  }

  function priceMarkup(p) {
    const txt = String(p.price || "");
    if (p.type === "nx") return `<div class="price nx-main-price">${esc(txt)}</div>`;
    const amount = txt.replace(/^\$/, "");
    return `<div class="price standard-main-price"><span class="currency">$</span><span class="price-amount">${esc(amount)}</span></div>`;
  }

  function productCard(p, mode="preview") {
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
            <div class="validity">Vigencia: del 23 de julio al 8 de octubre</div>
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
        <button class="btn add" id="addQueue" type="button">Agregar a cola</button>
      </div>
    `;

    document.getElementById("addQueue").addEventListener("click", () => {
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
      printBtn.disabled = !state.queue.length;
      printBtn.textContent = "Imprimir cola";
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


  function renderPrintOptions() {
    if (!state.queue.length) return;

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
                <small>Impresora fija · mantiene la configuración actual de impresión</small>
              </span>
              <span class="printer-option-arrow" aria-hidden="true">›</span>
            </button>

            <button class="printer-option rf-option" id="printRF" type="button">
              <span class="printer-option-icon" aria-hidden="true">▤</span>
              <span class="printer-option-copy">
                <strong>Impresora Portátil (RF)</strong>
                <small>Impresión desde equipo portátil · configuración RF pendiente</small>
              </span>
              <span class="printer-option-arrow" aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </section>
    `;

    document.getElementById("changeLocalTop").addEventListener("click", changeLocal);
    document.getElementById("backToQueue").addEventListener("click", renderMain);
    document.getElementById("printLetter").addEventListener("click", printQueue);
    document.getElementById("printRF").addEventListener("click", renderRFSetup);
  }

  function renderRFSetup() {
    app.innerHTML = `
      ${header()}
      <section class="screen print-choice-screen">
        <div class="print-choice-card rf-setup-card">
          <span class="print-choice-kicker">Impresora Portátil (RF)</span>
          <h2>Configuración RF</h2>
          <p>
            Esta ruta ya quedó separada de la impresión Tamaño Carta.
            La configuración específica de la impresora portátil la hacemos en el siguiente paso.
          </p>

          <div class="rf-pending-box">
            <strong>RF todavía no configurada</strong>
            <span>No modifica la cola ni la configuración actual de impresión.</span>
          </div>

          <div class="rf-actions">
            <button class="btn ghost" id="backToPrintOptions" type="button">Volver a opciones de impresión</button>
            <button class="btn back-home" id="backToQueueFromRF" type="button">Volver a la cola</button>
          </div>
        </div>
      </section>
    `;

    document.getElementById("changeLocalTop").addEventListener("click", changeLocal);
    document.getElementById("backToPrintOptions").addEventListener("click", renderPrintOptions);
    document.getElementById("backToQueueFromRF").addEventListener("click", renderMain);
  }

  function printQueue() {
    if (!state.queue.length) return;

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
    renderMain();
  } else {
    landing();
  }
})();
