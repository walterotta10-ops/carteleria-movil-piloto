(function(g){
 'use strict';
 const text=v=>String(v??'').trim(),norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(),esc=v=>text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=v=>Number(v).toLocaleString('es-CL'),money=v=>Number.isFinite(Number(v))?'$'+Math.round(Number(v)).toLocaleString('es-CL'):'Precio por revisar';
 const groups={red:new Set(['EDLP','EDLPEXTENSION','EDLPMMPP']),yellow:new Set(['BODEGAZO3','LISTA4','TRAFICO3'])};
 function listOf(value){return typeof value==='string'?value:value?.list||value?.occamList||value?.lista||'';}
 function classify(value){const list=norm(listOf(value)).replace(/[^A-Z0-9]/g,'');return groups.red.has(list)?'red':groups.yellow.has(list)?'yellow':'other';}
 function matches(value,type){return !type||type==='all'||classify(value)===type;}
 function records(catalog){return (catalog||[]).filter(p=>p.occamKey).map(p=>{
  const department=text(p.subgrupo)||'Sin departamento',category=[text(p.categoryId),text(p.categoryName)].filter(Boolean).join(' ')||'Sin categoría',list=text(p.occamList),item=text(p.code),upc=text(p.barcode);
  return {key:p.occamKey,department,category,list,item,upc,name:text(p.name),brand:text(p.brand),size:text(p.size),type:classify(list),sign:p,search:norm([p.name,p.brand,p.size,item,upc,p.sourceProductNbr,department,category,list].join(' '))};
 });}
 function filter(rows,state){const tokens=norm(state.query).split(/\s+/).filter(Boolean);return rows.filter(r=>matches(r,state.type)&&(state.department==='all'||!state.department||r.department===state.department)&&(state.category==='all'||!state.category||r.category===state.category)&&(state.list==='all'||!state.list||r.list===state.list)&&tokens.every(t=>r.search.includes(t)));}
 function counts(rows){return rows.reduce((out,r)=>{out[classify(r)]++;out.all++;return out;},{all:0,red:0,yellow:0,other:0});}
 function picker(rows,selected='all',attribute='data-cyd55-type'){
  if(!/^data-[a-z0-9-]+$/.test(attribute))throw new Error('Selector de listas no válido.');const c=counts(rows);
  const card=(type,title,tag,lists,art)=>`<button type="button" class="cyd55-list-choice ${type}${selected===type?' is-selected':''}" ${attribute}="${type}" aria-pressed="${selected===type}" aria-label="${tag}: ${title}"><span class="cyd55-list-title">${title}</span><span class="cyd55-list-art ${type}" aria-hidden="true">${art}</span><span class="cyd55-list-bottom"><strong>${tag}</strong><b>${number(c[type])} productos</b></span><small>${lists}</small></button>`;
  return `<section class="cyd55-list-picker" aria-label="Selecciona la lista"><div class="cyd55-picker-head"><h2>Selecciona la lista</h2><button type="button" class="cyd55-all-lists${selected==='all'?' is-selected':''}" ${attribute}="all" aria-pressed="${selected==='all'}">Todas las listas · ${number(c.all)}</button></div><div class="cyd55-list-options">${card('red','EDLP','Cartel rojo','EDLP · EDLP Extensión · EDLP MMPP','<b>BARATO</b><em>todos los días</em>')}${card('yellow','Lista Promocional','Cartel amarillo','Bodegazo 3 · Lista 4 · Tráfico 3','<em>Ahora más</em><b>BARATO</b>')}</div></section>`;
 }
 let active=null;
 function open(bridge){
  active?.dispose();
  const host=bridge.host,state={type:'all',department:'all',category:'all',list:'all',query:'',page:0,size:12,selected:new Set(),busy:false,destination:''};
  let rows=[],visible=[],dialog=null,disposed=false;
  const keyMap=()=>new Map(rows.map(r=>[r.key,r])),issues=r=>g.CARTELERIA_RULES.validate(r.sign),ready=r=>issues(r).length===0;
  function status(message,bad=false){const el=host.querySelector('[data-cyd55-status]');if(el){el.textContent=message;el.dataset.kind=bad?'error':'ok';}}
  function closePreview(){dialog?.remove();dialog=null;host.querySelector('[data-cyd55-preview]')?.focus();}
  function dispose(){disposed=true;closePreview();}
  const controller={dispose,get state(){return {...state,selected:new Set(state.selected)};}};active=controller;
  host.innerHTML=(bridge.header?bridge.header():'')+`<section class="screen cyd55-filter"><header class="cyd55-head"><div><h1>Filtro Categorías</h1><p data-cyd55-total></p></div><div class="cyd55-head-actions"><button class="btn ghost" type="button" data-cyd55-refresh>Actualizar</button><button class="btn back-home" type="button" data-cyd55-home>Volver al inicio</button></div></header><div data-cyd55-picker></div><div class="cyd55-filters"><label>Departamento<select data-cyd55-department aria-label="Departamento"></select></label><label>Categoría<select data-cyd55-category aria-label="Categoría"></select></label><label>Lista<select data-cyd55-list aria-label="Lista"></select></label><label class="cyd55-search">Buscar producto<input type="search" data-cyd55-search aria-label="Buscar producto" placeholder="Nombre, ítem o UPC" autocomplete="off"></label></div><div class="cyd55-results-head"><p data-cyd55-results role="status"></p><label>Productos por página<select data-cyd55-size aria-label="Productos por página"><option value="10">10</option><option value="12" selected>12</option><option value="15">15</option></select></label><button class="btn ghost" type="button" data-cyd55-clear>Limpiar filtros</button></div><div class="cyd55-table-wrap"><table class="cyd55-table"><caption class="cyd55-sr">Promociones de las listas vigentes</caption><thead><tr><th><input type="checkbox" data-cyd55-page-check aria-label="Seleccionar productos de esta página"></th><th>Producto</th><th>Departamento / Categoría</th><th>Lista</th><th>Precio vigente</th><th>Cartel</th></tr></thead><tbody data-cyd55-rows></tbody></table></div><nav class="cyd55-pagination" aria-label="Páginas de promociones"><button class="btn ghost" type="button" data-cyd55-prev>← Anterior</button><p data-cyd55-page-label></p><button class="btn ghost" type="button" data-cyd55-next>Siguiente →</button></nav><footer class="cyd55-selection"><div><strong data-cyd55-selection-count>0 seleccionados</strong><span data-cyd55-queue-count></span></div><div class="cyd55-selection-actions"><button class="btn ghost" type="button" data-cyd55-select-result>Seleccionar resultado</button><button class="btn ghost" type="button" data-cyd55-unselect>Quitar selección</button>${bridge.destinations?.length?'<label class="cyd55-destination">Enviar a local<select data-cyd55-destination aria-label="Local de destino"><option value="">Seleccionar local</option>'+bridge.destinations.map(l=>'<option value="'+esc(l.code)+'">'+esc(l.code)+' · '+esc(l.name)+'</option>').join('')+'</select></label>':''}<button class="btn primary" type="button" data-cyd55-enqueue>Enviar a cola</button>${bridge.onQueue?'<button class="btn ghost" type="button" data-cyd55-queue>Ver cola e imprimir</button>':''}</div></footer><p class="cyd55-status" data-cyd55-status role="status"></p></section>`;
  const panel=host.querySelector('.cyd55-filter');
  if(bridge.onChangeLocal)host.querySelector('#changeLocalTop')?.addEventListener('click',bridge.onChangeLocal);
  function options(selector,values,all,current){const el=panel.querySelector(selector);el.innerHTML='<option value="all">'+all+'</option>'+[...new Set(values)].sort((a,b)=>a.localeCompare(b,'es')).map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');el.value=current;}
  function selection(){
   panel.querySelector('[data-cyd55-selection-count]').textContent=number(state.selected.size)+' seleccionados';
   const queue=bridge.queueCount?.();panel.querySelector('[data-cyd55-queue-count]').innerHTML=queue===null||queue===undefined?'':'Cola actual: <strong data-queue-count>'+number(queue)+'</strong> carteles';
   for(const name of ['enqueue','unselect'])panel.querySelector('[data-cyd55-'+name+']').disabled=state.busy||!state.selected.size;
   const pageRows=visible.slice(state.page*state.size,(state.page+1)*state.size).filter(ready),chosen=pageRows.filter(r=>state.selected.has(r.key)).length,check=panel.querySelector('[data-cyd55-page-check]');check.checked=pageRows.length>0&&chosen===pageRows.length;check.indeterminate=chosen>0&&chosen<pageRows.length;check.disabled=state.busy||!pageRows.length;
   panel.querySelector('[data-cyd55-select-result]').disabled=state.busy||!visible.some(ready);
   panel.querySelector('[data-cyd55-select-result]').textContent='Seleccionar resultado ('+number(visible.length)+')';
  }
  function render(){
   if(disposed||!host.contains(panel))return;
   rows=records(bridge.catalog());const typed=rows.filter(r=>matches(r,state.type));
   if(state.department!=='all'&&!typed.some(r=>r.department===state.department))state.department='all';
   if(state.list!=='all'&&!typed.some(r=>r.list===state.list))state.list='all';
   const categories=typed.filter(r=>(state.department==='all'||r.department===state.department)&&(state.list==='all'||r.list===state.list));
   if(state.category!=='all'&&!categories.some(r=>r.category===state.category))state.category='all';
   options('[data-cyd55-department]',typed.map(r=>r.department),'Todos los departamentos',state.department);options('[data-cyd55-category]',categories.map(r=>r.category),'Todas las categorías',state.category);options('[data-cyd55-list]',typed.map(r=>r.list),'Todas las listas',state.list);
   panel.querySelector('[data-cyd55-picker]').innerHTML=picker(rows,state.type);
   panel.querySelector('[data-cyd55-total]').textContent=number(rows.length)+' promociones en las listas vigentes';
   visible=filter(rows,state);state.page=Math.min(state.page,Math.max(0,Math.ceil(visible.length/state.size)-1));
   const start=state.page*state.size,pageRows=visible.slice(start,start+state.size),pages=Math.max(1,Math.ceil(visible.length/state.size));
   panel.querySelector('[data-cyd55-results]').textContent=visible.length?'Mostrando '+number(start+1)+'–'+number(start+pageRows.length)+' de '+number(visible.length)+' promociones':'No hay productos con estos filtros';
   panel.querySelector('[data-cyd55-page-label]').textContent='Página '+number(state.page+1)+' de '+number(pages);
   panel.querySelector('[data-cyd55-prev]').disabled=state.page===0;panel.querySelector('[data-cyd55-next]').disabled=state.page+1>=pages;
   panel.querySelector('[data-cyd55-rows]').innerHTML=pageRows.map(r=>`<tr data-cyd55-row="${esc(r.key)}"><td class="cyd55-check-cell"><input type="checkbox" data-cyd55-select="${esc(r.key)}" aria-label="Seleccionar ${esc(r.name)}" ${state.selected.has(r.key)?'checked':''} ${ready(r)?'':'disabled'}></td><td class="cyd55-product"><strong>${esc(r.name||'Sin descripción')}</strong><span>${esc([r.brand,r.size].filter(Boolean).join(' · '))}</span><small>${r.item?'Ítem '+esc(r.item)+' · ':''}UPC ${esc(r.upc)}${r.item?'':' · Sin ítem'}</small></td><td class="cyd55-category"><strong>${esc(r.department)}</strong><span>${esc(r.category)}</span></td><td class="cyd55-list-cell"><span class="cyd55-color-tag ${r.type}">${r.type==='red'?'Cartel rojo':r.type==='yellow'?'Cartel amarillo':'Lista'}</span><small>${esc(r.list)}</small></td><td class="cyd55-price">${r.sign.qty>1?'<span>'+number(r.sign.qty)+' por</span>':''}<strong>${money(r.sign.offer)}</strong>${ready(r)?'':'<small>Revisar datos</small>'}</td><td class="cyd55-preview-cell"><button class="btn ghost" type="button" data-cyd55-preview="${esc(r.key)}" aria-label="Ver cartel de ${esc(r.name)}">Ver cartel</button></td></tr>`).join('')||'<tr><td colspan="6" class="cyd55-empty">Prueba con otra categoría o limpia los filtros.</td></tr>';
   selection();
  }
  function changeFilter(action){action();state.page=0;state.selected.clear();render();status('');}
  function preview(key){const r=keyMap().get(key);if(!r)return;closePreview();dialog=document.createElement('div');dialog.className='cyd55-preview';dialog.innerHTML='<section role="dialog" aria-modal="true" aria-label="Vista previa del cartel"><header><div><h2>'+esc(r.name)+'</h2><p>'+esc(r.list)+' · '+esc(r.item?'Ítem '+r.item:'UPC '+r.upc)+'</p></div><button class="btn ghost" type="button" data-cyd55-close-preview>Cerrar</button></header><div class="preview-card cyd55-preview-art">'+bridge.renderSign(r.sign)+'</div></section>';document.body.appendChild(dialog);dialog.querySelector('button').focus();dialog.querySelector('button').onclick=closePreview;dialog.addEventListener('keydown',e=>{if(e.key==='Escape')closePreview();if(e.key==='Tab'){e.preventDefault();dialog.querySelector('button').focus();}});}
  panel.addEventListener('input',e=>{if(e.target.matches('[data-cyd55-search]'))changeFilter(()=>{state.query=e.target.value;});});
  panel.addEventListener('change',e=>{
   const el=e.target;
   for(const name of ['department','category','list'])if(el.matches('[data-cyd55-'+name+']'))return changeFilter(()=>{state[name]=el.value;if(name!=='category')state.category='all';});
   if(el.matches('[data-cyd55-size]')){state.size=Number(el.value);state.page=0;render();}
   if(el.matches('[data-cyd55-destination]'))state.destination=el.value;
   if(el.matches('[data-cyd55-select]')){el.checked?state.selected.add(el.dataset.cyd55Select):state.selected.delete(el.dataset.cyd55Select);selection();}
   if(el.matches('[data-cyd55-page-check]')){for(const r of visible.slice(state.page*state.size,(state.page+1)*state.size).filter(ready))el.checked?state.selected.add(r.key):state.selected.delete(r.key);render();}
  });
  panel.addEventListener('click',async e=>{
   const button=e.target.closest('button');if(!button||button.disabled)return;
   if(button.hasAttribute('data-cyd55-type'))return changeFilter(()=>{state.type=button.dataset.cyd55Type;});
   if(button.hasAttribute('data-cyd55-home')){dispose();bridge.onHome();return;}
   if(button.hasAttribute('data-cyd55-queue')){dispose();bridge.onQueue();return;}
   if(button.hasAttribute('data-cyd55-preview'))return preview(button.dataset.cyd55Preview);
   if(button.hasAttribute('data-cyd55-prev')){state.page--;render();return;}
   if(button.hasAttribute('data-cyd55-next')){state.page++;render();return;}
   if(button.hasAttribute('data-cyd55-clear')){panel.querySelector('[data-cyd55-search]').value='';return changeFilter(()=>{Object.assign(state,{type:'all',department:'all',category:'all',list:'all',query:''});});}
   if(button.hasAttribute('data-cyd55-unselect')){state.selected.clear();render();return;}
   if(button.hasAttribute('data-cyd55-select-result')){visible.filter(ready).forEach(r=>state.selected.add(r.key));render();return;}
   if(!button.hasAttribute('data-cyd55-enqueue')&&!button.hasAttribute('data-cyd55-refresh'))return;
   if(button.hasAttribute('data-cyd55-enqueue')&&bridge.destinations?.length&&!state.destination)return status('Elige el local que recibirá los carteles.',true);
   const selectedKeys=[...state.selected],controls=[...panel.querySelectorAll('button,input,select')].map(el=>({el,disabled:el.disabled}));
   state.busy=true;controls.forEach(({el})=>{el.disabled=true;});status('Actualizando promociones…');
   try{
    await bridge.refresh();if(disposed)return;
    rows=records(bridge.catalog());
    if(button.hasAttribute('data-cyd55-enqueue')){
     const map=keyMap(),chosen=selectedKeys.map(key=>map.get(key));
     if(chosen.some(r=>!r||!ready(r)))throw new Error('Una promoción cambió o necesita revisión. Actualiza la selección.');
     const result=await bridge.enqueue(chosen,state.destination);if(disposed)return;
     state.selected.clear();status(result||number(chosen.length)+' carteles enviados a la cola.');
    }else{const keys=keyMap();for(const key of state.selected)if(!keys.has(key))state.selected.delete(key);status('Promociones actualizadas.');}
   }catch(error){status(error.message,true);}finally{state.busy=false;controls.forEach(({el,disabled})=>{el.disabled=disabled;});if(!disposed)render();}
  });
  render();return controller;
 }
 g.CYD55_CATEGORIES={classify,matches,records,filter,counts,picker,open};
})(window);
