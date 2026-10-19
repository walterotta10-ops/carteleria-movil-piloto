#!/usr/bin/env node
'use strict';
/* v28: auditar primero y aplicar expresamente con --apply.
   Usar: node tools/import-lista.cjs ruta/lista.json [--apply]
   Nunca copiar datos entre campañas; local de extracción es metadato, no filtro. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const filepath=process.argv.find(a=>a.endsWith('.json'));
const apply=process.argv.includes('--apply');
if(!filepath){console.error('Uso: node tools/import-lista.cjs lista.json [--apply]');process.exit(2);}
const incoming=JSON.parse(fs.readFileSync(path.resolve(filepath),'utf8'));
const records=Array.isArray(incoming)?incoming:
  Array.isArray(incoming.items)?incoming.items:
  Array.isArray(incoming.data?.data)?incoming.data.data:
  Array.isArray(incoming.data)?incoming.data:null;
if(!records?.length)throw new Error('Archivo sin listado de ítems');
const total=Number(incoming.total??incoming.data?.total??records.length);
if(total>records.length)throw new Error(`Listado incompleto: llegaron ${records.length} de ${total}. Exporta todas las páginas del response antes de continuar.`);
const originalPath=path.join(root,'data','campanas.json');
const originals=fs.existsSync(originalPath)?JSON.parse(fs.readFileSync(originalPath,'utf8')):[];
const next=new Map(originals.map(c=>[String(c.campaignId),c]));
const byCampaign=new Map();
for(const [idx,p] of records.entries()){
  const id=p.campaignId??incoming.campaignId??incoming.data?.campaignId;
  if(id===null||id===undefined||id==='')throw new Error(`Registro ${idx+1}: sin campaignId`);
  if(!byCampaign.has(String(id)))byCampaign.set(String(id),[]);
  byCampaign.get(String(id)).push({...p,campaignId:id});
}
for(const [id,items] of byCampaign)next.set(id,{campaignId:Number(id),sourceStoreNbr:incoming.storeNbr??items[0].storeNbr??null,items});
function str(x){return x===null||x===undefined?'':String(x).trim();}
function sole(items,k){const vals=[...new Set(items.map(p=>p[k]).filter(v=>v!==null&&v!==undefined&&v!==''))];return vals.length===1?vals[0]:null;}
function num(x){return Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):null;}
function validDate(x){if(!x)return false;return !Number.isNaN(new Date(x).valueOf());}
function dateParts(v){if(!validDate(v))return null;const d=new Date(v);const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Santiago',day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${parts.day}/${parts.month}/${parts.year}`;}
function ean13(x){const s=str(x);if(!/^\d{13}$/.test(s))return false;let t=0;for(let i=0;i<12;i++)t+=Number(s[i])*(i%2===0?1:3);return (10-t%10)%10===Number(s[12]);}
let catalog=[],report=[];
for(const c of next.values()){
  const commonFields=['campaignFromDate','campaignToDate','campaignName','mechanicTypeId'];
  const common=Object.fromEntries(commonFields.map(k=>[k,sole(c.items,k)]));
  const categoryCommon=Object.fromEntries(['categoryName','categoryId'].map(k=>[k,sole(c.items,k)]));
  let completedDates=0,differentPrices=0;
  const problems=[];
  for(const orig of c.items){
    const p={...orig};const inherited=[];
    for(const k of commonFields){if(!str(p[k])&&common[k]!==null){p[k]=common[k];inherited.push(k);}}
    for(const k of ['categoryName','categoryId']){if(!str(p[k])&&categoryCommon[k]!==null){p[k]=categoryCommon[k];inherited.push(k);}}
    if(inherited.includes('campaignFromDate')||inherited.includes('campaignToDate'))completedDates++;
    const unit=num(p.modaPrice),sb=num(p.sbPrice),offer=num(p.offerPrice),qty=Number(p.productQuantity);
    const category=str(p.categoryName);
    const name=str(p.desc1||p.desc2),brand=str(p.brandName),size=str(p.shlflbl1SizeDesc);
    const issues=[];
    if(!str(p.itemNbr))issues.push('Falta número de ítem');
    if(!str(p.signId))issues.push('Falta ID de cartel');
    if(!name)issues.push('Falta descripción');
    if(!brand)issues.push('Falta marca');
    if(!size)issues.push('Falta tamaño');
    if(!/^(\d+(?:[.,]\d+)?)(CC|ML|LT|L|GR|G|KG|UN)$/i.test(size.replace(/\s/g,'')))issues.push('Medida desconocida: verificar unidad');
    if(!ean13(p.upcNbrWithCheckDigit))issues.push('Código EAN-13 faltante o inválido');
    if(!unit)issues.push('Falta modaPrice');
    if(!offer)issues.push('Falta offerPrice');
    if(!Number.isSafeInteger(qty)||qty<1)issues.push('Falta productQuantity válido');
    if(!validDate(p.campaignFromDate)||!validDate(p.campaignToDate)||new Date(p.campaignFromDate)>new Date(p.campaignToDate))issues.push('Vigencia no verificable dentro de campaña');
    if(!category||!str(p.categoryId))issues.push('Categoría incompleta');
    if(unit&&offer&&qty>0&&unit*qty<offer)issues.push('Precio promocional mayor al normal conjunto');
    if(unit&&sb&&unit!==sb)differentPrices++;
    if(issues.length)problems.push({itemNbr:p.itemNbr,signId:p.signId,issues});
    const listName=`${str(p.campaignName)||'Campaña'} – Lista ${p.campaignId}`;
    const row={
      code:str(p.itemNbr),barcode:str(p.upcNbrWithCheckDigit),name,brand,size,
      type:qty>1?'nx':'offer',unit,regular:sb,qty,offer,
      campaignId:Number(p.campaignId),campaignName:str(p.campaignName),listName,
      categoryId:p.categoryId??null,categoryName:category,signId:p.signId,
      campaignFromDate:p.campaignFromDate||null,campaignToDate:p.campaignToDate||null,
      sourceStoreNbr:p.storeNbr??c.sourceStoreNbr??null,
      sourceModaPrice:p.modaPrice??null,sourceSbPrice:p.sbPrice??null,sourceOfferPrice:p.offerPrice??null,
      sourceQuantity:p.productQuantity??null,sourceSellUOMCode:p.sellUOMCode??null,
      sourceProductNbr:p.productNbr??null,sourceItemType:p.itemType??null,
      sourceDateInferred:inherited.includes('campaignFromDate')||inherited.includes('campaignToDate'),
      dataIssues:issues,importVersion:28
    };
    catalog.push(row);
  }
  report.push({campaignId:c.campaignId,sourceStoreNbr:c.sourceStoreNbr,total:c.items.length,
    inicio:dateParts(common.campaignFromDate),fin:dateParts(common.campaignToDate),
    registrosFechasRecuperadas:completedDates,preciosDeSalaDistintos:differentPrices,
    registrosBloqueados:problems.length,excepciones:problems,
    missingOfficialHtml:c.items.filter(p=>!p.html).length});
}
// Rechazar duplicación ambigua del identificador de cartel dentro de una misma campaña.
const seen=new Set();for(const p of catalog){const key=`${p.campaignId}:${p.signId}`;if(seen.has(key))throw new Error('IDs de cartel duplicados: '+key);seen.add(key);}
const summary=['INFORME DE VALIDACIÓN DE LISTAS','El número de local de extracción NO determina el local impreso.','Precio unitario / ahorro: modaPrice. Oferta: offerPrice. Precio sala sbPrice se conserva separado.',''];
for(const a of report){summary.push(`Campaña ${a.campaignId}: ${a.total} carteles; vigencia ${a.inicio||'?'} al ${a.fin||'?'}; fechas recuperadas ${a.registrosFechasRecuperadas}; precios distintos (modaPrice/sbPrice) ${a.preciosDeSalaDistintos}; bloqueados ${a.registrosBloqueados}.`);for(const e of a.excepciones)summary.push(` - Ítem ${e.itemNbr}: ${e.issues.join(', ')}`);}
summary.push('',apply?'DATOS ACTUALIZADOS — Requiere ensayo físico antes de usar en tienda.':'SIMULACIÓN / INFORME PREVIO. No se actualizó el catálogo; ejecutar con --apply tras revisar el informe.');
const r=summary.join('\n')+'\n';
console.log(r);
fs.writeFileSync(path.join(root,'data','INFORME-VALIDACION-ACTUAL.txt'),r);
if(apply){
  fs.writeFileSync(originalPath,JSON.stringify([...next.values()],null,2)+'\n');
  fs.writeFileSync(path.join(root,'catalog.js'),'window.CARTELERIA_CATALOG = '+JSON.stringify(catalog,null,2)+';\n');
  fs.writeFileSync(path.join(root,'data','catalog.json'),JSON.stringify(catalog,null,2)+'\n');
  fs.writeFileSync(path.join(root,'data','products.json'),JSON.stringify({total:catalog.length,items:catalog},null,2)+'\n');
  fs.writeFileSync(path.join(root,'data','auditoria-listas.json'),JSON.stringify(report,null,2)+'\n');
}
