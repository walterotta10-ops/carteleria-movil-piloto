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
    if (type === "offer") return "Precio oferta";
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
        <div class="store-icon" aria-hidden="true">
          <div class="awning"><i></i><i></i><i></i><i></i></div>
          <div class="shop-body"><span></span><b></b></div>
        </div>
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
          <h2>Ingresar ítem</h2>
          <form id="searchForm" class="search-row" autocomplete="off">
            <input id="itemInput" inputmode="numeric" pattern="[0-9]*" placeholder="Ingresar ítem" value="${esc(state.itemCode)}">
            <button class="btn search" type="submit">Buscar</button>
          </form>
          <div id="searchStatus"></div>
          <button class="btn ghost" id="changeLocal" type="button">Cambiar local</button>
        </div>

        <section id="previewArea"></section>

        <section class="queue-section">
          <div class="section-title">
            <h2>Cola de impresión</h2>
            <span class="count">${state.queue.length}</span>
          </div>
          <div id="queueList"></div>
          <button class="btn print" id="printBtn" type="button" ${state.queue.length ? "" : "disabled"}>
            Imprimir cola (${state.queue.length})
          </button>
        </section>
      </section>
    `;

    document.getElementById("searchForm").addEventListener("submit", e => {
      e.preventDefault();
      searchItem();
    });
    document.getElementById("changeLocal").addEventListener("click", changeLocal);
    document.getElementById("changeLocalTop").addEventListener("click", changeLocal);
    document.getElementById("printBtn").addEventListener("click", printQueue);

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
      const priceState = state.product.price ? "" : " · precio pendiente";
      status.innerHTML = `<div class="status ok">✓ Producto encontrado <small>Ítem ${esc(state.product.code)}${priceState}</small></div>`;
    }
    renderPreview();
  }

  function productCard(p, mode="preview") {
    const hasPrice = Boolean(p.price);
    const price = hasPrice ? esc(p.price) : "—";
    const extra = p.type === "nx"
      ? `<div class="subline">${esc(p.unit || "Mecánica promocional")}</div><div class="subline">${esc(p.saving || "")}</div>`
      : `<div class="subline">${esc(p.note || typeLabel(p.type))}</div>`;

    return `
      <article class="poster ${mode} ${p.type}">
        <div class="poster-inner">
          <div class="mechanic">${esc(typeLabel(p.type))}</div>
          <div class="price ${hasPrice ? "" : "pending"}">${price}</div>
          ${extra}
          <div class="product-name">${esc(p.name)}</div>
          <div class="product-meta">Ítem ${esc(p.code)}</div>
          ${barcodeSvg(p.code)}
          <div class="barcode-number">${esc(p.code)}</div>
          ${hasPrice ? "" : `<div class="price-warning">Precio no confirmado</div>`}
        </div>
      </article>
    `;
  }

  function barcodeSvg(code) {
    const digits = String(code).replace(/\D/g, "");
    let bars = "";
    let x = 3;
    for (let i=0; i<digits.length*3+12; i++) {
      const d = Number(digits[i % Math.max(digits.length,1)] || 1);
      const w = ((d + i) % 3) + 1;
      if (i % 2 === 0) bars += `<rect x="${x}" y="1" width="${w}" height="${18 + (i%3)*2}"/>`;
      x += w + 1;
      if (x > 94) break;
    }
    return `<svg class="barcode" viewBox="0 0 100 24" role="img" aria-label="Código de barras ${esc(code)}">${bars}</svg>`;
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
        <button class="btn add" id="addQueue" type="button" ${state.product.price ? "" : "disabled"}>
          Agregar a cola
        </button>
        ${state.product.price ? "" : `<p class="data-note">Este ítem conserva el código y nombre del catálogo, pero su precio no está confirmado en la información disponible. No se habilita impresión para evitar imprimir un precio inventado.</p>`}
        <button class="btn ghost" id="clearSearch" type="button">Buscar otro ítem</button>
      </div>
    `;

    const add = document.getElementById("addQueue");
    if (add && !add.disabled) add.addEventListener("click", () => {
      state.queue.push({...state.product, qid: Date.now() + Math.random()});
      saveQueue();
      renderQueue();
    });
    document.getElementById("clearSearch").addEventListener("click", () => {
      state.product = null;
      state.itemCode = "";
      document.getElementById("itemInput").value = "";
      document.getElementById("searchStatus").innerHTML = "";
      renderPreview();
    });
  }

  function renderQueue() {
    const list = document.getElementById("queueList");
    const count = document.querySelector(".count");
    const printBtn = document.getElementById("printBtn");
    if (!list) return;

    if (count) count.textContent = state.queue.length;
    if (printBtn) {
      printBtn.disabled = !state.queue.length;
      printBtn.textContent = `Imprimir cola (${state.queue.length})`;
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
          <span>${esc(p.code)}</span>
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
