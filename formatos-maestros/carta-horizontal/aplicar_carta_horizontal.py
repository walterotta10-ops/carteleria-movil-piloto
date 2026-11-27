#!/usr/bin/env python3
"""Piloto 622: aplicar a V1.7.8 exacta sin alterar el archivo de origen."""
import sys, json, hashlib, pathlib
source = pathlib.Path(sys.argv[1])
target = pathlib.Path(sys.argv[2])
raw = source.read_bytes()
assert hashlib.sha256(raw).hexdigest() == '745ffec87938ee82046c5abbe214da184b891003d5bd5b02e0518429fe79e350', 'Worker base distinto; no aplicar.'
s = raw.decode('utf-8')
i = s.index('const G=') + len('const G=')
g, end = json.JSONDecoder().raw_decode(s[i:])
a = g['/app.js']['body']
def once(old, new):
    global a
    assert a.count(old) == 1, 'Punto de integración no único: ' + old[:80]
    a = a.replace(old, new, 1)
once('id="manualQueue" type="button">Ver cola de impresión</button></section>', 'id="manualQueue" type="button">Ver cola de impresión</button>${cyd82Pilot()?\'<button class="btn ghost" id="manualPrintOptions" type="button">Imprimir cola: 1/4 Carta o Carta Horizontal</button>\':\'\'}</section>')
once("document.getElementById('manualQueue').onclick=E;", "document.getElementById('manualQueue').onclick=E;\n  document.getElementById('manualPrintOptions')?.addEventListener('click',le);")
once('            <button class="printer-option rf-option" id="printRF"', '''            ${cyd82Pilot()?`<button class="printer-option letter-option" id="printLetterHorizontal" type="button">
              <span class="printer-option-icon" aria-hidden="true">▭</span>
              <span class="printer-option-copy"><strong>Impresora Tamaño Carta Horizontal</strong><small>Una hoja Carta horizontal por cartel · piloto local 622</small></span>
              <span class="printer-option-arrow" aria-hidden="true">›</span>
            </button>`:''}
            <button class="printer-option rf-option" id="printRF"''')
once('document.getElementById("printLetter").addEventListener("click",Qe)', 'document.getElementById("printLetter").addEventListener("click",Qe),document.getElementById("printLetterHorizontal")?.addEventListener("click",cyd82PrintHorizontal)')
new = r'''function cyd82Pilot(){const p=CYD_PROFILE();return p?.role==='store'&&String(p.code).replace(/^0+(?=\d)/,'')==='622'&&String(a.local).replace(/^0+(?=\d)/,'')==='622';}
const cyd82HorizontalCSS=`
@page{size:letter landscape;margin:5mm}
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif}
.cyd82-sheet{width:269mm;height:205mm;margin:0;padding:0;position:relative;break-inside:avoid;page-break-inside:avoid}
.cyd82-sheet:not(:last-child){break-after:page;page-break-after:always}
.poster.horizontal,.poster-inner{width:100%;height:100%;position:relative;margin:0;padding:0;background:#fff;color:#000}
.price-block,.product-block,.poster-bottom{position:absolute;left:5mm;right:5mm;text-align:right}
.price-block{top:5mm}.price{font-size:49mm;font-weight:600;line-height:.92;letter-spacing:-1.2mm;white-space:nowrap;text-align:right}
.standard-main-price{display:flex;align-items:flex-end;justify-content:flex-end;gap:2mm}.standard-main-price .currency{font-size:.58em;line-height:1;margin-bottom:.1em;letter-spacing:0}.price-amount{line-height:.92}
.nx-main-price{font-family:"Arial Narrow","Liberation Sans Narrow",Arial,sans-serif;font-stretch:condensed;font-size:47mm}
.offer .price{font-weight:700}.payment-line{font-size:7mm;line-height:1.1;margin-top:2mm;white-space:nowrap}
.promo-strip{position:relative;display:flex;justify-content:space-between;align-items:center;gap:3mm;height:12mm;margin-top:4mm;padding:0 5mm;background:#000;color:#fff;font-size:7mm;line-height:1;font-weight:800;white-space:nowrap;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.promo-strip-bg{position:absolute;inset:0;width:100%;height:100%;display:block}.promo-strip span{position:relative;z-index:1;transform:scaleY(1.17);color:#fff}
.product-block{top:101mm}.product-name{font-size:9.4mm;line-height:1.1;font-weight:600;text-transform:uppercase;overflow-wrap:anywhere}.product-brand,.unit-price{font-size:8mm;line-height:1.1;margin-top:2mm}.offer .product-name{font-weight:700}
.poster-bottom{bottom:3mm;display:grid;grid-template-columns:60% 40%;gap:0;align-items:end;text-align:left}.barcode-zone{min-width:0}.barcode{width:74mm;height:21mm;display:block;fill:#000}.barcode-number{width:74mm;font-size:3.4mm;line-height:1.15;text-align:center;margin-top:1mm}.footer-info{font-size:3.5mm;line-height:1.15;overflow-wrap:anywhere}.local-line{font-weight:800}.validity{font-size:3.7mm;line-height:1.2;text-align:right;padding-left:4mm;white-space:normal;padding-bottom:7mm}
@media screen{body{background:#e9ebee}.cyd82-sheet{margin:8mm auto;background:white}}
`;
function cyd82HorizontalHTML(products,ticket=null){
 const pages=products.map(p=>`<section class="cyd82-sheet">${J(p,'horizontal')}</section>`).join('');
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title></title><style>${cyd82HorizontalCSS}</style></head><body>${pages}<script>${window.CYD68_ALERTS.popupScript(ticket)}window.addEventListener('load',async function(){if(document.fonts)await document.fonts.ready;for(const page of document.querySelectorAll('.cyd82-sheet')){const price=page.querySelector('.price');if(price){let size=parseFloat(getComputedStyle(price).fontSize);while(price.scrollWidth>price.clientWidth+1&&size>32){size-=2;price.style.fontSize=size+'px';}}const product=page.querySelector('.product-block');const footer=page.querySelector('.poster-bottom');if(product&&footer){let size=parseFloat(getComputedStyle(product.querySelector('.product-name')).fontSize);while(product.getBoundingClientRect().bottom>footer.getBoundingClientRect().top-8&&size>18){size-=1;product.querySelector('.product-name').style.fontSize=size+'px';}}}setTimeout(function(){window.print()},350);});<\/script></body></html>`;
}
let cyd82Busy=false;
async function cyd82PrintHorizontal(){
 if(!cyd82Pilot()||cyd82Busy)return;
 if(window.CYD55_CATEGORIES.isMobileDevice()){window.CYD55_CATEGORIES.pcOnlyNotice();return;}
 const popup=window.open('','_blank');if(!popup){window.alert('Permite las ventanas emergentes para imprimir Carta Horizontal.');return;}
 cyd82Busy=true;let ticket=null,started=false;
 try{
  popup.document.write('<p>Preparando Carta Horizontal…</p>');
  if(!await Z()||!cyd82Pilot())return;
  const local=a.local,products=a.queue.slice();
  if(!products.length||products.some(p=>f.validate(p).length))throw new Error('Revisa los datos de los carteles antes de imprimir.');
  const weekly=await window.CYD69_WEEKLY.preparePrint(products);
  if(!cyd82Pilot()||a.local!==local||popup.closed)throw new Error('La impresión se canceló o cambió el local.');
  ticket=window.CYD68_ALERTS.begin({products,local,popup,weekly,refresh:()=>cyd53Refresh(true)});
  popup.document.open();popup.document.write(cyd82HorizontalHTML(products,ticket));popup.document.close();
  started=true;S.print(local,products.length,'carta_pc');
 }catch(error){window.CYD68_ALERTS.cancel(ticket);window.alert(error.message||'No se pudo preparar Carta Horizontal.');}
 finally{if(!started&&!popup.closed)popup.close();cyd82Busy=false;}
}
'''
once('let cyd53LastRefresh=0,cyd80RefreshPromise=null,cyd80Navigation=0;', new+'\nlet cyd53LastRefresh=0,cyd80RefreshPromise=null,cyd80Navigation=0;')
once('V1.7.8 SBA','V1.7.9 SBA')
g['/app.js']['body']=a
asset_start=s.index('"/app.js":',i); body_start=s.index('"body":',asset_start)+len('"body":'); _,body_len=json.JSONDecoder().raw_decode(s[body_start:]);
s=s[:body_start]+json.dumps(a,ensure_ascii=False)+s[body_start+body_len:]
assert s.count("version:'V1.7.8',servicio:")==1
s=s.replace("version:'V1.7.8',servicio:","version:'V1.7.9',servicio:",1)
target.write_bytes(s.encode('utf-8'))
print('Worker generado:',target)
