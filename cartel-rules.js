/* C&D Cartelería v28 — comprobaciones y datos de carteles.
 * Sin dependencia de local de extracción: el local que se imprime lo indica el usuario.
 * Sin vigencia, precios ni categorías predeterminados para campañas nuevas. */
(function(g){
  'use strict';
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const str = value => value === null || value === undefined ? '' : String(value).trim();
  const money = n => '$' + Math.round(Number(n)).toLocaleString('es-CL');
  const priceOk = n => Number.isSafeInteger(Number(n)) && Number(n) > 0;
  const numeric = n => Number.isFinite(Number(n)) && Number(n) > 0;
  const digits = n => str(n).replace(/\D/g,'');
  function sourceDate(v){
    if(!v) return null;
    const d = new Date(v); if(Number.isNaN(d.getTime())) return null;
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{
      timeZone:'America/Santiago',day:'2-digit',month:'2-digit',year:'numeric'
    }).formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    const month=Number(parts.month);
    return {day:parts.day,month,monthName:months[month-1],year:Number(parts.year),iso:`${parts.year}-${parts.month}-${parts.day}`};
  }
  function validity(p){
    const a=sourceDate(p.campaignFromDate),b=sourceDate(p.campaignToDate);
    if(!a||!b||a.iso>b.iso) return null;
    if(a.year===b.year) return `Vigencia: del ${a.day} de ${a.monthName} al ${b.day} de ${b.monthName[0].toUpperCase()+b.monthName.slice(1)} ${b.year}`;
    return `Vigencia: del ${a.day} de ${a.monthName} ${a.year} al ${b.day} de ${b.monthName[0].toUpperCase()+b.monthName.slice(1)} ${b.year}`;
  }
  function sizeDetails(p){
    const match=/^(\d+(?:[.,]\d+)?)\s*(CC|ML|LT|L|GR|G|KG|UN)$/i.exec(str(p.size));
    if(!match) return null;
    const n=Number(match[1].replace(',','.')); if(!numeric(n))return null;
    const u=match[2].toUpperCase();
    if(u==='CC'||u==='ML')return {amount:n/1000,label:'LT'};
    if(u==='LT'||u==='L')return {amount:n,label:'LT'};
    if(u==='GR'||u==='G')return {amount:n/1000,label:'KG'};
    if(u==='KG')return {amount:n,label:'KG'};
    return {amount:n,label:'UN'};
  }
  function unitMeasurePrice(p){
    const size=sizeDetails(p),qty=Number(p.qty),offer=Number(p.offer);
    if(!size||!numeric(qty)||!priceOk(offer))return '';
    return `${money(offer/(qty*size.amount))} x ${size.label}`;
  }
  function checkDigit(barcode){
    const s=digits(barcode);if(s.length!==13)return false;
    let sum=0;for(let i=0;i<12;i++)sum+=Number(s[i])*(i%2===0?1:3);
    return ((10-sum%10)%10)===Number(s[12]);
  }
  // La mecánica visible se obtiene del precio REAL y de la cantidad.
  // No confiar en 'type' importado: puede quedar obsoleto al actualizar precios.
  function mechanic(p){
    const qty=Number(p.qty),regular=Number(p.unit),offer=Number(p.offer);
    if(Number.isSafeInteger(qty)&&qty>1) return 'nx';
    if(Number.isFinite(regular)&&Number.isFinite(offer)&&regular>offer&&offer>0) return 'offer';
    return 'normal';
  }
  function savingAmount(p){
    const q=Number(p.qty),u=Number(p.unit),o=Number(p.offer);
    if(!Number.isSafeInteger(q)||q<1||!priceOk(u)||!priceOk(o))return null;
    return u*q-o;
  }
  function calc(p){
    const regular=Number(p.unit),offer=Number(p.offer),qty=Number(p.qty);
    return {
      price:qty>1?`${qty}x${money(offer)}`:money(offer),
      unitLabel:priceOk(regular)?`P. unitario ${money(regular)}`:'',
      saving:savingAmount(p)>0?`Ahorro ${money(savingAmount(p))}`:'',
      before:priceOk(regular)?money(regular):'',
      unitPrice:unitMeasurePrice(p),
      validity:validity(p)
    };
  }
  function validate(p){
    if(!p)return ['Producto no encontrado en el catálogo actual'];
    const err=[...(Array.isArray(p.dataIssues)?p.dataIssues:[])];
    for(const [field,label] of [['code','ítem'],['signId','ID de cartel'],['campaignId','ID de campaña'],['name','descripción'],['brand','marca'],['size','tamaño'],['categoryName','categoría']]){
      if(!str(p[field])&&!(field==='code'&&p.importVersion===53))err.push(`Falta ${label}`);
    }
    if(!checkDigit(p.barcode))err.push('Código EAN-13 inválido');
    if(!priceOk(p.unit))err.push('Falta modaPrice válido');
    if(!priceOk(p.offer))err.push('Falta precio de oferta válido');
    if(!Number.isSafeInteger(Number(p.qty))||Number(p.qty)<1)err.push('Cantidad de promoción inválida');
    if(priceOk(p.unit)&&priceOk(p.offer)&&numeric(p.qty)&&Number(p.unit)*Number(p.qty)<Number(p.offer))err.push('Oferta mayor al precio regular conjunto: verificar');
    if(!sizeDetails(p))err.push('Unidad o cantidad de medida sin verificar');
    if(!validity(p))err.push('Falta vigencia verificable de la misma campaña');
    if(priceOk(p.sourceModaPrice)&&Number(p.unit)!==Number(p.sourceModaPrice))err.push('Precio de referencia distinto al response');
    if(priceOk(p.sourceOfferPrice)&&Number(p.offer)!==Number(p.sourceOfferPrice))err.push('Oferta distinta al response');
    return [...new Set(err)];
  }
  // Remapea carteles en cola a la versión VIGENTE del catálogo: nunca imprime
  // viejas vigencias o precios almacenados en localStorage.
  function manualValidate(p){
    const err=[];
    if(!p||p.manual!==true)return ['Cartel manual inválido'];
    if(!/^\d{1,20}$/.test(str(p.code)))err.push('Ítem manual inválido');
    if(!str(p.name)||str(p.name).length>160)err.push('Descripción manual inválida');
    if(!str(p.brand)||str(p.brand).length>120)err.push('Marca manual inválida');
    if(!priceOk(p.offer))err.push('Ingresa un precio válido');
    if(!Number.isSafeInteger(Number(p.qty))||Number(p.qty)<1||Number(p.qty)>20)err.push('Cantidad debe estar entre 1 y 20');
    if(str(p.unit)&&Number(p.unit)!==0&&!priceOk(p.unit))err.push('Precio antes no válido');
    if(Number(p.unit)>0&&Number(p.unit)*Number(p.qty)<Number(p.offer))err.push('Precio antes menor al precio ingresado');
    return err;
  }
  const legacyValidate=validate;
  validate=function(p){return p?.manual===true?manualValidate(p):legacyValidate(p)};
  function canonical(entry,catalog){
    if(entry&&entry.manual===true) return {...entry,manual:true,dataIssues:manualValidate(entry)};
    if(!entry)return {dataIssues:['Cartel vacío en cola']};
    const c=(catalog||[]);
    const campaign=str(entry.campaignId);
    const matches=c.filter(p=>str(p.campaignId)===campaign && (str(entry.signId)?str(p.signId)===str(entry.signId):str(p.code)===str(entry.code)));
    if(matches.length!==1) return {...entry,dataIssues:[`Ítem ${str(entry.code)||'?'}: no está identificado de forma única en la lista actual. Elimínalo de la cola y vuelve a agregarlo.`]};
    return {...matches[0],qid:entry.qid};
  }
  function auditQueue(queue){return (queue||[]).flatMap(p=>validate(p).map(error=>({code:str(p.code)||'?',error})));}
  g.CARTELERIA_RULES=Object.freeze({sourceDate,validity,sizeDetails,unitMeasurePrice,checkDigit,mechanic,savingAmount,calc,validate,canonical,auditQueue,money});
})(typeof window!=='undefined'?window:globalThis);

/* Recupera las referencias verificadas de colas anteriores sin confundir PN e ítem. */
(function(g){
 'use strict';
 const base=g.CARTELERIA_RULES;
 const str=value=>value==null?'':String(value).trim();
 const norm=value=>str(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 const listKey=value=>{const key=norm(value);return key==='EXTENSIONEDLP'?'EDLPEXTENSION':key;};
 const stale=p=>p?.dataIssues?.some(message=>str(message).includes('no está identificado'));
 const current=(p,entry)=>({...p,...base.calc(p),qid:entry.qid});
 function canonical(entry,catalog){
  const direct=base.canonical(entry,catalog);
  if(!entry||entry.manual||!stale(direct))return direct;
  const key=str(entry.campaignId)+'|'+str(entry.signId),ref=g.CYD_QUEUE_REFERENCES?.[key];
  const all=catalog||[],alias=g.CYD_QUEUE_ALIASES?.[key];
  let matches=alias?all.filter(p=>p.occamKey===alias):[];
  if(matches.length===1)return current(matches[0],entry);
  if(!ref)return direct;
  const candidates=all.filter(p=>p.occamKey&&str(p.sourceProductNbr)===str(ref.pn));
  matches=candidates.filter(p=>listKey(p.occamList)===listKey(ref.list));
  if(matches.length===1)return current(matches[0],entry);
  if(matches.length===0&&ref.barcode){
   matches=candidates.filter(p=>str(p.barcode)===str(ref.barcode));
   if(matches.length===1)return current(matches[0],entry);
  }
  return {...direct,code:ref.item||'',barcode:ref.barcode||'',name:ref.name||'',brand:ref.brand||'',sourceProductNbr:ref.pn,sourceUPC:ref.barcode||'',identificationNote:ref.item?'':'Sin ítem identificado',identitySource:ref.identitySource||'',importVersion:53,dataIssues:[matches.length>1?'Hay varias promociones vigentes para este UPC. Selecciona la lista correspondiente.':'Esta promoción ya no figura en la lista vigente. Revisa sus datos antes de imprimir.']};
 }
 function reference(p){
  if(p?.code&&!stale(p))return 'Ítem '+str(p.code);
  const key=str(p?.campaignId)+'|'+str(p?.signId),ref=g.CYD_QUEUE_REFERENCES?.[key];
  const upc=str(p?.barcode||p?.sourceUPC||ref?.barcode);
  return upc?'UPC '+upc:'Referencia pendiente';
 }
 g.CARTELERIA_RULES=Object.freeze({...base,canonical,reference});
})(window);
