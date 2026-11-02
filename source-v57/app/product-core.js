/* C&D V56. Identidad y datos de producto; no contiene precios. */
function createProductCore(){
 'use strict';
 const fields=['item','upc','descripcion','marca','unidad'];
 const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
 const item=value=>clean(value).replace(/^0+(?=\d)/,'');
 const plain=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 function unit(value){return clean(value).replace(/(\d)[.,](\d)/g,'$1.$2').replace(/(\d)\s*(KGS?|KILOGRAMOS?)\b/ig,'$1 kg').replace(/(\d)\s*(GRS?|GRAMOS?)\b/ig,'$1 g').replace(/(\d)\s*G\b/ig,'$1 g').replace(/(\d)\s*(MLS?|MILILITROS?)\b/ig,'$1 ml').replace(/(\d)\s*(LTS?|LITROS?)\b/ig,'$1 L');}
 function normalize(row){return {item:item(row.item),upc:clean(row.upc),descripcion:clean(row.descripcion).toUpperCase(),marca:clean(row.marca).toUpperCase(),unidad:unit(row.unidad||row.contenido||'')};}
 function checkDigit12(value){const digits=clean(value);if(!/^\d{12}$/.test(digits))return null;let sum=0;for(let i=0;i<12;i++)sum+=Number(digits[i])*(i%2?3:1);return String((10-sum%10)%10);}
 function completeEan13(value){const digits=clean(value),check=checkDigit12(digits);return check===null?'':digits+check;}
 function validEan(value){return /^\d{13}$/.test(value)&&completeEan13(value.slice(0,12))===value;}

 function barcodeKey(value){const text=clean(value),key=text.replace(/^0+/,'');return key.length>=8?key:text;}
 function identity(row){return item(row.item)+'|'+clean(row.upc);}
 function fingerprint(row){const value=normalize(row);return fields.map(key=>plain(value[key])).join('|');}
 /** @param {any[]} rows */
 function index(rows){
  const items=new Map(),barcodes=new Map();
  const add=(map,key,row)=>{if(!key)return;if(!map.has(key))map.set(key,[]);const list=map.get(key);if(!list.some(r=>identity(r)===identity(row)))list.push(row);};
  for(const row of rows){add(items,item(row.item),row);for(const key of new Set([clean(row.upc),barcodeKey(row.upc),...(validEan(clean(row.upc))?[clean(row.upc).slice(0,12)]:[])]))add(barcodes,key,row);}
  return {items,barcodes,find(value){const query=clean(value),matches=[...(barcodes.get(query)||[]),...(barcodes.get(barcodeKey(query))||[]),...(query.length<=10?items.get(item(query))||[]:[])];return [...new Map(matches.map(r=>[identity(r),r])).values()];}};
 }
 /** @param {any[]} base @param {any[]} overlays */
 function merge(base,overlays=[]){const records=new Map();for(const row of [...base,...overlays]){const product=normalize(row);if(!product.item||!product.upc)continue;const key=identity(product);records.set(key,{...(records.get(key)||{}),...product});}return [...records.values()];}
 function resolve(row,lookup){const product=normalize(row),byBarcode=lookup.barcodes.get(product.upc)||lookup.barcodes.get(barcodeKey(product.upc))||[];const candidates=byBarcode.filter(r=>!product.item||item(r.item)===product.item);if(candidates.length===1){product.upc=clean(candidates[0].upc);if(!product.item)product.item=item(candidates[0].item);}return product;}
 /** @param {any[]} records */
 function assess(row,records){const lookup=index(records),product=resolve(row,lookup),same=records.find(r=>identity(r)===identity(product)),owners=lookup.barcodes.get(product.upc)||[];if(!same&&owners.some(r=>item(r.item)!==product.item))return {kind:'conflict',product,message:'Ese UPC está asociado a otro ítem. Requiere revisión del usuario maestro.'};if(same&&fingerprint(same)===fingerprint(product))return {kind:'duplicate',product,message:'Estos datos ya están en la maestra.'};return {kind:same?'enrichment':'new',product,message:same?'Completa o corrige un producto existente.':'Producto nuevo para la maestra.'};}
 function errors(row){const p=normalize(row),out=[];if(!/^\d{1,10}$/.test(p.item)||Number(p.item)===0)out.push('Revisa el ítem.');if(!/^\d{4,20}$/.test(p.upc))out.push('Revisa el UPC: solo dígitos.');if(!p.descripcion||p.descripcion.length>160)out.push('Ingresa una descripción de hasta 160 caracteres.');if(!p.marca||p.marca.length>80)out.push('Ingresa una marca de hasta 80 caracteres.');if(!p.unidad||p.unidad.length>60)out.push('Ingresa la unidad de medida, por ejemplo 360 g.');return out;}
 /** OCR propone datos; el usuario confirma cada campo antes de enviarlo. */
 function parseFleje(result,lookup){
  const text=String(result.text||''),top=String(result.top||text),upcText=String(result.upc||text),itemText=String(result.item||'');
  const barcodeTokens=upcText.match(/\b\d{8,20}\b/g)||[],known=barcodeTokens.flatMap(value=>lookup.barcodes.get(value)||lookup.barcodes.get(barcodeKey(value))||[]),distinct=[...new Map(known.map(r=>[identity(r),r])).values()];
  const rawItem=(itemText.match(/\b\d{5,10}\b/g)||[])[0]||'',code=barcodeTokens.find(code=>code.length===12)||barcodeTokens[barcodeTokens.length-1]||'';
  const match=distinct.length===1?distinct[0]:distinct.find(r=>rawItem&&item(r.item)===item(rawItem));
  const content=top.toUpperCase().replace(/(\d)O(?=\s*(?:GR|G|KG|ML)\b)/g,'$10').match(/\b\d+(?:[.,]\d+)?\s*(?:KG|GRS?|G|ML|LTS?|LITROS?)\b/);
  const lines=top.split(/\r?\n/).map(clean).filter(Boolean).filter(line=>!/[\$]|\b(?:POR|CH|CV|IPW|TPW)\b/.test(line));
  const withoutUnit=line=>clean(line.replace(/\b\d+(?:[.,]\d+)?\s*(?:KG|GRS?|G|ML|LTS?)\b/ig,''));
  const calculated=!match&&/^\d{12}$/.test(code),completed=calculated?completeEan13(code):code;
  return {product:normalize({item:match?.item||rawItem,upc:match?.upc||completed,descripcion:match?.descripcion||withoutUnit(lines[0]||''),marca:match?.marca||withoutUnit(lines[1]||''),unidad:content?unit(content[0]):''}),matched:!!match,calculated,rawUpc:code,ambiguous:distinct.length>1&&!match};
 }
 return {fields,clean,item,unit,normalize,checkDigit12,completeEan13,validEan,barcodeKey,identity,fingerprint,index,merge,resolve,assess,errors,parseFleje};
}
// BROWSER-ONLY
if(typeof window!=='undefined')window.CYD56_CORE=createProductCore();
