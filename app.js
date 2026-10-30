(()=>{const f=window.CARTELERIA_RULES;if(!f)throw new Error("Falta cartel-rules.js. No se habilita impresi\xF3n.");const k=(window.CARTELERIA_CATALOG||[]).map(e=>({...e,...f.calc(e)})),Ye="v39-cola-compartida-y-uso",I=document.getElementById("app"),we=document.getElementById("printRoot"),R="carteleria.rf.mobile.mac",ae=window.CYD_API_BASE||"https://carteleria-puente-carta.walterotta10.workers.dev",a={local:localStorage.getItem("carteleria.local")||"",itemCode:"",product:null,queue:[],mobileMac:localStorage.getItem(R)||"",selectedLayout:new Set,layoutZoom:1};function q(){return window.matchMedia("(max-width: 760px)").matches}const s=(e="")=>String(e).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[t]),y=window.CARTELERIA_SYNC.create({apiUrl:ae+"/api/cola",storage:localStorage,onChange(e){let migrate=false;a.queue=e.map(t=>{const p=f.canonical(t,k);if(!f.validate(p).length&&["code","signId","campaignId"].some(key=>String(p[key])!==String(t[key]))){migrate=true;return {...p,qid:y.newId()}}return p});if(migrate)queueMicrotask(()=>{if(a.local)y.replace(a.queue)});try{localStorage.setItem(ge(),JSON.stringify(a.queue))}catch{}V(),document.querySelectorAll("[data-queue-count]").forEach(t=>t.textContent=a.queue.length)},onStatus:Be}),S=window.CARTELERIA_USAGE.create({apiUrl:ae,storage:localStorage,session:sessionStorage});function Be(){const e=y.status,t=document.getElementById("queueSyncStatus");t&&(t.textContent=e.message+(e.pending?` \xB7 ${e.pending} cambio(s) pendiente(s)`:""),t.dataset.kind=e.kind)}I.addEventListener("click",e=>{e.target.closest("[data-sync-queue]")&&y.sync(),e.target.closest("[data-open-queue]")&&E()}),window.setInterval(()=>{a.local&&!document.hidden&&(y.sync(),S.flush(),cyd53Refresh(false).catch(()=>{}))},15e3),window.addEventListener("focus",()=>{a.local&&(y.sync(),S.start(a.local))}),window.addEventListener("online",()=>{a.local&&y.sync(),S.flush()}),document.addEventListener("visibilitychange",()=>{!document.hidden&&a.local&&(y.sync(),S.start(a.local))});let pe=0;for(const e of["pointerdown","keydown"])document.addEventListener(e,()=>{a.local&&Date.now()-pe>6e4&&(pe=Date.now(),S.start(a.local))},{passive:!0});window.addEventListener("storage",e=>{e.key?.startsWith(window.CARTELERIA_SYNC.PREFIX)&&y.reload()});function ge(){return`carteleria.queue.${a.local||"sin-local"}`}function N(){if(y.local===a.local)return;let e=[];try{const t=JSON.parse(localStorage.getItem(ge())||"[]");Array.isArray(t)&&(e=t)}catch{}try{y.select(a.local,e)}catch{a.queue=e.map(n=>f.canonical(n,k)),window.alert("No se pudo guardar en este navegador. Revisa que permita almacenamiento antes de continuar.")}}function Y(){return f.auditQueue(a.queue)}async function Z(){try{await cyd53Refresh(true)}catch(error){window.alert("No se puede imprimir sin verificar la promoción vigente. "+error.message);return false}const e=a.local;if(!await y.sync()&&y.status.kind!=="setup")return window.alert("No se pudo actualizar la cola del local. Conecta internet y presiona Actualizar antes de imprimir."),!1;if(a.local!==e)return!1;if(N(),!a.queue.length)return window.alert("No hay carteles en la cola."),!1;const n=Y();if(n.length){const o=n.slice(0,8).map(c=>`\xCDtem ${c.code}: ${c.error}`).join(`
`);return window.alert(`DATOS POR REVISAR: ${n.length} dato(s) por revisar.
${o}${n.length>8?`
...`:""}
Retira o corrige estos \xEDtems antes de imprimir.`),!1}return!0}function _(){window.CYD_EVENTS?.record(a.local,"queue_change",a.queue.length+" carteles en cola");try{y.replace(a.queue)}catch(e){a.queue=y.items.map(t=>f.canonical(t,k)),window.alert(e.code==="queue_limit"?e.message:"No se pudo guardar este cambio en el navegador. Intenta nuevamente.")}}function Xe(e){return e==="nx"?"Lleva m\xE1s, paga menos":e==="offer"?"Ahora m\xE1s barato":"Precio normal"}function w(){return`
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">\u25C6</span>
          <span class="brand-text"><strong>Nuevo C&amp;D</strong><small>Carteler\xEDa \xB7 v54 SBA</small></span>
        </div>
        <button class="local-badge" id="changeLocalTop" type="button">${CYD_IS_MARKET(a.local)?"Jefe de mercado \xB7 ${s(a.local)}":"Local "+s(a.local)}</button>
      </header>
      <div class="queue-sync-bar"><span id="queueSyncStatus" data-kind="${s(y.status.kind)}" role="status">${s(y.status.message)}</span><div><button type="button" data-sync-queue>Actualizar</button><button type="button" data-open-queue>Ver cola (<span data-queue-count>${a.queue.length}</span>)</button></div></div>
    `}const CYD_MARKETS={"867":["50","178","527","528","557","562","568","577","598","727","751","947"],"870":["168","440","478","505","531","551","554","573","590","787","805","997"],"869":["169","187","526","566","582","586","587","588","591","745","987"],"868":["12","155","156","502","508","569","570","583","592","593","972","996"],"810":["154","467","567","572","575","581","595","623","648","766","773"],"814":["170","171","186","198","504","507","511","538","540","541","579","622"],"816":["7","161","179","451","490","503","512","529","533","535","553","580"],"873":["194","521","522","534","537","545","558","559","594","784","878","948","986"],"872":["13","17","128","176","454","501","519","560","565","574","636","954","980","992"],"813":["5","243","439","500","578","585","746","772","783","793"],"812":["160","506","544","556","561","589","767","771","895"]};
const CYD_MARKET_NAMES={"867":"VI y VII","870":"Biobio","869":"Biobio Alrededores","868":"Maule","810":"Norte","814":"Santiago Norte","816":"Santiago Sur","873":"Sur","872":"Sur IX","813":"V Costa","812":"V Interior"};
const CYD_STORES={"50":{"market":"867","name":"Chimbarongo (Carrera)","marketName":"VI y VII"},"178":{"market":"867","name":"Teno II (Comalle)","marketName":"VI y VII"},"527":{"market":"867","name":"Ba Curico Centro","marketName":"VI y VII"},"528":{"market":"867","name":"Ba Curico Terminal","marketName":"VI y VII"},"557":{"market":"867","name":"Ba El Sol","marketName":"VI y VII"},"562":{"market":"867","name":"Ba San Fernando","marketName":"VI y VII"},"568":{"market":"867","name":"Ba Molina","marketName":"VI y VII"},"577":{"market":"867","name":"Ba Rengo","marketName":"VI y VII"},"598":{"market":"867","name":"Ba Granero","marketName":"VI y VII"},"727":{"market":"867","name":"Pichilemu","marketName":"VI y VII"},"751":{"market":"867","name":"Mostazal","marketName":"VI y VII"},"947":{"market":"867","name":"Las Cabras (Av Estadio)","marketName":"VI y VII"},"168":{"market":"870","name":"Ba Hualpen","marketName":"Biobio"},"440":{"market":"870","name":"Ba Lebu","marketName":"Biobio"},"478":{"market":"870","name":"Coronel","marketName":"Biobio"},"505":{"market":"870","name":"Ba Andalien","marketName":"Biobio"},"531":{"market":"870","name":"Ba Chiguayante","marketName":"Biobio"},"551":{"market":"870","name":"Ba Talcahuano","marketName":"Biobio"},"554":{"market":"870","name":"Ba Hualpen","marketName":"Biobio"},"573":{"market":"870","name":"Ba Arauco","marketName":"Biobio"},"590":{"market":"870","name":"San Pedro de La Paz (Boca Sur)","marketName":"Biobio"},"787":{"market":"870","name":"Curanilahue (O´Higgins)","marketName":"Biobio"},"805":{"market":"870","name":"Hualqui, (Hualqui Bombero Perret 248)","marketName":"Biobio"},"997":{"market":"870","name":"Lota (Arturo Prat)","marketName":"Biobio"},"169":{"market":"869","name":"Mulchen","marketName":"Biobio Alrededores"},"187":{"market":"869","name":"Cabrero (Las Violetas III)","marketName":"Biobio Alrededores"},"526":{"market":"869","name":"Ba Chillan Terminal","marketName":"Biobio Alrededores"},"566":{"market":"869","name":"Ba Los Puelches","marketName":"Biobio Alrededores"},"582":{"market":"869","name":"San Carlos (Independencia)","marketName":"Biobio Alrededores"},"586":{"market":"869","name":"Penco (Infante)","marketName":"Biobio Alrededores"},"587":{"market":"869","name":"Tome (Av. Egaña)","marketName":"Biobio Alrededores"},"588":{"market":"869","name":"Los Angeles (Las Azaleas)","marketName":"Biobio Alrededores"},"591":{"market":"869","name":"Los Angeles (Carrera)","marketName":"Biobio Alrededores"},"745":{"market":"869","name":"Nacimiento (Villa Alegre)","marketName":"Biobio Alrededores"},"987":{"market":"869","name":"Quillón (Cayumanqui)","marketName":"Biobio Alrededores"},"12":{"market":"868","name":"Ba Parral","marketName":"Maule"},"155":{"market":"868","name":"San Javier (Cienfuegos)","marketName":"Maule"},"156":{"market":"868","name":"Ba Talca Piduco","marketName":"Maule"},"502":{"market":"868","name":"Ba Linares Terminal","marketName":"Maule"},"508":{"market":"868","name":"Ba Talca Norte","marketName":"Maule"},"569":{"market":"868","name":"Talca (Carlos Trup)","marketName":"Maule"},"570":{"market":"868","name":"Ba Cauquenes","marketName":"Maule"},"583":{"market":"868","name":"Ba Constitucion","marketName":"Maule"},"592":{"market":"868","name":"Talca (Terminal)","marketName":"Maule"},"593":{"market":"868","name":"Ba Talca -Florida","marketName":"Maule"},"972":{"market":"868","name":"Longaví","marketName":"Maule"},"996":{"market":"868","name":"San Clemente II","marketName":"Maule"},"154":{"market":"810","name":"Ovalle (Peñafiel)","marketName":"Norte"},"467":{"market":"810","name":"Ovalle (Maestranza)","marketName":"Norte"},"567":{"market":"810","name":"Alto Hospicio (Ruta A16)","marketName":"Norte"},"572":{"market":"810","name":"Alto Hospicio (Centro)","marketName":"Norte"},"575":{"market":"810","name":"Ba Las Compa#Ias","marketName":"Norte"},"581":{"market":"810","name":"Coquimbo (Los Clarines)","marketName":"Norte"},"595":{"market":"810","name":"Ba Salamanca","marketName":"Norte"},"623":{"market":"810","name":"Copiapo (Los Loros)","marketName":"Norte"},"648":{"market":"810","name":"Illapel 2","marketName":"Norte"},"766":{"market":"810","name":"Coquimbo (Tierras Blancas)","marketName":"Norte"},"773":{"market":"810","name":"Vicuña (Yungay)","marketName":"Norte"},"170":{"market":"814","name":"Quilicura (Av. Matta)","marketName":"Santiago Norte"},"171":{"market":"814","name":"San Bernardo (Eucaliptus)","marketName":"Santiago Norte"},"186":{"market":"814","name":"El Bosque (Los Martines)","marketName":"Santiago Norte"},"198":{"market":"814","name":"Conchalí (Santa Inés)","marketName":"Santiago Norte"},"504":{"market":"814","name":"Ba Travesia","marketName":"Santiago Norte"},"507":{"market":"814","name":"Ba Carrascal","marketName":"Santiago Norte"},"511":{"market":"814","name":"Ba Vivaceta","marketName":"Santiago Norte"},"538":{"market":"814","name":"Ba Orientales","marketName":"Santiago Norte"},"540":{"market":"814","name":"Ba Recoleta Norte","marketName":"Santiago Norte"},"541":{"market":"814","name":"Ba Jaime Guzman","marketName":"Santiago Norte"},"579":{"market":"814","name":"Lampa (Av. Baquedano)","marketName":"Santiago Norte"},"622":{"market":"814","name":"Quinta Normal (Mapocho)","marketName":"Santiago Norte"},"7":{"market":"816","name":"Ba Paine","marketName":"Santiago Sur"},"161":{"market":"816","name":"Puente Alto (Eyzaguirre)","marketName":"Santiago Sur"},"179":{"market":"816","name":"Maipu (Rinconada)","marketName":"Santiago Sur"},"451":{"market":"816","name":"Melipilla (merced)","marketName":"Santiago Sur"},"490":{"market":"816","name":"Isla de Maipo (Manuel Rodriguez)","marketName":"Santiago Sur"},"503":{"market":"816","name":"Ba Gabriela","marketName":"Santiago Sur"},"512":{"market":"816","name":"Ba Pe#Aflor","marketName":"Santiago Sur"},"529":{"market":"816","name":"Ba Lo Ovalle","marketName":"Santiago Sur"},"533":{"market":"816","name":"Ba Carmen Maipu","marketName":"Santiago Sur"},"535":{"market":"816","name":"Ba Ciudad Satelite","marketName":"Santiago Sur"},"553":{"market":"816","name":"Ba Buin","marketName":"Santiago Sur"},"580":{"market":"816","name":"El Monte (Av. Los Libertadores)","marketName":"Santiago Sur"},"194":{"market":"873","name":"Puerto Montt (Alessandri)","marketName":"Sur"},"521":{"market":"873","name":"Castro (Galvarino)","marketName":"Sur"},"522":{"market":"873","name":"Valdivia (Terminal)","marketName":"Sur"},"534":{"market":"873","name":"Ba Alerce","marketName":"Sur"},"537":{"market":"873","name":"Ba Rahue Osorno","marketName":"Sur"},"545":{"market":"873","name":"Ba P.Montt  Terminal","marketName":"Sur"},"558":{"market":"873","name":"Ba Fundadores","marketName":"Sur"},"559":{"market":"873","name":"Ba Picarte","marketName":"Sur"},"594":{"market":"873","name":"Ba La  Union","marketName":"Sur"},"784":{"market":"873","name":"Río Bueno (Pedro Lagos)","marketName":"Sur"},"878":{"market":"873","name":"Purranque","marketName":"Sur"},"948":{"market":"873","name":"Mariquina (Los Rios)","marketName":"Sur"},"986":{"market":"873","name":"Frutillar (Alessandri)","marketName":"Sur"},"13":{"market":"872","name":"Temuco (Pedro de Valdivia)","marketName":"Sur IX"},"17":{"market":"872","name":"Collipulli (Argomedo)","marketName":"Sur IX"},"128":{"market":"872","name":"Vilcún (Quintrilpe)","marketName":"Sur IX"},"176":{"market":"872","name":"Traiguén (General Pinto)","marketName":"Sur IX"},"454":{"market":"872","name":"Ba Lautaro","marketName":"Sur IX"},"501":{"market":"872","name":"Ba Temuco Terminal","marketName":"Sur IX"},"519":{"market":"872","name":"Padre de las Casas (Maquehue)","marketName":"Sur IX"},"560":{"market":"872","name":"Ba Villarrica","marketName":"Sur IX"},"565":{"market":"872","name":"Ba Angol","marketName":"Sur IX"},"574":{"market":"872","name":"Ba Nueva Imperial","marketName":"Sur IX"},"636":{"market":"872","name":"Victoria","marketName":"Sur IX"},"954":{"market":"872","name":"Temuco (Labranza II)","marketName":"Sur IX"},"980":{"market":"872","name":"Carahue (Villagrán)","marketName":"Sur IX"},"992":{"market":"872","name":"Loncoche (Balmaceda)","marketName":"Sur IX"},"5":{"market":"813","name":"Quintero (Camino del Sol)","marketName":"V Costa"},"243":{"market":"813","name":"SBA Viña Del Mar Miraflores","marketName":"V Costa"},"439":{"market":"813","name":"Ba El Quisco","marketName":"V Costa"},"500":{"market":"813","name":"Ba Reñaca Alto","marketName":"V Costa"},"578":{"market":"813","name":"Valparaiso (Playa Ancha)","marketName":"V Costa"},"585":{"market":"813","name":"Ba Cartagena","marketName":"V Costa"},"746":{"market":"813","name":"Casablanca (Arturo Prat)","marketName":"V Costa"},"772":{"market":"813","name":"Valparaíso (Juan Pablo II)","marketName":"V Costa"},"783":{"market":"813","name":"Curacaví (O´Higgins)","marketName":"V Costa"},"793":{"market":"813","name":"San Antonio (21 de Mayo)","marketName":"V Costa"},"160":{"market":"812","name":"Quillota (Condell)","marketName":"V Interior"},"506":{"market":"812","name":"Ba La Calera","marketName":"V Interior"},"544":{"market":"812","name":"Ba San Felipe","marketName":"V Interior"},"556":{"market":"812","name":"Ba Limache","marketName":"V Interior"},"561":{"market":"812","name":"Ba Quillota","marketName":"V Interior"},"589":{"market":"812","name":"La Ligua (Av. Portales)","marketName":"V Interior"},"767":{"market":"812","name":"Villa Alemana (Huanhuali)","marketName":"V Interior"},"771":{"market":"812","name":"Los Andes (Pascual Baburizza)","marketName":"V Interior"},"895":{"market":"812","name":"Cabildo (Humeres)","marketName":"V Interior"}};
const CYD_IS_MARKET=code=>Object.prototype.hasOwnProperty.call(CYD_MARKETS,String(code));
const CYD_IS_STORE=code=>Object.prototype.hasOwnProperty.call(CYD_STORES,String(code));
if(a.local&&!CYD_IS_STORE(a.local)&&!CYD_IS_MARKET(a.local)){a.local="";localStorage.removeItem("carteleria.local");}
function x(){window.CYD54_ACCESS.logout();}
// C&D V50 — Modalidad manual. La maestra únicamente identifica artículos, no entrega precios.
let manualRecords=null,manualLookup=null,manualSelected=null;
async function loadManual(){
  if(manualLookup)return manualLookup;
  const response=await fetch('/manual-items.json?v=v50',{cache:'force-cache'});
  if(!response.ok)throw new Error('No se pudo abrir la maestra de artículos.');
  const records=await response.json();
  if(!Array.isArray(records)||!records.length)throw new Error('La maestra está vacía.');
  const map=new Map();
  for(const record of records){
    for(const id of [record.item,record.upc]){
      const key=String(id||'').trim();if(!key)continue;
      if(!map.has(key))map.set(key,[]);
      if(!map.get(key).includes(record))map.get(key).push(record);
    }
  }
  manualRecords=records;manualLookup=map;return map;
}
function manualMoney(n){return '$'+Math.round(n).toLocaleString('es-CL')}
function renderManual(){
  if(!a.local)return x();N();manualSelected=null;
  I.innerHTML=`${w()}<section class="screen manual-screen">
   <div class="search-card"><div class="search-head"><h2>Cartelería Manual</h2><button class="btn back-home" id="manualBack" type="button">Volver al inicio</button></div>
   <p>La maestra solo entrega ítem, UPC, descripción y marca. <strong>Quien crea el cartel es responsable de ingresar el precio y la promoción.</strong></p>
   <label for="manualItem">Ítem o código de barras</label>
   <div class="search-row"><input id="manualItem" type="text" inputmode="numeric" autocomplete="off" placeholder="Ingresar ítem o UPC"/><button class="btn search" id="manualFind" type="button">Buscar</button></div>
   <div id="manualStatus" role="status"></div><div id="manualChoices"></div>
   <div id="manualForm" hidden>
    <div class="manual-product" id="manualProduct"></div>
    <div class="manual-fields"><label>Precio que se imprimirá ($)<input id="manualPrice" type="number" inputmode="numeric" min="1" step="1" placeholder="Ej. 3950"></label>
    <label>Precio antes ($) — opcional<input id="manualBefore" type="number" inputmode="numeric" min="1" step="1" placeholder="Sin precio anterior"></label>
    <label>Cantidad de productos<input id="manualQty" type="number" inputmode="numeric" min="1" max="20" step="1" value="1"></label></div>
    <p class="manual-note">Cantidad 1: precio normal o con ahorro. Cantidad 2–20: promoción Nx por el precio total ingresado. El ahorro se calcula solo si indicas el precio anterior unitario.</p>
    <div id="manualSummary" role="status"></div>
    <button class="btn primary" id="manualAdd" type="button">Enviar a cola de impresión</button>
   </div></div>
   <section class="queue-section"><div class="section-title"><h2>Cola compartida</h2><span class="count">${a.queue.length}</span></div><button class="btn print" id="manualQueue" type="button">Ver cola e imprimir</button></section>
  </section>`;
  document.getElementById('manualBack').onclick=z;
  document.getElementById('changeLocalTop').onclick=C;
  document.getElementById('manualQueue').onclick=E;
  document.getElementById('manualFind').onclick=findManual;
  document.getElementById('manualItem').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();findManual()}});
  for(const id of ['manualPrice','manualBefore','manualQty'])document.getElementById(id).addEventListener('input',manualPreview);
  document.getElementById('manualAdd').onclick=addManual;
  loadManual().then(()=>{const status=document.getElementById('manualStatus');if(status)status.textContent=`Maestra disponible: ${manualRecords.length.toLocaleString('es-CL')} artículos.`}).catch(e=>{const status=document.getElementById('manualStatus');if(status)status.textContent=e.message});
}
async function findManual(){
 const status=document.getElementById('manualStatus'),choices=document.getElementById('manualChoices'),form=document.getElementById('manualForm');
 if(!status)return;
 manualSelected=null;form.hidden=true;choices.innerHTML='';
 const key=document.getElementById('manualItem').value.trim();
 if(!/^\d{1,20}$/.test(key)){status.textContent='Ingresa un ítem o código de barras válido.';return}
 status.textContent='Buscando artículo…';let map;
 try{map=await loadManual()}catch(e){status.textContent=e.message;return}
 const matches=map.get(key)||[];
 if(!matches.length){status.textContent='Artículo no encontrado en la maestra. No se crearán datos de otro producto.';return}
 const distinct=[...new Map(matches.map(r=>[JSON.stringify([r.item,r.upc,r.descripcion,r.marca]),r])).values()];
 if(distinct.length===1){selectManual(distinct[0]);return}
 status.textContent=`Se encontraron ${distinct.length} registros. Selecciona el ítem y UPC correctos:`;
 choices.innerHTML=distinct.map((r,i)=>`<button type="button" class="manual-choice" data-manual-choice="${i}"><strong>${s(r.descripcion)}</strong><small>Ítem ${s(r.item)} · UPC ${s(r.upc)} · ${s(r.marca)}</small></button>`).join('');
 choices.querySelectorAll('[data-manual-choice]').forEach(b=>b.onclick=()=>selectManual(distinct[Number(b.dataset.manualChoice)]));
}
function selectManual(record){
 manualSelected=record;
 document.getElementById('manualStatus').textContent='Artículo seleccionado desde la maestra. Los precios los decides tú.';
 document.getElementById('manualChoices').innerHTML='';
 document.getElementById('manualForm').hidden=false;
 document.getElementById('manualProduct').innerHTML=`<strong>${s(record.descripcion)}</strong><span>Marca: ${s(record.marca)}</span><small>Ítem ${s(record.item)} · UPC ${s(record.upc)}</small>`;
 document.getElementById('manualPrice').value='';document.getElementById('manualBefore').value='';document.getElementById('manualQty').value='1';manualPreview();
}
function manualValues(){
 const price=Number(document.getElementById('manualPrice').value),rawBefore=document.getElementById('manualBefore').value.trim(),before=rawBefore?Number(rawBefore):0,qty=Number(document.getElementById('manualQty').value);
 const errors=[];
 if(!Number.isSafeInteger(price)||price<=0)errors.push('Ingresa un precio mayor que cero.');
 if(rawBefore&&(!Number.isSafeInteger(before)||before<=0))errors.push('El precio antes debe ser un número positivo.');
 if(!Number.isSafeInteger(qty)||qty<1||qty>20)errors.push('La cantidad debe estar entre 1 y 20.');
 if(before&&price>before*qty)errors.push('El precio actual supera el precio antes por la cantidad seleccionada.');
 return {price,before,qty,errors};
}
function manualPreview(){
 const node=document.getElementById('manualSummary');if(!node||!manualSelected)return;
 const v=manualValues();if(v.errors.length){node.textContent=v.errors.join(' ');return}
 const savings=v.before*v.qty-v.price;
 node.innerHTML=`<strong>${v.qty>1?v.qty+'x':''}${manualMoney(v.price)}</strong> · ${v.qty>1?'Promoción '+v.qty+'x':v.before?'Cartel con ahorro':'Precio normal'}${v.before?' · Antes unitario '+manualMoney(v.before)+(savings>0?' · Ahorro '+manualMoney(savings):''):''}`;
}
function addManual(){
 if(!manualSelected){window.alert('Primero selecciona un artículo.');return}
 const v=manualValues();if(v.errors.length){window.alert(v.errors.join('\n'));return}
 const row=manualSelected;
 const entry={manual:true,qid:y.newId(),signId:'MANUAL-'+String(row.item)+'-'+Date.now(),campaignId:'MANUAL',code:String(row.item),barcode:String(row.upc||''),name:String(row.descripcion),brand:String(row.marca||''),offer:v.price,unit:v.before,qty:v.qty,price:v.qty>1?v.qty+'x'+manualMoney(v.price):manualMoney(v.price),campaignName:'CARTELERÍA MANUAL',size:''};
 const issues=f.validate(entry);if(issues.length){window.alert('No se agregó el cartel: '+issues.join('; '));return}
 a.queue.push(entry);_();renderManual();document.getElementById('manualStatus').textContent='Cartel manual enviado a la cola compartida. Abre la cola para imprimir.';
}

function z(){if(sessionStorage.getItem("cyd.master")==="Walter")return cyd53MasterOpen();if(!a.local)return x();I.innerHTML=`${w()}<section class="screen mode-screen">
      <h1>\xBFQu\xE9 deseas hacer?</h1><p>${CYD_IS_MARKET(a.local)?"Acceso de jefe de mercado. Revisa promociones y uso de los locales.":"Elige c\xF3mo revisar tus promociones. Tu cola se guarda para abrirla en el PC."}</p>
      <div class="mode-grid">
        <button type="button" class="mode-tile" id="modeItem"><span class="mode-emoji">\u25A3</span><strong>Ingresar o escanear \xEDtem</strong><small>Buscar un cartel por c\xF3digo o escanearlo</small></button>
        <button type="button" class="mode-tile" id="modeLayout"><span class="mode-emoji">\u25A6</span><strong>Layout panor\xE1mico promociones</strong><small>Recorrer zonas, revisar categor\xEDas e imprimir</small></button>
        <button type="button" class="mode-tile" id="modeManual"><span class="mode-emoji">✎</span><strong>Cartelería Manual</strong><small>Busca el ítem en la maestra y carga tú los precios</small></button>
        ${CYD_IS_MARKET(a.local)?'<button type="button" class="mode-tile usage-mode-tile" id="modeUsage"><span class="mode-emoji">\u25A5</span><strong>Uso por local</strong><small>Jefe de mercado \xB7 accesos y carteles por d\xEDa o semana</small></button>':""}
      </div></section>`,document.getElementById("modeItem").onclick=E,document.getElementById("modeLayout").onclick=()=>F(),document.getElementById("modeManual").onclick=renderManual,document.getElementById("changeLocalTop").onclick=C,document.getElementById("modeUsage")?.addEventListener("click",()=>S.render({app:I,header:w,onBack:z,onChangeLocal:C,access:a.local}))}const ne=[{name:"Abarrotes",icon:"\u{1F35A}",groups:["Arroz","Pastas","Aceites","Pur\xE9 y legumbres","Dressing","Harina","T\xE9 y hierbas","Leche en polvo y saborizantes","Mermeladas y miel","Cereales","Galletas","Conservas de pescado","Conservas de mariscos","Sopas y caldos","Sal y condimentos","Platos instant\xE1neos","Az\xFAcar","Conservas de frutas y verduras","Salsas y queso rallado","Postres listos","Caf\xE9","Endulzantes","Caramelos","Chocolates","Vinagre y suced\xE1neos","Sabores de Am\xE9rica","Reposter\xEDa","Colaci\xF3n","C\xF3ctel y frutos secos","Snacks"]},{name:"Bebestibles",icon:"\u{1F964}",groups:["Aguas","Bebidas","Jugos l\xEDquidos","Jugos en polvo","Energ\xE9ticas e isot\xF3nicas"]},{name:"Licores",icon:"\u{1F377}",groups:["Vinos","Cervezas","Licores"]},{name:"Perfumer\xEDa",icon:"\u{1F9F4}",groups:["Champ\xFA","Coloraci\xF3n","Afeitado y depilaci\xF3n","Desodorantes","Ba\xF1o y spa","Jabones","Higiene bucal","Puericultura","Alimentos y f\xF3rmulas para beb\xE9","Higiene femenina","Incontinencia","Pa\xF1ales"]},{name:"Limpieza",icon:"\u{1F9FC}",groups:["Papel higi\xE9nico","Servilletas y pa\xF1uelos","Limpiadores de piso","Guantes y pa\xF1os h\xFAmedos","Accesorios de piso","Ambientales y plaguicidas","Suavizantes","Detergentes","Wipes","Limpiadores de ba\xF1o","Esponjas y virutillas","Toalla de papel","Pulidores y antigrasas","Limpiavidrios","Lavaloza","Bolsas de basura","Blanqueamiento","Ceras","Tratamiento de ropa","Lustramuebles y calzado"]},{name:"L\xE1cteos y refrigerados",icon:"\u{1F95B}",groups:["L\xE1cteos","Leches blancas","Leches saborizadas","Pan industrial","Leche condensada y manjar","Hora del t\xE9","Huevos","Crema","Vegetales fr\xEDos"]},{name:"Fiambrer\xEDa y Deli",icon:"\u{1F9C0}",groups:["Fiambrer\xEDa","Fiambres y quesos","Deli","Quesos","Fiambres"]},{name:"Carnes y pollos",icon:"\u{1F969}",groups:["Carnes","Pollos","Asistido carnes","Carnes congeladas"]},{name:"Congelados",icon:"\u{1F9CA}",groups:["Congelados","Congelados carnes","Congelados l\xE1cteos"]},{name:"Panader\xEDa",icon:"\u{1F35E}",groups:["Panader\xEDa","Pan a granel","Hornos de pollo"]},{name:"Mascotas",icon:"\u{1F43E}",groups:["Alimento perro","Alimento gato","Accesorios mascotas"]},{name:"Hogar y cocina",icon:"\u{1F3E0}",groups:["Decoraci\xF3n hogar","Ferreter\xEDa","Autom\xF3vil","Envolturas y protecci\xF3n","Jugueter\xEDa","Librer\xEDa","Cumplea\xF1os","Sartenes","Bater\xEDas y cacerolas","Moldes","Cajas organizadoras","Accesorios ba\xF1o","Accesorios lavado","Frascos","Textil mesa","Utensilios","Accesorios mesa y cocina","Herm\xE9ticos","Termos y botellas","Tazones","Cristaler\xEDa","Loza"]},{name:"Textil",icon:"\u{1F455}",groups:["Mujer","Hombre","Infantil","Pijamas","Ropa ni\xF1a","Ropa ni\xF1o","Beb\xE9 ni\xF1a","Beb\xE9 ni\xF1o","Bodys beb\xE9","Ropa interior hombre","Ropa interior","Calcetines","Calzado mujer","Calzado hombre","Calzado infantil","Ropa interior ni\xF1a","Ropa interior ni\xF1o","Ropa interior beb\xE9","Set de cama","Frazadas","Plumones","S\xE1banas","Cojines, alfombras y bajadas","Toallas a granel"]},{name:"Otros y electr\xF3nica",icon:"\u{1F6D2}",groups:["Audio","Peque\xF1os electrodom\xE9sticos","Liquidaci\xF3n"]}],O=e=>String(e||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""),be=ne.flatMap(e=>e.groups),fe={vino:"Vinos",vinos:"Vinos",cerveza:"Cervezas",cervezas:"Cervezas",licores:"Licores",licor:"Licores",bebida:"Bebidas",bebidas:"Bebidas",agua:"Aguas",aguamineral:"Aguas",arroz:"Arroz",jabon:"Jabones",jabonestocador:"Jabones",shampoo:"Champ\xFA",papelhigienico:"Papel higi\xE9nico",detergente:"Detergentes",lavalozas:"Lavaloza",fiambres:"Fiambres",fiambreria:"Fiambrer\xEDa",quesos:"Quesos",lacteos:"L\xE1cteos",frio:"L\xE1cteos",mascotas:"Accesorios mascotas",textil:"Ropa interior",pae:"Peque\xF1os electrodom\xE9sticos"};function oe(e){const t=String(e.categoryName||"").trim(),n=O(t);if(fe[n])return fe[n];const o=be.find(c=>O(c)===n);return o||t||"Sin clasificar"}const re=e=>k.filter(t=>O(oe(t))===O(e)),se=e=>e.groups.flatMap(re);function Ce(){const e=new Set(be.map(O)),t=[...new Set(k.map(oe).filter(n=>!e.has(O(n))))];return t.length?[...ne,{name:"Por clasificar",icon:"\u{1F4CB}",groups:t}]:ne}function M(e=null,t=null){if(!a.local)return x();N();const n=k.length,o=Ce(),c=o.find(r=>r.name===e),d=t?re(t):[],g=d.filter(r=>a.selectedLayout.has(String(r.signId||r.code))).length;I.innerHTML=`${w()}<section class="screen panorama-screen">
      <div class="panorama-head"><button class="btn back-home" id="layoutBack">\u2190 ${t?"Categor\xEDas":c?"Plano":"Men\xFA"}</button>
      <div><h1>Layout panor\xE1mico promociones</h1><p>Plano tipo \xB7 ${n} carteles cargados \xB7 sin referencia a un local espec\xEDfico</p></div></div>
      ${c?t?`<div class="panorama-breadcrumb">${s(c.name)} \u203A ${s(t)} \xB7 ${d.length} carteles</div>
       <div class="selection-tools"><label><input type="checkbox" id="selectAllLayout" ${d.length&&g===d.length?"checked":""}> Seleccionar todos (${g}/${d.length})</label><button class="btn primary" id="sendLayoutQueue" ${g?"":"disabled"}>Agregar ${g} a cola</button></div>
       <div class="layout-product-list">${d.map(r=>`<label class="layout-product"><input type="checkbox" data-sign="${s(String(r.signId||r.code))}" ${a.selectedLayout.has(String(r.signId||r.code))?"checked":""}><span><strong>${s(r.name)}</strong><small>${s(r.brand||"")} \xB7 \xCDtem ${s(r.code)} \xB7 ${s(r.listName||r.campaignName||"")}</small></span><b>${s(r.price||"")}</b></label>`).join("")||"<p>No hay carteles cargados en esta categor\xEDa todav\xEDa.</p>"}</div>
       <p class="panorama-hint">Puedes seleccionar carteles y agregarlos a la cola. No se imprimen autom\xE1ticamente.</p>`:`<div class="panorama-breadcrumb">${s(c.name)} \xB7 ${se(c).length} carteles</div>
        <div class="category-grid">${[...c.groups,...new Set(se(c).map(oe).filter(r=>!c.groups.includes(r)))].map(r=>`<button class="category-tile" data-group="${s(r)}"><strong>${s(r)}</strong><span>${re(r).length} carteles</span></button>`).join("")}</div>`:`<div class="panorama-tools"><span>Vista superior de zonas</span><div><button class="btn" id="zoomOut">\u2212</button><strong id="layoutZoomPercent">${Math.round(a.layoutZoom*100)}%</strong><button class="btn" id="zoomIn">+</button></div></div>
      <div class="panorama-viewport" id="occamViewport" tabindex="0" aria-label="Mapa desplazable de subgrupos"><div class="panorama-map" id="panoramaMap" style="zoom:${a.layoutZoom}">
        <div class="panorama-entrance">ZONAS DE PROMOCIONES</div>
        ${o.map(r=>`<button class="panorama-zone" data-zone="${s(r.name)}"><span class="zone-icon">${r.icon}</span><strong>${s(r.name)}</strong><span>${se(r).length} carteles</span></button>`).join("")}
      </div></div><p class="panorama-hint">Toca una zona para abrir sus categor\xEDas. En celular, usa dos dedos para ampliar o reducir; en PC, usa + y \u2212.</p>`}
      <div class="layout-queue-bar"><span>Cola de impresi\xF3n: <strong data-queue-count>${a.queue.length}</strong></span><button class="btn primary" id="goToQueue">Ver cola e imprimir</button></div>
    </section>`,document.getElementById("changeLocalTop").onclick=C,document.getElementById("layoutBack").onclick=()=>t?M(e):c?M():z(),document.getElementById("goToQueue").onclick=E;const h=document.querySelector(".panorama-viewport");if(h){let r=0,p=a.layoutZoom;const i=m=>Math.hypot(m[0].clientX-m[1].clientX,m[0].clientY-m[1].clientY);h.addEventListener("touchstart",m=>{m.touches.length===2&&(r=i(m.touches),p=a.layoutZoom)},{passive:!0}),h.addEventListener("touchmove",m=>{if(m.touches.length===2&&r>0){m.preventDefault(),a.layoutZoom=Math.max(.6,Math.min(2.8,p*i(m.touches)/r));const $=document.getElementById("panoramaMap");$&&($.style.transform=`scale(${a.layoutZoom})`);const v=document.getElementById("layoutZoomPercent");v&&(v.textContent=`${Math.round(a.layoutZoom*100)}%`)}},{passive:!1}),h.addEventListener("touchend",m=>{m.touches.length<2&&(r=0)},{passive:!0})}document.getElementById("zoomIn")?.addEventListener("click",()=>{a.layoutZoom=Math.min(2.8,Math.round((a.layoutZoom+.2)*10)/10),M()}),document.getElementById("zoomOut")?.addEventListener("click",()=>{a.layoutZoom=Math.max(.6,Math.round((a.layoutZoom-.2)*10)/10),M()}),document.querySelectorAll("[data-zone]").forEach(r=>r.onclick=()=>M(r.dataset.zone)),document.querySelectorAll("[data-group]").forEach(r=>r.onclick=()=>M(e,r.dataset.group)),document.querySelectorAll("[data-sign]").forEach(r=>r.onchange=()=>{r.checked?a.selectedLayout.add(r.dataset.sign):a.selectedLayout.delete(r.dataset.sign),M(e,t)});const L=document.getElementById("selectAllLayout");L&&(L.onchange=()=>{d.forEach(r=>{const p=String(r.signId||r.code);L.checked?a.selectedLayout.add(p):a.selectedLayout.delete(p)}),M(e,t)});const u=document.getElementById("sendLayoutQueue");u&&(u.onclick=()=>{const r=d.filter(i=>a.selectedLayout.has(String(i.signId||i.code))),p=r.flatMap(i=>f.validate(i).map(m=>`\xCDtem ${i.code}: ${m}`));if(p.length){window.alert(`No es posible agregar carteles con datos incompletos:
`+p.slice(0,10).join(`
`));return}r.forEach(i=>a.queue.push({...i,qid:y.newId()})),_(),r.forEach(i=>a.selectedLayout.delete(String(i.signId||i.code))),E()})}const j=(window.CARTELERIA_OCCAM_SBA||[]).filter(e=>e.formato==="SBA"),B=new Set,X=e=>String(e||"").trim()||"Sin clasificar",Ae=[...new Set(j.map(e=>X(e.subgrupo)))].sort((e,t)=>e.localeCompare(t,"es")),ke=new Map(k.filter(e=>e.occamKey).map(e=>[`${e.campaignId}:${e.signId}`,e])),ve=e=>ke.get(`${e.matchCampaignId}:${e.matchSignId}`),ie=e=>{const t=ve(e);return t?f.validate(t):["Ficha t\xE9cnica no encontrada"]},he=e=>e.filter(t=>ie(t).length===0).length,D=(e,t)=>X(e)===X(t);function F(e=null,t=null){if(!a.local)return x();N();const n=e?j.filter(i=>D(i.subgrupo,e)):j,o=[...new Set(n.map(i=>X(i.categoria)))].sort((i,m)=>i.localeCompare(m,"es")),c=o.length>=4,d=e?c&&!t?null:t?n.filter(i=>D(i.categoria,t)):n:null,g=(d||[]).filter(i=>B.has(i.layoutId)).length,h=i=>Number.isFinite(i)?"$"+Math.round(i).toLocaleString("es-CL"):"Precio sin verificar",L=e?`${s(e)} \xB7 ${n.length} productos`:"";I.innerHTML=`${w()}<section class="screen panorama-screen">
      <div class="panorama-head"><button class="btn back-home" id="layoutBack">\u2190 ${d?"Volver":e?"Subgrupos":"Men\xFA"}</button>
        <div><h1>Layout panor\xE1mico promociones</h1><p>OCCAM \xB7 Solo SBA \xB7 ${j.length} registros \xB7 Subgrupo (G) y Categor\xEDa (I)</p></div></div>
      ${e?d===null?`<div class="panorama-breadcrumb">${L} \u203A Categor\xEDas</div>
      <div class="category-grid">${o.map(i=>`<button class="category-tile" data-category="${s(i)}"><strong>${s(i)}</strong><span>${n.filter(m=>D(m.categoria,i)).length} productos \xB7 ${he(n.filter(m=>D(m.categoria,i)))} imprimibles</span></button>`).join("")}</div>`:`<div class="panorama-breadcrumb">${L}${t?" \u203A "+s(t):""} \xB7 ${d.length} productos</div>
      <div class="selection-tools"><label><input type="checkbox" id="selectAllOccam" ${d.length&&g===d.length?"checked":""}> Seleccionar todos (${g}/${d.length})</label><button class="btn primary" id="sendOccam" ${g?"":"disabled"}>Enviar ${g} a cola</button></div>
      <div class="layout-product-list">${d.map(i=>`<label class="layout-product"><input type="checkbox" data-occam="${s(i.layoutId)}" ${B.has(i.layoutId)?"checked":""}><span><strong>${s(i.nombre||"Sin descripci\xF3n")}</strong><small>${s(i.marca)} \xB7 ${s(i.contenido)} \xB7 Producto ${s(i.codigo)} \xB7 ${s(i.mecanica)} \xB7 ${s(i.categoria)}</small><small>${ie(i).length?"Pendiente: "+s(ie(i).join("; ")):"\u2713 Listo para enviar a imprimir"}</small></span><b>${h(i.precioPromo)}</b></label>`).join("")}</div>
      <p class="panorama-hint">Fichas construidas con OCCAM SBA. Los registros con datos inconsistentes se bloquean para evitar errores de impresi\xF3n.</p>`:`<div class="panorama-tools"><span>Agrupadores por subgrupo (columna G)</span><div><button class="btn" id="zoomOut">\u2212</button><strong id="layoutZoomPercent">${Math.round(a.layoutZoom*100)}%</strong><button class="btn" id="zoomIn">+</button></div></div>
      <div class="panorama-viewport" id="occamViewport" tabindex="0" aria-label="Mapa desplazable de subgrupos"><div class="panorama-map" id="panoramaMap" style="zoom:${a.layoutZoom}">
      <div class="panorama-entrance">SUBGRUPOS DE PROMOCIONES SBA</div>
      ${Ae.map(i=>`<button class="panorama-zone" data-subgroup="${s(i)}"><strong>${s(i)}</strong><span>${j.filter(m=>D(m.subgrupo,i)).length} productos \xB7 ${he(j.filter(m=>D(m.subgrupo,i)))} imprimibles</span></button>`).join("")}</div></div>
      `}
      <div class="layout-queue-bar"><span>Cola existente: <strong data-queue-count>${a.queue.length}</strong></span><button class="btn primary" id="goToQueue">Ver cola e imprimir</button></div></section>`,document.getElementById("changeLocalTop").onclick=C,document.getElementById("layoutBack").onclick=()=>{d?c&&t?F(e):F():e?F():z()},document.getElementById("goToQueue").onclick=E,document.querySelectorAll("[data-subgroup]").forEach(i=>i.onclick=()=>F(i.dataset.subgroup)),document.querySelectorAll("[data-category]").forEach(i=>i.onclick=()=>F(e,i.dataset.category));const u=document.getElementById("occamViewport"),r=document.getElementById("panoramaMap");function p(i,m,$){const v=Math.max(.65,Math.min(2.6,Math.round(i*100)/100));if(!u||!r||v===a.layoutZoom)return;const b=a.layoutZoom,l=u.getBoundingClientRect(),P=(m===void 0?l.left+l.width/2:m)-l.left,te=($===void 0?l.top+l.height/2:$)-l.top,Ge=(u.scrollLeft+P)/b,Ue=(u.scrollTop+te)/b;a.layoutZoom=v,r.style.zoom=String(v),document.getElementById("layoutZoomPercent").textContent=Math.round(v*100)+"%",u.scrollLeft=Ge*v-P,u.scrollTop=Ue*v-te}if(document.getElementById("zoomIn")?.addEventListener("click",()=>p(a.layoutZoom+.2)),document.getElementById("zoomOut")?.addEventListener("click",()=>p(a.layoutZoom-.2)),u){let i=0,m=1;const $=l=>Math.hypot(l[0].clientX-l[1].clientX,l[0].clientY-l[1].clientY);u.addEventListener("touchstart",l=>{l.touches.length===2&&(i=$(l.touches),m=a.layoutZoom)},{passive:!0}),u.addEventListener("touchmove",l=>{if(l.touches.length===2&&i){l.preventDefault();const P=(l.touches[0].clientX+l.touches[1].clientX)/2,te=(l.touches[0].clientY+l.touches[1].clientY)/2;p(m*$(l.touches)/i,P,te)}},{passive:!1}),u.addEventListener("touchend",l=>{l.touches.length<2&&(i=0)},{passive:!0}),u.addEventListener("wheel",l=>{(l.ctrlKey||l.metaKey)&&(l.preventDefault(),p(a.layoutZoom*(l.deltaY>0?.9:1.1),l.clientX,l.clientY))},{passive:!1});let v=null;u.addEventListener("pointerdown",l=>{l.pointerType==="mouse"&&l.button===0&&!l.target.closest("button")&&(v={x:l.clientX,y:l.clientY,left:u.scrollLeft,top:u.scrollTop},u.setPointerCapture(l.pointerId),u.classList.add("is-dragging"))}),u.addEventListener("pointermove",l=>{v&&(u.scrollLeft=v.left-(l.clientX-v.x),u.scrollTop=v.top-(l.clientY-v.y))});const b=()=>{v=null,u.classList.remove("is-dragging")};u.addEventListener("pointerup",b),u.addEventListener("pointercancel",b),u.addEventListener("keydown",l=>{const P={ArrowLeft:[-90,0],ArrowRight:[90,0],ArrowUp:[0,-90],ArrowDown:[0,90]};P[l.key]&&(l.preventDefault(),u.scrollBy({left:P[l.key][0],top:P[l.key][1],behavior:"smooth"}))})}document.querySelectorAll("[data-occam]").forEach(i=>i.onchange=()=>{i.checked?B.add(i.dataset.occam):B.delete(i.dataset.occam),F(e,t)}),document.getElementById("selectAllOccam")?.addEventListener("change",i=>{d.forEach(m=>{i.target.checked?B.add(m.layoutId):B.delete(m.layoutId)}),F(e,t)}),document.getElementById("sendOccam")?.addEventListener("click",()=>{const m=d.filter(b=>B.has(b.layoutId)).map(b=>({row:b,sign:ve(b)})),$=m.filter(({sign:b})=>!b||f.validate(b).length),v=m.filter(({sign:b})=>b&&f.validate(b).length===0);if(!v.length){window.alert("No se agregaron carteles: "+$.slice(0,5).map(({row:b,sign:l})=>"\xCDtem "+b.codigo+": "+(l?f.validate(l).join("; "):"Ficha no encontrada")).join(`
`));return}v.forEach(({sign:b})=>a.queue.push({...b,qid:y.newId()})),v.forEach(({row:b})=>B.delete(b.layoutId)),_(),$.length&&window.alert(`${v.length} carteles agregados a la cola. ${$.length} pendientes (NO agregados):
`+$.slice(0,8).map(({row:b,sign:l})=>"\xCDtem "+b.codigo+": "+(l?f.validate(l).join("; "):"Ficha no encontrada")).join(`
`)),E()})}function E(){if(!a.local)return x();N(),I.innerHTML=`
      ${w()}
      <section class="screen">
        <div class="search-card">
          <div class="search-head">
            <h2>Ingresar \xEDtem</h2>
            <button class="btn back-home" id="backHome" type="button">Volver a inicio</button>
          </div>
          <form id="searchForm" class="search-row" autocomplete="off">
            <input id="itemInput" inputmode="numeric" pattern="[0-9]*" placeholder="Ingresar \xEDtem" value="${s(a.itemCode)}">
            <button class="btn search" type="submit">Buscar</button>
          </form>
          ${q()?'<button class="btn scan-item-btn" id="scanItemBtn" type="button">\u25A3 Escanear \xEDtem</button>':""}
          <div id="searchStatus"></div>
        </div>

        <section id="previewArea"></section>

        <section class="queue-section">
          <div class="section-title">
            <div class="queue-title-group">
              <h2>Cola de impresi\xF3n</h2>
              <span class="count">${a.queue.length}</span>
            </div>
            <button class="btn print print-inline" id="printBtn" type="button" ${a.queue.length?"":"disabled"}>
              Imprimir cola
            </button>
          </div>
          <div id="queueList"></div>
          <button class="btn clear-queue-bottom" id="clearQueue" type="button" ${a.queue.length?"":"disabled"}>
            Borrar toda la cola
          </button>
        </section>
      </section>
    `,document.getElementById("searchForm").addEventListener("submit",t=>{t.preventDefault(),ye()}),q()&&document.getElementById("scanItemBtn")?.addEventListener("click",()=>$e("item")),document.getElementById("backHome").addEventListener("click",z),document.getElementById("changeLocalTop").addEventListener("click",C),document.getElementById("printBtn").addEventListener("click",le),document.getElementById("clearQueue").addEventListener("click",()=>{a.queue.length&&window.confirm("\xBFBorrar todos los carteles de la cola de impresi\xF3n?")&&(a.queue=[],_(),V(),H())}),H(),V()}function C(){y.stop(),a.selectedLayout.clear(),B.clear(),a.local="",a.itemCode="",a.product=null,a.queue=[],localStorage.removeItem("carteleria.local"),x()}function ye(){
 const t=document.getElementById("itemInput").value.trim();
 a.itemCode=t;window.CYD_EVENTS?.record(a.local,"search","Búsqueda de código "+t);
 a.product=null;
 const n=k.filter(c=>String(c.code)===t||String(c.barcode||"")===t||String(c.sourceProductNbr||"")===t);
 const o=document.getElementById("searchStatus");
 if(!t){o.innerHTML="";H();return}
 if(!n.length){o.innerHTML='<div class="status error">Ítem no encontrado en el catálogo.</div>';H();return}
 if(n.length===1){a.product=n[0];o.innerHTML='<div class="status ok">✓ Producto encontrado <small>Ítem '+s(a.product.code)+' · '+s(a.product.brand||"")+'</small></div>';H();return}
 // Un mismo código puede corresponder a varias campañas/carteles legítimos.
 // Nunca bloquear por duplicidad de código: el usuario elige la ficha exacta.
 o.innerHTML='<div class="status ok">Se encontraron '+n.length+' carteles para el ítem '+s(t)+'. Selecciona el que necesitas:</div>'+
 '<div class="item-matches">'+n.map((p,i)=>'<button class="item-match" type="button" data-match-index="'+i+'"><strong>'+s(p.name||"")+' · '+s(f.calc(p).price)+'</strong><small>'+s(p.brand||"")+' · '+s(p.listName||p.campaignName||"")+'</small><small>Cartel '+s(p.signId||'sin ID')+' · Campaña '+s(p.campaignId||'sin ID')+'</small></button>').join('')+'</div>';
 o.querySelectorAll('[data-match-index]').forEach(btn=>btn.addEventListener('click',()=>{
  const selected=n[Number(btn.dataset.matchIndex)];if(!selected)return;
  a.product=selected;
  o.innerHTML='<div class="status ok">✓ Cartel seleccionado <small>Ítem '+s(selected.code)+' · Cartel '+s(selected.signId||'')+' · '+s(selected.brand||'')+'</small></div>';
  H();
 }));
 H();
}function Je(e){return"$"+Math.round(Number(e||0)).toLocaleString("es-CL")}function Le(e){const t=String(e.name||"").trim(),n=String(e.size||"").trim();return!n||t.toUpperCase().includes(n.toUpperCase())?t:`${t} ${n}`}function Me(e){return f.unitMeasurePrice(e)}function Fe(e){return e.categoryId&&e.categoryName?`${e.categoryId} - ${e.categoryName}`:"CATEGOR\xCDA SIN CONFIRMAR"}function Pe(e){return e.campaignName||(f.mechanic(e)==="normal"?"LISTA 3 BARATO TODOS LOS DIAS":"LISTA 3 SBA - AHORA MAS BARATO")}function Re(e){if(!(f.savingAmount(e)>0))return"";if(f.mechanic(e)==="offer"){const t=f.calc(e),n=t.before,o=t.saving.replace(/^Ahorro\s*:?[ ]*/i,"");return`<div class="promo-strip offer-strip"><svg class="promo-strip-bg" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="0" width="100" height="20" fill="#000"/></svg><span>Normal: ${s(n)}</span><span>Ahorro: ${s(o)}</span></div>`}if(f.mechanic(e)==="nx"){const t=f.calc(e),n=t.unitLabel.replace(/^P\.\s*unitario\s*:?[ ]*/i,""),o=t.saving.replace(/^Ahorro\s*:?[ ]*/i,"");return`<div class="promo-strip nx-strip"><svg class="promo-strip-bg" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="0" width="100" height="20" fill="#000"/></svg><span>P. unitario: ${s(n)}</span><span>Ahorro: ${s(o)}</span></div>`}return""}function qe(e){const t=f.calc(e).price;if(f.mechanic(e)==="nx")return`<div class="price nx-main-price">${s(t)}</div>`;const n=t.replace(/^\$/,"");return`<div class="price standard-main-price"><span class="currency">$</span><span class="price-amount">${s(n)}</span></div>`}function Te(e){return f.validity(e)||"Vigencia: SIN DATOS \u2014 NO IMPRIMIR"}function J(e,t="preview"){const n=f.validate(e);if(n.length)return`<article class="poster-blocked">Datos por revisar · ${s(f.reference(e))}<small>${s(n.join("; "))}</small></article>`;const o=Me(e);return`
      <article class="poster ${t} ${f.mechanic(e)}">
        <div class="poster-inner">
          <div class="price-block">
            ${qe(e)}
            <div class="payment-line">pagando con todo medio de pago</div>
            ${Re(e)}
          </div>

          <div class="product-block">
            <div class="product-name">${s(Le(e))}</div>
            <div class="product-brand">${s(e.brand||"")}</div>
            ${o?`<div class="unit-price">${s(o)}</div>`:""}
          </div>

          <div class="poster-bottom">
            <div class="barcode-zone">
              ${Ne(e.barcode||e.code)}
              <div class="barcode-number">${s(e.barcode||e.code)}</div>
              ${e.barcodeOrigin==="ITEM_INTERNAL"?`<div class="footer-info">EAN interno de referencia \xB7 \xCDtem ${s(e.code)}</div>`:""}
              <div class="footer-info">${e.manual?"Cartelería manual":"Destacado: "+s(Pe(e))}${e.code?" &nbsp; Item: "+s(e.code):""}</div>
              ${e.manual?"":`<div class="footer-info">Categoría: ${s(Fe(e))}</div>`}
              ${e.suppressLocal?"":`<div class="footer-info local-line">Local: ${s(a.local)}</div>`}
            </div>
            ${e.manual?"":`<div class="validity">${s(Te(e))}</div>`}
          </div>
        </div>
      </article>
    `}function Ne(e){const t=String(e||"").replace(/\D/g,"");if(t.length!==13)return xe(t);const n={0:"0001101",1:"0011001",2:"0010011",3:"0111101",4:"0100011",5:"0110001",6:"0101111",7:"0111011",8:"0110111",9:"0001011"},o={0:"0100111",1:"0110011",2:"0011011",3:"0100001",4:"0011101",5:"0111001",6:"0000101",7:"0010001",8:"0001001",9:"0010111"},c={0:"1110010",1:"1100110",2:"1101100",3:"1000010",4:"1011100",5:"1001110",6:"1010000",7:"1000100",8:"1001000",9:"1110100"},d={0:"LLLLLL",1:"LLGLGG",2:"LLGGLG",3:"LLGGGL",4:"LGLLGG",5:"LGGLLG",6:"LGGGLL",7:"LGLGLG",8:"LGLGGL",9:"LGGLGL"},g=Number(t[0]);let h="101";for(let r=1;r<=6;r++){const p=Number(t[r]);h+=d[g][r-1]==="L"?n[p]:o[p]}h+="01010";for(let r=7;r<=12;r++)h+=c[Number(t[r])];h+="101";const L=1.05;let u="";for(let r=0;r<h.length;r++)if(h[r]==="1"){const p=r<3||r>=45&&r<50||r>=92;u+=`<rect x="${(r*L).toFixed(2)}" y="0" width="${L.toFixed(2)}" height="${p?28:24}"/>`}return`<svg class="barcode" viewBox="0 0 100 28" role="img" aria-label="C\xF3digo de barras ${s(t)}">${u}</svg>`}function xe(e){const t=String(e||"").replace(/\D/g,"");let n="",o=3;for(let c=0;c<t.length*3+12;c++){const g=(Number(t[c%Math.max(t.length,1)]||1)+c)%3+1;if(c%2===0&&(n+=`<rect x="${o}" y="1" width="${g}" height="${18+c%3*2}"/>`),o+=g+1,o>94)break}return`<svg class="barcode" viewBox="0 0 100 24">${n}</svg>`}function H(){const e=document.getElementById("previewArea");if(e){if(!a.product){e.innerHTML="";return}e.innerHTML=`
      <div class="preview-block">
        ${J(a.product,"preview")}
        ${f.validate(a.product).length?`<div class="status error">No se puede imprimir: ${s(f.validate(a.product).join("; "))}</div>`:""}
        <button class="btn add" id="addQueue" type="button" ${f.validate(a.product).length?"disabled":""}>Agregar a cola</button>
      </div>
    `,document.getElementById("addQueue").addEventListener("click",()=>{if(f.validate(a.product).length)return window.alert("Cartel con datos por revisar.");a.queue.push({...a.product,qid:y.newId()}),_(),a.product=null,a.itemCode="";const t=document.getElementById("itemInput");t&&(t.value="",t.focus());const n=document.getElementById("searchStatus");n&&(n.innerHTML=""),H(),V()})}}function V(){const e=document.getElementById("queueList"),t=document.querySelector(".count"),n=document.getElementById("printBtn"),o=document.getElementById("clearQueue");if(e){if(t&&(t.textContent=a.queue.length),n&&(n.disabled=!a.queue.length||Y().length>0,n.textContent=Y().length?`Revisar ${Y().length} dato(s)`:"Imprimir cola"),o&&(o.disabled=!a.queue.length),!a.queue.length){e.innerHTML='<div class="empty-queue">La cola est\xE1 vac\xEDa.</div>';return}e.innerHTML=a.queue.map((c,d)=>`
      <div class="queue-item">
        <div class="queue-mini">${J(c,"mini")}</div>
        <div class="queue-copy">
          <strong>${s(c.price)}</strong>
          <span>${s(f.reference(c))}</span>
          <small>${s(c.name)}</small>
        </div>
        <button class="remove" data-index="${d}" type="button" aria-label="Eliminar de la cola">\xD7</button>
      </div>
    `).join(""),e.querySelectorAll(".remove").forEach(c=>c.addEventListener("click",()=>{a.queue.splice(Number(c.dataset.index),1),_(),V()}))}}let Q=null,K=null;function G(){K&&(clearTimeout(K),K=null),Q&&(Q.getTracks().forEach(e=>e.stop()),Q=null),document.getElementById("cameraScanner")?.remove()}function U(e=""){return String(e).toUpperCase().replace(/[^0-9A-F]/g,"").slice(0,12)}async function $e(e="item"){G();const t=e==="mac"?"Escanear c\xF3digo de impresora":"Escanear \xEDtem",n=e==="mac"?"Apunta al c\xF3digo de la Zebra que contiene la MAC.":"Apunta al c\xF3digo de barras del producto.";document.body.insertAdjacentHTML("beforeend",`
      <div class="camera-scanner" id="cameraScanner">
        <div class="camera-card">
          <div class="camera-head"><strong>${t}</strong><button id="closeCameraScanner" type="button">\xD7</button></div>
          <video id="scannerVideo" playsinline muted></video>
          <div class="camera-target"></div>
          <p>${n}</p>
          <div id="scannerStatus" class="scanner-status">Abriendo c\xE1mara\u2026</div>
          <button class="btn back-home" id="cancelScanner" type="button">Cancelar</button>
        </div>
      </div>`),document.getElementById("closeCameraScanner").onclick=G,document.getElementById("cancelScanner").onclick=G;const o=document.getElementById("scannerStatus"),c=document.getElementById("scannerVideo");try{if(Q=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:!1}),c.srcObject=Q,await c.play(),o.textContent="Buscando c\xF3digo\u2026",!("BarcodeDetector"in window)){o.textContent="Este navegador no permite lectura autom\xE1tica. Usa ingreso manual.";return}const d=await BarcodeDetector.getSupportedFormats().catch(()=>[]),g=e==="mac"?["qr_code","code_128","data_matrix","aztec","code_39"].filter(u=>d.includes(u)):["ean_13","ean_8","upc_a","upc_e","code_128","qr_code"].filter(u=>d.includes(u)),h=new BarcodeDetector(g.length?{formats:g}:void 0),L=async()=>{if(document.getElementById("cameraScanner")){try{const u=await h.detect(c);if(u&&u.length){const r=String(u[0].rawValue||"").trim();if(e==="mac"){const p=U(r);if(p.length!==12)o.textContent=`C\xF3digo le\xEDdo (${r}), pero no contiene una MAC v\xE1lida de 12 caracteres.`;else{a.mobileMac=p,localStorage.setItem(R,p),G(),Ee(p);return}}else{G();const p=document.getElementById("itemInput");p&&(p.value=r,a.itemCode=r,ye());return}}}catch{}K=setTimeout(L,180)}};L()}catch{o.textContent="No se pudo abrir la c\xE1mara. Revisa el permiso de c\xE1mara de Chrome."}}function ce(){const e=document.getElementById("mobileMacInput"),t=U(e?.value||"");if(e&&(e.value=t),t.length===12){a.mobileMac=t,localStorage.setItem(R,t);const o=document.getElementById("mobileRFStatus");return o&&(o.className="rf-status ok",o.textContent=`\u2713 Impresora guardada: ${t}`),t}const n=document.getElementById("mobileRFStatus");return n&&(n.className="rf-status error",n.textContent="La MAC debe tener 12 caracteres hexadecimales."),""}function Ee(e=""){if(!a.queue.length)return E();const t=U(e||a.mobileMac||localStorage.getItem(R)||"");t.length===12&&(a.mobileMac=t,localStorage.setItem(R,t)),I.innerHTML=`
      ${w()}
      <section class="screen print-choice-screen mobile-rf-screen">
        <div class="print-choice-card rf-setup-card">
          <div class="print-choice-top">
            <div>
              <span class="print-choice-kicker">Modo m\xF3vil \xB7 Local ${s(a.local)}</span>
              <h2>Impresora Port\xE1til (RF)</h2>
              <p>En m\xF3vil no se solicita IP. Identifica la Zebra por su c\xF3digo MAC.</p>
            </div>
            <button class="btn back-home" id="backMobileRF" type="button">Volver</button>
          </div>

          <div class="rf-form-grid">
            <label class="rf-field">
              <span>Cartel a imprimir</span>
              <select id="rfItemSelect">
                ${a.queue.map((n,o)=>`<option value="${o}">${s(f.reference(n))} · ${s(n.price)} \xB7 ${s(n.name)}</option>`).join("")}
              </select>
            </label>

            <label class="rf-field">
              <span>MAC de impresora Zebra</span>
              <input id="mobileMacInput" autocomplete="off" autocapitalize="characters" maxlength="17" placeholder="Ej. 6095325D07AA" value="${s(t)}">
            </label>
            <div class="mobile-mac-actions">
              <button class="btn scan-item-btn" id="scanMacBtn" type="button">\u25A3 Escanear MAC</button>
              <button class="btn ghost" id="saveMacBtn" type="button">Guardar MAC</button>
            </div>
          </div>

          <div class="rf-proof-box">
            <strong>Formato RF aprobado</strong>
            <span>58 mm de ancho \xFAtil \xB7 2 flejes de 35 mm por cartel.</span>
            <span>Esta versi\xF3n m\xF3vil no modifica el funcionamiento actual de PC.</span>
          </div>

          <div id="mobileRFStatus" class="rf-status ${t?"ok":""}">${t?`\u2713 Impresora guardada: ${s(t)}`:"Escanea o escribe la MAC de la impresora."}</div>

          <div class="rf-actions rf-actions-main">
            <button class="btn print" id="prepareMobileRF" type="button">Preparar impresi\xF3n m\xF3vil</button>
          </div>
          <div id="mobilePrintInfo" class="mobile-print-info"></div>
        </div>
      </section>`,document.getElementById("changeLocalTop").addEventListener("click",C),document.getElementById("backMobileRF").addEventListener("click",()=>{const n=document.getElementById("mobileMacInput"),o=U(n?.value||a.mobileMac||"");o.length===12&&(a.mobileMac=o,localStorage.setItem(R,o)),E()}),document.getElementById("scanMacBtn").addEventListener("click",()=>$e("mac")),document.getElementById("saveMacBtn").addEventListener("click",ce),document.getElementById("mobileMacInput").addEventListener("change",ce),document.getElementById("mobileMacInput").addEventListener("input",n=>{const o=U(n.target.value);o.length===12&&(a.mobileMac=o,localStorage.setItem(R,o))}),document.getElementById("prepareMobileRF").addEventListener("click",async()=>{if(!await Z())return;const n=ce();if(!n)return;const o=Se(),c=document.getElementById("mobilePrintInfo");c&&(c.innerHTML=`<strong>Listo para conexi\xF3n m\xF3vil</strong><span>\xCDtem ${s(o?.code||"")} \xB7 Zebra ${s(n)}</span><span>El ZPL de los 2 flejes ya est\xE1 preparado. El siguiente paso es enlazar el canal Android \u2192 Zebra sin tocar la versi\xF3n PC.</span>`)})}async function le(){await Z()&&(I.innerHTML=`
      ${w()}
      <section class="screen print-choice-screen">
        <div class="print-choice-card">
          <div class="print-choice-top">
            <div>
              <span class="print-choice-kicker">Cola de impresi\xF3n \xB7 ${a.queue.length} cartel${a.queue.length===1?"":"es"}</span>
              <h2>Selecciona d\xF3nde imprimir</h2>
              <p>Elige el tipo de impresora que vas a utilizar.</p>
            </div>
            <button class="btn back-home" id="backToQueue" type="button">Volver a la cola</button>
          </div>

          <div class="printer-options">
            <button class="printer-option letter-option" id="printLetter" type="button">
              <span class="printer-option-icon" aria-hidden="true">\u25A3</span>
              <span class="printer-option-copy">
                <strong>Impresora Tama\xF1o 1/4 Carta</strong>
                <small>${q()?"Env\xEDo remoto al PC del local \xB7 selecciona la impresora por IP":"Impresora fija \xB7 mantiene la configuraci\xF3n actual de impresi\xF3n"}</small>
              </span>
              <span class="printer-option-arrow" aria-hidden="true">\u203A</span>
            </button>

            <button class="printer-option rf-option" id="printRF" type="button">
              <span class="printer-option-icon" aria-hidden="true">\u25A4</span>
              <span class="printer-option-copy">
                <strong>Impresora Port\xE1til (RF)</strong>
                <small>${q()?"Modo m\xF3vil \xB7 MAC Zebra \xB7 flujo RF en prueba":"Impresi\xF3n desde equipo port\xE1til \xB7 configuraci\xF3n RF por puente local"}</small>
              </span>
              <span class="printer-option-arrow" aria-hidden="true">\u203A</span>
            </button>
          </div>
        </div>
      </section>
    `,document.getElementById("changeLocalTop").addEventListener("click",C),document.getElementById("backToQueue").addEventListener("click",E),document.getElementById("printLetter").addEventListener("click",()=>{q()?De():Qe()}),document.getElementById("printRF").addEventListener("click",()=>{q()?Ee():Ve()}))}function de(){return`carteleria.carta.ip.${a.local||"sin-local"}`}function ue(e=""){return String(e).trim().replace(/\s+/g,"")}function Ie(e=""){const n=ue(e).split(".");return n.length===4&&n.every(o=>/^\d{1,3}$/.test(o)&&Number(o)>=0&&Number(o)<=255)}function ze(){const e=[];for(let t=0;t<a.queue.length;t+=4)e.push(a.queue.slice(t,t+4));return e.map((t,n)=>`
      <section class="print-page ${n<e.length-1?"page-break":""}">
        ${[0,1,2,3].map(o=>`
          <div class="print-cell">
            ${t[o]?J(t[o],"print"):""}
          </div>
        `).join("")}
      </section>
    `).join("")}function Oe(e){const t=ze(),n=String(e||"").replace(/<\/style/gi,"<\\/style");return`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Carteler\xEDa \xB7 Local ${s(a.local)}</title>
  <style>${n}</style>
  <style>
    html,body{margin:0!important;padding:0!important;background:#fff!important}
    #remoteInfo{display:none!important}
    @media screen{#printRoot{display:block!important}}
  </style>
</head>
<body>
  <div id="app"></div>
  <div id="printRoot">${t}</div>
  <script>
    window.addEventListener('load', function(){
      setTimeout(function(){ window.print(); }, 350);
    });
    window.addEventListener('afterprint', function(){
      setTimeout(function(){ window.close(); }, 400);
    });
  <\/script>
</body>
</html>`}function W(e,t=""){const n=document.getElementById("letterRemoteStatus");n&&(n.className=`rf-status ${t}`.trim(),n.textContent=e)}async function je(){if(!await Z())return;const e=a.local,t=document.getElementById("letterPrinterIp"),n=document.getElementById("sendLetterRemote"),o=ue(t?.value||"");if(!Ie(o)){W("Ingresa una IP v\xE1lida de la impresora Tama\xF1o Carta.","error"),t?.focus();return}localStorage.setItem(de(),o),n&&(n.disabled=!0),W(`Enviando ${a.queue.length} cartel${a.queue.length===1?"":"es"} al local ${a.local}\u2026`,"working");try{const c=await fetch("styles.css",{cache:"no-store"});if(!c.ok)throw new Error(`No se pudo preparar el formato Carta (CSS ${c.status})`);const d=await c.text();if(a.local!==e)throw new Error("Cambiaste de local. Vuelve a elegir la cola para imprimir.");if(!d.includes("@media print")||!d.includes(".print-cell"))throw new Error("La hoja de estilos de impresi\xF3n no es v\xE1lida");const g={kind:"carta_html",version:"v23",local:String(a.local),printer_ip:o,cantidad:a.queue.length,html:Oe(d)},h=await fetch(`${ae}/trabajo`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({local:String(a.local),printer_ip:o,contenido:JSON.stringify(g)})}),L=await h.json().catch(()=>({}));if(!h.ok||!L.ok)throw new Error(L.error||`HTTP ${h.status}`);S.print(g.local,g.cantidad,"carta_remota"),W(`\u2713 Trabajo enviado al local ${a.local} \xB7 impresora ${o}`,"ok");const u=document.getElementById("letterRemoteInfo");u&&(u.innerHTML=`<strong>Enviado correctamente</strong><span>El PC del local ${s(a.local)} recibir\xE1 la cola y la enviar\xE1 a la impresora ${s(o)}.</span><span>La cola del tel\xE9fono se mantiene para permitir una reimpresi\xF3n si fuera necesario.</span>`)}catch(c){W(`No se pudo enviar la impresi\xF3n: ${c.message||"error de conexi\xF3n"}`,"error")}finally{n&&(n.disabled=!1)}}function De(){if(!a.queue.length)return E();const e=localStorage.getItem(de())||"";I.innerHTML=`
      ${w()}
      <section class="screen print-choice-screen mobile-letter-screen">
        <div class="print-choice-card rf-setup-card">
          <div class="print-choice-top">
            <div>
              <span class="print-choice-kicker">Tama\xF1o Carta \xB7 Local ${s(a.local)}</span>
              <h2>Enviar a impresora del local</h2>
              <p>Indica la IP de la impresora. El tel\xE9fono env\xEDa la cola a Cloudflare y el PC del local la imprime autom\xE1ticamente.</p>
            </div>
            <button class="btn back-home" id="backMobileLetter" type="button">Volver</button>
          </div>

          <div class="rf-form-grid letter-remote-grid">
            <label class="rf-field">
              <span>IP impresora Tama\xF1o Carta</span>
              <input id="letterPrinterIp" inputmode="decimal" autocomplete="off" placeholder="Ej. 22.117.224.123" value="${s(e)}">
            </label>
          </div>

          <div class="rf-proof-box">
            <strong>Destino remoto</strong>
            <span>Local ${s(a.local)} identifica el PC receptor. La IP identifica cu\xE1l impresora instalada en ese PC debe usar.</span>
            <span>La \xFAltima IP usada queda guardada en este tel\xE9fono para este local.</span>
          </div>

          <div id="letterRemoteStatus" class="rf-status">Listo para enviar ${a.queue.length} cartel${a.queue.length===1?"":"es"}.</div>

          <div class="rf-actions rf-actions-main">
            <button class="btn print" id="sendLetterRemote" type="button">Enviar impresi\xF3n Tama\xF1o Carta</button>
          </div>

          <div id="letterRemoteInfo" class="rf-pending-box letter-remote-info">
            <strong>Formato conservado</strong>
            <span>4 carteles por hoja y desplazamiento de 10 mm hacia arriba, igual a la impresi\xF3n Carta ya aprobada.</span>
          </div>
        </div>
      </section>`,document.getElementById("changeLocalTop").addEventListener("click",C),document.getElementById("backMobileLetter").addEventListener("click",le),document.getElementById("sendLetterRemote").addEventListener("click",je),document.getElementById("letterPrinterIp").addEventListener("change",t=>{const n=ue(t.target.value);t.target.value=n,Ie(n)&&localStorage.setItem(de(),n)})}function ee(e){return`carteleria.rf.${e}.${a.local||"sin-local"}`}function T(e=""){return String(e).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[\^~]/g," ").replace(/[^\x20-\x7E]/g," ").replace(/\s+/g," ").trim()}function He(e){const o=T(Le(e)).slice(0,30),c=T(e.brand||"").slice(0,18),d=T(e.size||"").slice(0,12),g=T(e.price||""),h=T(e.code||""),L=T(a.local||""),u=T(e.note||e.saving||e.unitLabel||"").slice(0,38),r=String(e.barcode||"").replace(/\D/g,""),p=`^XA
^PW464
^LL280
^LH0,0
^FO16,18^GB432,2,2^FS
^FO16,48^A0N,30,30^FB432,1,0,C,0^FDPRECIO / PROMO^FS
^FO12,92^A0N,82,74^FB440,1,0,C,0^FD${g}^FS
^FO16,220^A0N,19,19^FB432,1,0,C,0^FDPAGANDO CON TODO MEDIO DE PAGO^FS
^FO16,258^GB432,2,2^FS
^XZ`;let i="";r.length>=8&&r.length<=14&&(i=`^FO52,154^BY2,2,54^BCN,54,Y,N,N^FD${r}^FS`);const m=`^XA
^PW464
^LL280
^LH0,0
^FO16,14^A0N,26,24^FB432,1,0,L,0^FD${o}^FS
^FO16,46^A0N,21,20^FD${c}${d?"  "+d:""}^FS
${u?`^FO16,76^A0N,18,18^FB432,2,2,L,0^FD${u}^FS`:""}
^FO16,122^A0N,18,18^FD${h?"Item "+h+"   ":""}Local ${L}^FS
${i}
^XZ`;return p+`
`+m}function A(e,t=""){const n=document.getElementById("rfStatus");n&&(n.className=`rf-status ${t}`.trim(),n.textContent=e)}function Se(){const e=document.getElementById("rfItemSelect"),t=Number(e?e.value:0);return a.queue[t]||a.queue[0]||null}function me(){const e=(document.getElementById("rfPrinterIp")?.value||"").trim(),t=(document.getElementById("rfPrinterId")?.value||"").trim().toUpperCase().replace(/[^0-9A-F]/g,"");return e&&localStorage.setItem(ee("ip"),e),t&&localStorage.setItem(ee("id"),t),{ip:e,id:t}}async function Ze(){A("Comprobando puente RF\u2026","working");try{const e=await fetch("http://127.0.0.1:8787/health",{method:"GET",cache:"no-store"});if(!e.ok)throw new Error(`HTTP ${e.status}`);const t=await e.json();A(t&&t.ok?"\u2713 Puente RF conectado":"Puente RF respondi\xF3, pero no est\xE1 listo.",t&&t.ok?"ok":"error")}catch{A("No se detecta el puente RF. Ejecuta rf-print-bridge.ps1 en este PC y vuelve a probar.","error")}}async function _e(){const e=Se()?.qid;if(!await Z())return;const t=a.queue.find(d=>d.qid===e),n=a.local;if(!t){A("No hay un cartel seleccionado.","error");return}const{ip:o,id:c}=me();if(!/^\d{1,3}(\.\d{1,3}){3}$/.test(o)){A("Ingresa la IP de la impresora RF.","error");return}if(c&&!/^[0-9A-F]{12}$/.test(c)){A("El c\xF3digo de impresora debe tener 12 caracteres hexadecimales.","error");return}A(`Enviando \xEDtem ${t.code} a la RF\u2026`,"working");try{const d=await fetch("http://127.0.0.1:8787/print",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ip:o,port:9100,printerId:c,local:a.local,item:t.code,zpl:He(t)})}),g=await d.json().catch(()=>({}));if(!d.ok||!g.ok)throw new Error(g.error||`HTTP ${d.status}`);S.print(n,1,"rf"),A(`\u2713 \xCDtem ${t.code} enviado a ${o}:9100`,"ok")}catch(d){A(`No se pudo imprimir por RF: ${d.message||"error de conexi\xF3n"}`,"error")}}function Ve(){if(!a.queue.length)return E();const e=localStorage.getItem(ee("ip"))||"",t=localStorage.getItem(ee("id"))||"";I.innerHTML=`
      ${w()}
      <section class="screen print-choice-screen">
        <div class="print-choice-card rf-setup-card">
          <div class="print-choice-top">
            <div>
              <span class="print-choice-kicker">Impresora Port\xE1til (RF) \xB7 Local ${s(a.local)}</span>
              <h2>Prueba directa Zebra</h2>
              <p>Formato RF: cada cartel se imprime en 2 flejes consecutivos. El primero lleva la promo/precio y el segundo los datos del producto.</p>
            </div>
            <button class="btn back-home" id="backToPrintOptions" type="button">Volver</button>
          </div>

          <div class="rf-form-grid">
            <label class="rf-field">
              <span>Cartel a imprimir</span>
              <select id="rfItemSelect">
                ${a.queue.map((n,o)=>`<option value="${o}">\xCDtem ${s(n.code)} \xB7 ${s(n.price)} \xB7 ${s(n.name)}</option>`).join("")}
              </select>
            </label>

            <label class="rf-field">
              <span>IP impresora RF</span>
              <input id="rfPrinterIp" inputmode="decimal" placeholder="Ej. 23.117.226.10" value="${s(e)}">
            </label>

            <label class="rf-field">
              <span>C\xF3digo impresora / MAC (opcional para esta prueba)</span>
              <input id="rfPrinterId" autocomplete="off" maxlength="17" placeholder="Ej. 6095325D07AA" value="${s(t)}">
            </label>
          </div>

          <div class="rf-proof-box">
            <strong>Formato piloto RF</strong>
            <span>58 mm de ancho \xFAtil \xB7 2 flejes de 35 mm por cartel \xB7 separaci\xF3n f\xEDsica sugerida de 5 mm \xB7 ZPL por TCP 9100.</span>
            <span>La impresi\xF3n Tama\xF1o Carta no se modifica.</span>
          </div>

          <div id="rfStatus" class="rf-status">Primero comprueba que el puente RF est\xE9 activo.</div>

          <div class="rf-actions rf-actions-main">
            <button class="btn ghost" id="testRFBridge" type="button">Probar puente RF</button>
            <button class="btn print" id="sendRFPrint" type="button">Imprimir 1 cartel RF (2 flejes)</button>
          </div>

          <div class="rf-actions">
            <button class="btn back-home" id="backToQueueFromRF" type="button">Volver a la cola</button>
          </div>
        </div>
      </section>
    `,document.getElementById("changeLocalTop").addEventListener("click",C),document.getElementById("backToPrintOptions").addEventListener("click",le),document.getElementById("backToQueueFromRF").addEventListener("click",E),document.getElementById("testRFBridge").addEventListener("click",Ze),document.getElementById("sendRFPrint").addEventListener("click",_e),document.getElementById("rfPrinterIp").addEventListener("change",me),document.getElementById("rfPrinterId").addEventListener("change",me)}async function Qe(){if(!await Z())return;const e=a.local,t=a.queue.length,n=[];for(let o=0;o<a.queue.length;o+=4)n.push(a.queue.slice(o,o+4));we.innerHTML=n.map((o,c)=>`
      <section class="print-page ${c<n.length-1?"page-break":""}">
        ${[0,1,2,3].map(d=>`
          <div class="print-cell">
            ${o[d]?J(o[d],"print"):""}
          </div>
        `).join("")}
      </section>
    `).join(""),window.print(),S.print(e,t,"carta_pc")}let cyd53LastRefresh=0;
async function cyd53Refresh(force=false){
 if(!force&&Date.now()-cyd53LastRefresh<60000)return;
 const versionResponse=await fetch(ae+'/api/catalogo/version',{cache:'no-store'});if(!versionResponse.ok)throw new Error('No se pudo verificar la base de promociones.');
 const version=await versionResponse.json(),stamp=version.revision+'|'+version.day;
 if(!force&&window.CYD_CATALOG_STAMP===stamp){cyd53LastRefresh=Date.now();return;}
 const response=await fetch(ae+'/api/catalogo',{cache:'no-store'}),data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'No se pudieron actualizar los carteles.');
 k.splice(0,k.length,...data.catalog.map(p=>({...p,...f.calc(p)})));j.splice(0,j.length,...data.layout);ke.clear();for(const p of k.filter(p=>p.occamKey))ke.set(`${p.campaignId}:${p.signId}`,p);Ae.splice(0,Ae.length,...[...new Set(j.map(p=>X(p.subgrupo)))].sort((x,y)=>x.localeCompare(y,'es')));
 a.queue=a.queue.map(p=>f.canonical(p,k));window.CYD_CATALOG_STAMP=stamp;window.CYD_CATALOG_REVISION=data.revision;cyd53LastRefresh=Date.now();
}
function cyd53PrintHTML(products,css){
 const pages=[];for(let i=0;i<products.length;i+=4){const items=products.slice(i,i+4);pages.push(`<section class="print-page ${i+4<products.length?'page-break':''}">${[0,1,2,3].map(n=>`<div class="print-cell">${items[n]?J({...items[n],suppressLocal:true},'print'):''}</div>`).join('')}</section>`);}
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title></title><style>${String(css).replace(/<\/style/gi,'<\\/style')}</style><style>html,body{margin:0!important;padding:0!important;background:#fff!important}@media screen{#printRoot{display:block!important}}</style></head><body><div id="app"></div><div id="printRoot">${pages.join('')}</div><script>window.addEventListener('load',function(){setTimeout(function(){window.print()},350)});<\/script></body></html>`;
}
function cyd53MasterOpen(){
 a.local='';y.stop();
 window.CYD_MASTER.open({app:I,renderSign:J,printHTML:cyd53PrintHTML,logout(){window.CYD54_ACCESS.logout();}});
}

if(sessionStorage.getItem("cyd.master")==="Walter"){cyd53MasterOpen()}else a.local?(a.local=a.local.replace(/^0+(?=\d)/,""),N(),z(),S.start(a.local)):x()})();
