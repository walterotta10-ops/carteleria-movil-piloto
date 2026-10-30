/* Lectura local de XLSX/CSV sin enviar el archivo a servicios externos. */
(function(g){
  'use strict';
  const decoder=new TextDecoder();
  const xml=s=>{const d=new DOMParser().parseFromString(s,'application/xml');if(d.getElementsByTagName('parsererror').length)throw new Error('El archivo contiene XML inválido.');return d;};
  const tags=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));
  const first=(node,name)=>tags(node,name)[0];
  async function unzip(buffer){
    const a=new Uint8Array(buffer),v=new DataView(buffer);let end=-1;
    for(let p=a.length-22;p>=Math.max(0,a.length-65557);p--)if(v.getUint32(p,true)===0x06054b50){end=p;break;}
    if(end<0)throw new Error('No es un XLSX válido. Guarda el archivo como .xlsx.');
    const count=v.getUint16(end+10,true);if(count>2000)throw new Error('El archivo contiene demasiadas secciones.');
    let p=v.getUint32(end+16,true);const entries=new Map();
    for(let n=0;n<count;n++){
      if(p+46>a.length||v.getUint32(p,true)!==0x02014b50)throw new Error('Archivo XLSX incompleto.');
      const flags=v.getUint16(p+8,true),method=v.getUint16(p+10,true),compressed=v.getUint32(p+20,true),size=v.getUint32(p+24,true),len=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),comment=v.getUint16(p+32,true),offset=v.getUint32(p+42,true),name=decoder.decode(a.slice(p+46,p+46+len));
      entries.set(name,{flags,method,compressed,size,offset});p+=46+len+extra+comment;
    }
    return async name=>{
      const e=entries.get(name);if(!e)return null;if(e.flags&1)throw new Error('El XLSX está protegido con contraseña.');if(e.size>30000000)throw new Error('La hoja supera el tamaño permitido.');
      const p=e.offset;if(p+30>a.length||v.getUint32(p,true)!==0x04034b50)throw new Error('Sección XLSX inválida.');
      const start=p+30+v.getUint16(p+26,true)+v.getUint16(p+28,true);if(start+e.compressed>a.length)throw new Error('El XLSX está incompleto.');
      let bytes=a.slice(start,start+e.compressed);
      if(e.method===8){let ds;try{ds=new DecompressionStream('deflate-raw');}catch{throw new Error('Abre la carga con una versión actual de Chrome o Edge.');}const reader=new Blob([bytes]).stream().pipeThrough(ds).getReader(),parts=[];let size=0;while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>30000000){await reader.cancel();throw new Error('La hoja supera el tamaño permitido.');}parts.push(r.value);}bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length;}}
      else if(e.method!==0)throw new Error('Compresión XLSX no admitida.');
      if(bytes.length!==e.size)throw new Error('El archivo está dañado o incompleto.');return decoder.decode(bytes);
    };
  }
  function csv(s){
    const separator=(s.split(/\r?\n/,1)[0].match(/;/g)||[]).length>(s.split(/\r?\n/,1)[0].match(/,/g)||[]).length?';':',';
    let rows=[],row=[],value='',quoted=false;
    for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===separator&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&s[i+1]==='\n')i++;row.push(value);if(row.some(x=>x.trim()))rows.push(row);row=[];value='';}else value+=c;}
    row.push(value);if(row.some(x=>x.trim()))rows.push(row);if(quoted)throw new Error('CSV con comillas sin cerrar.');return rows;
  }
  async function read(file){
    if(!file||file.size>20000000)throw new Error('El archivo debe pesar hasta 20 MB.');
    if(/\.csv$/i.test(file.name))return csv((await file.text()).replace(/^\uFEFF/,''));
    if(!/\.xlsx$/i.test(file.name))throw new Error('Selecciona un archivo .xlsx o .csv.');
    const get=await unzip(await file.arrayBuffer()),sharedText=await get('xl/sharedStrings.xml');
    const shared=sharedText?tags(xml(sharedText),'si').map(si=>tags(si,'t').map(n=>n.textContent).join('')):[];
    const wb=xml(await get('xl/workbook.xml')||''),sheet=first(wb,'sheet');let path='xl/worksheets/sheet1.xml';
    if(sheet){const relText=await get('xl/_rels/workbook.xml.rels');if(relText){const relId=sheet.getAttribute('r:id')||sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'),rel=tags(xml(relText),'Relationship').find(r=>r.getAttribute('Id')===relId);if(rel){const target=rel.getAttribute('Target');path=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');}}}
    const sheetText=await get(path);if(!sheetText)throw new Error('No se encontró la hoja de promociones.');
    const sheetRows=tags(xml(sheetText),'row');if(sheetRows.length>20001)throw new Error('Carga hasta 20.000 filas por archivo.');
    const rows=[];
    for(const r of sheetRows){const row=[];for(const c of tags(r,'c')){const ref=c.getAttribute('r')||'',m=/^[A-Z]+/.exec(ref);if(!m)continue;let column=0;for(const ch of m[0])column=column*26+ch.charCodeAt(0)-64;column--;if(column>60)continue;const t=c.getAttribute('t'),v=first(c,'v')?.textContent||'';row[column]=t==='s'?shared[Number(v)]||'':t==='inlineStr'?tags(c,'t').map(n=>n.textContent).join(''):t==='b'?Number(v):v!==''&&Number.isFinite(Number(v))?Number(v):v;}if(row.some(v=>v!==''&&v!=null))rows.push(row);}
    return rows;
  }
  g.CYD_XLSX={read};
})(window);
