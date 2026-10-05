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
    document.getElementById("backHome").addEventListener("click", changeLocal);
    document.getElementById("changeLocalTop").addEventListener("click", changeLocal);
    const printBtn = document.getElementById("printBtn");
    if (isMobileDevice()) {
      printBtn.addEventListener("click", renderRFMobileSetup);
    } else {
      // Escritorio conserva EXACTAMENTE la ruta v18.
      printBtn.addEventListener("click", renderPrintOptions);
    }
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
    state.product = catalog.find(p => p.code === code || (isMobileDevice() && String(p.barcode || "") === code)) || null;
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
                localStorage.setItem("carteleria.rf.mobile.mac", mac);
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
      localStorage.setItem("carteleria.rf.mobile.mac", mac);
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
    const savedMac = forcedMac || localStorage.getItem("carteleria.rf.mobile.mac") || "";
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
    document.getElementById("backMobileRF").addEventListener("click", renderMain);
    document.getElementById("scanMacBtn").addEventListener("click", () => openCameraScanner("mac"));
    document.getElementById("saveMacBtn").addEventListener("click", saveMobileMac);
    document.getElementById("mobileMacInput").addEventListener("change", saveMobileMac);
    document.getElementById("prepareMobileRF").addEventListener("click", () => {
      const mac = saveMobileMac();
      if (!mac) return;
      const product = getRFSelection();
      const info = document.getElementById("mobilePrintInfo");
      if (info) info.innerHTML = `<strong>Listo para conexión móvil</strong><span>Ítem ${esc(product?.code || "")} · Zebra ${esc(mac)}</span><span>El ZPL de los 2 flejes ya está preparado. El siguiente paso es enlazar el canal Android → Zebra sin tocar la versión PC.</span>`;
    });
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
