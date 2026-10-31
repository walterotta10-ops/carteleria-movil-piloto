(function(g){
  'use strict';
  const root=document.getElementById('app'),nativeFetch=g.fetch.bind(g),BRIDGE='https://carteleria-puente-carta.walterotta10.workers.dev',RENDER='https://carteleria-movil-piloto.onrender.com';
  const jobs=new Set(['/trabajo','/tomar','/impreso','/fallo','/siguiente']);
  const privateFiles=new Set(['/queue-aliases.js','/cartel-rules.js','/queue-sync.js','/usage.js','/interactions.js','/xlsx-reader.js','/category-filters.js','/master.js','/catalog-live.js','/app.js','/catalog.js','/occam-layout.js','/manual-items.json']);
  let profile=null,csrf='',loaded=false,reloading=false,dialog=null,accounts=[];
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  g.CYD_API_BASE=location.origin;
  function masterHeaders(){return {'X-Carteleria-Access':'Walter','X-CYD-Desktop':'1','Authorization':'Bearer '+(localStorage.getItem('cyd.master.token')||'')};}
  function headers(extra={}){return {'Content-Type':'application/json',...(profile?.role==='master'?masterHeaders():{}),...(csrf?{'X-CYD-CSRF':csrf}:{}),...extra};}
  function expire(){if(reloading)return;reloading=true;sessionStorage.setItem('cyd54.login.message','La sesión terminó. Ingresa con tu contraseña para continuar.');location.replace(location.pathname+location.search);}
  g.fetch=async function(input,init){
    const url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url,location.href);
    if((url.origin===location.origin||url.origin===BRIDGE||url.origin===RENDER)&&(url.pathname.startsWith('/api/')||jobs.has(url.pathname)||privateFiles.has(url.pathname))){
      const target=location.origin+url.pathname+url.search;
      let request=input instanceof Request?new Request(target,input):new Request(target);
      if(init)request=new Request(request,init);
      const h=new Headers(request.headers);
      if(profile?.role==='master')for(const [key,value] of Object.entries(masterHeaders()))h.set(key,value);
      if(csrf&&!['GET','HEAD','OPTIONS'].includes(request.method))h.set('X-CYD-CSRF',csrf);
      request=new Request(request,{headers:h,credentials:'same-origin'});
      const response=await nativeFetch(request);
      if(response.status===401&&loaded&&!url.pathname.startsWith('/api/auth/'))expire();
      return response;
    }
    return nativeFetch(input,init);
  };
  async function api(path,method='GET',body,extra){
    const response=await nativeFetch(location.origin+path,{method,credentials:'same-origin',cache:'no-store',headers:headers(extra),body:body===undefined?undefined:JSON.stringify(body)});
    let data;try{data=await response.json();}catch{throw new Error('El puente no respondió correctamente. Reintenta.');}
    if(!response.ok||!data.ok){if(response.status===401&&loaded)expire();const error=Object.assign(new Error(data.error||'No se pudo completar la operación.'),{status:response.status});throw error;}
    return data;
  }
  function adopt(data){profile=data.profile;csrf=data.csrf||'';}
  function allowedLocal(local){return profile?.role==='master'||profile?.locals?.includes(String(local).replace(/^0+(?=\d)/,''));}
  function login(message=''){
    profile=null;csrf='';
    root.innerHTML=`<section class="landing cyd54-login"><img class="landing-logo" src="assets/acuenta-logo.png?v=v54" alt="Super Bodega aCuenta"><h1>Nuevo C&amp;D<br><span>Cartelería</span></h1><p class="landing-copy">Ingresa tu local o código de mercado y tu contraseña.</p><form class="local-card" id="cyd54Login"><label for="cyd54Access">Local o mercado</label><input id="cyd54Access" name="username" autocomplete="username" inputmode="numeric" placeholder="Local o código de mercado" maxlength="20" required autofocus><div id="cyd54PasswordFields"><label for="cyd54Pin">Contraseña</label><input id="cyd54Pin" name="password" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" minlength="4" autocomplete="current-password" placeholder="4 dígitos" required></div><p id="cyd54LoginMessage" class="cyd54-message" role="status">${esc(message)}</p><button class="btn primary" type="submit">Ingresar</button></form></section>`;
    const form=document.getElementById('cyd54Login'),access=document.getElementById('cyd54Access'),pin=document.getElementById('cyd54Pin'),status=document.getElementById('cyd54LoginMessage');
    access.addEventListener('input',()=>{const master=/^walter$/i.test(access.value.trim());document.getElementById('cyd54PasswordFields').hidden=master;pin.required=!master;pin.disabled=master;status.textContent='';});
    form.addEventListener('submit',async event=>{
      event.preventDefault();const button=form.querySelector('button');button.disabled=true;status.textContent='Comprobando acceso…';
      try{
        if(/^walter$/i.test(access.value.trim())){
          if(!localStorage.getItem('cyd.master.token'))throw new Error('Activa este PC con tu archivo privado de acceso maestro.');
          await api('/api/master/session','POST',{},masterHeaders());
          profile={role:'master',code:'Walter'};
          await api('/api/auth/logout','POST',{});
          adopt(await api('/api/auth/session','GET',undefined,masterHeaders()));
          sessionStorage.setItem('cyd.master','Walter');
        }else{
          adopt(await api('/api/auth/login','POST',{access:access.value.trim(),pin:pin.value}));
          sessionStorage.removeItem('cyd.master');
        }
        pin.value='';sessionStorage.removeItem('cyd54.forceLogin');await launch();
      }catch(error){status.textContent=error.message;button.disabled=false;pin.value='';if(!pin.disabled)pin.focus();}
    });
    access.focus();
  }
  async function script(name){
    if(!privateFiles.has('/'+name)||!name.endsWith('.js'))throw new Error('Archivo de aplicación no reconocido.');
    const path=location.origin+'/'+name+'?v=v55',response=await g.fetch(path,{cache:'no-store'});
    if(!response.ok)throw new Error('No se pudo cargar '+name+' (código '+response.status+'). Vuelve a ingresar.');
    const source=await response.text(),url=URL.createObjectURL(new Blob([source],{type:'application/javascript'}));
    return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=url;el.onload=()=>{URL.revokeObjectURL(url);resolve();};el.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo abrir '+name+'. Recarga la página.'));};document.body.appendChild(el);});
  }
  async function launch(){
    root.innerHTML='<section class="landing"><h1>Cartelería C&amp;D</h1><p class="landing-copy">Cargando tus promociones…</p></section>';
    if(profile.role==='master'){sessionStorage.setItem('cyd.master','Walter');localStorage.removeItem('carteleria.local');}
    else{sessionStorage.removeItem('cyd.master');localStorage.setItem('carteleria.local',profile.code);}
    loaded=true;
    try{for(const file of ['queue-aliases.js','cartel-rules.js','queue-sync.js','usage.js','interactions.js','xlsx-reader.js','category-filters.js','master.js','catalog-live.js'])await script(file);}
    catch(error){root.innerHTML='<section class="landing"><h1>Cartelería C&amp;D</h1><p class="landing-copy"></p><button class="btn primary" data-cyd54-retry>Reintentar</button><button class="btn ghost" data-cyd54-exit>Volver al acceso</button></section>';root.querySelector('p').textContent=error.message;root.querySelector('[data-cyd54-retry]').onclick=()=>location.reload();root.querySelector('[data-cyd54-exit]').onclick=logout;}
  }
  async function logout(){
    loaded=false;sessionStorage.setItem('cyd54.forceLogin','1');
    try{await api('/api/auth/logout','POST',{});}catch{}
    sessionStorage.removeItem('cyd.master');localStorage.removeItem('carteleria.local');location.replace(location.pathname+location.search);
  }
  function close(){if(dialog){dialog.remove();dialog=null;}document.querySelector('[data-cyd54-users]')?.focus();}
  function message(text,bad=false){if(!dialog)return;const el=dialog.querySelector('[data-cyd54-message]');el.textContent=text;el.dataset.kind=bad?'error':'ok';}
  function selfForm(){
    if(profile.role==='master')return '';
    const label=profile.role==='market'?'Mi contraseña de jefe de mercado':'Contraseña de mi local';
    return `<section class="cyd54-own"><h2>${label}</h2><form data-cyd54-own><label>Contraseña actual<input type="password" name="current" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="current-password" required></label><label>Nueva contraseña<input type="password" name="next" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="new-password" required></label><label>Repetir contraseña<input type="password" name="repeat" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="new-password" required></label><button class="btn primary" type="submit">Cambiar mi contraseña</button></form></section>`;
  }
  function filters(){return `<div class="cyd54-filters"><label>Buscar local o mercado<input data-cyd54-search type="search" placeholder="Código o nombre"></label>${profile.role==='master'?'<label>Tipo de acceso<select data-cyd54-kind><option value="all">Todos</option><option value="store">Locales</option><option value="market">Jefes de mercado</option></select></label><label>Mercado<select data-cyd54-market><option value="all">Todos</option>'+[...new Map(accounts.map(a=>[a.market,a.marketName])).entries()].sort((a,b)=>Number(a[0])-Number(b[0])).map(([code,name])=>'<option value="'+esc(code)+'">'+esc(code)+' · '+esc(name)+'</option>').join('')+'</select></label>':''}<button class="btn ghost" type="button" data-cyd54-refresh>Actualizar accesos</button></div><p class="cyd54-count" data-cyd54-count></p><div class="cyd54-table-wrap"><table class="cyd54-table"><thead><tr><th>Acceso</th><th>Mercado</th><th>Contraseña actual</th><th>Guardar cambio</th></tr></thead><tbody data-cyd54-rows></tbody></table></div>`;}
  function renderRows(){
    if(!dialog||profile.role==='store')return;
    const query=(dialog.querySelector('[data-cyd54-search]')?.value||'').toLocaleLowerCase('es'),kind=dialog.querySelector('[data-cyd54-kind]')?.value||'all',market=dialog.querySelector('[data-cyd54-market]')?.value||'all';
    const rows=accounts.filter(a=>a.canReset&&(kind==='all'||kind===a.role)&&(market==='all'||market===a.market)&&[a.code,a.name,a.market,a.marketName].join(' ').toLocaleLowerCase('es').includes(query));
    dialog.querySelector('[data-cyd54-count]').textContent=rows.length+' accesos';
    dialog.querySelector('[data-cyd54-rows]').innerHTML=rows.map(a=>`<tr><td><strong>${a.role==='market'?'Jefe de mercado':'Local'} ${esc(a.code)}</strong><span>${esc(a.name)}</span></td><td>${esc(a.market)} · ${esc(a.marketName)}</td><td><label class="cyd54-sr">Nueva clave de ${esc(a.code)}</label><input class="cyd54-visible-pin" data-cyd54-pin="${esc(a.role+':'+a.code)}" aria-label="Contraseña de ${esc(a.role==='market'?'mercado':'local')} ${esc(a.code)}" type="text" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="off" value="${esc(a.pin)}"><small>${a.updatedAt?'Actualizada por '+esc(a.updatedBy):'Clave inicial'}</small></td><td><button class="btn ghost" type="button" data-cyd54-save="${esc(a.role+':'+a.code)}">Guardar nueva clave</button></td></tr>`).join('')||'<tr><td colspan="4">No hay accesos con ese filtro.</td></tr>';
  }
  async function refresh(){const data=await api('/api/auth/accounts');accounts=data.accounts;}
  async function open(){
    if(!profile)return;
    close();const label=profile.role==='store'?'Mi contraseña':'Gestión de usuario';
    dialog=document.createElement('div');dialog.className='cyd54-dialog';dialog.innerHTML=`<section class="cyd54-panel" role="dialog" aria-modal="true" aria-labelledby="cyd54Title"><header><div><h1 id="cyd54Title">${label}</h1><p>${profile.role==='master'?'Usuario maestro · todos los locales y jefes de mercado':profile.role==='market'?'Jefe de mercado '+esc(profile.code)+' · '+esc(profile.name):'Local '+esc(profile.code)+' · '+esc(profile.name)}</p></div><button class="btn ghost" type="button" data-cyd54-close>Volver</button></header><p class="cyd54-message" data-cyd54-message role="status">Cargando accesos…</p><div data-cyd54-content></div></section>`;
    document.body.appendChild(dialog);dialog.querySelector('[data-cyd54-close]').focus();
    dialog.addEventListener('keydown',event=>{if(event.key==='Escape')close();if(event.key==='Tab'&&dialog){const controls=[...dialog.querySelectorAll('button,input,select')].filter(el=>!el.disabled&&!el.hidden);const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
    dialog.addEventListener('input',event=>{if(event.target.matches('[data-cyd54-search]'))renderRows();});
    dialog.addEventListener('change',event=>{if(event.target.matches('[data-cyd54-kind],[data-cyd54-market]'))renderRows();});
    dialog.addEventListener('click',async event=>{
      if(event.target.closest('[data-cyd54-close]'))return close();
      const refreshButton=event.target.closest('[data-cyd54-refresh]');if(refreshButton){refreshButton.disabled=true;try{await refresh();renderRows();message('Accesos actualizados.');}catch(error){message(error.message,true);}finally{refreshButton.disabled=false;}return;}
      const button=event.target.closest('[data-cyd54-save]');if(!button)return;
      const key=button.dataset.cyd54Save,a=accounts.find(a=>a.role+':'+a.code===key),input=dialog.querySelector('[data-cyd54-pin="'+key+'"]'),pin=input.value;
      if(!/^\d{4}$/.test(pin))return message('La contraseña debe contener exactamente 4 dígitos.',true);
      if(pin===a.pin)return message('Esa ya es la contraseña actual.');
      button.disabled=true;message('Guardando contraseña…');
      try{const data=await api('/api/auth/accounts/password','POST',{role:a.role,code:a.code,pin,revision:a.revision});await refresh();renderRows();message(data.message);}catch(error){message(error.message,true);button.disabled=false;}
    });
    dialog.addEventListener('submit',async event=>{
      const form=event.target.closest('[data-cyd54-own]');if(!form)return;event.preventDefault();const values=new FormData(form),pin=String(values.get('next')||'');
      if(!/^\d{4}$/.test(pin)||pin!==values.get('repeat'))return message('Repite la misma contraseña nueva de 4 dígitos.',true);
      const button=form.querySelector('button');button.disabled=true;message('Cambiando contraseña…');
      try{const data=await api('/api/auth/password','POST',{currentPin:String(values.get('current')||''),pin});adopt(data);form.reset();await refresh();renderRows();message('Contraseña actualizada. Usa la nueva clave en tus otros equipos.');}catch(error){message(error.message,true);}finally{button.disabled=false;}
    });
    try{await refresh();if(!dialog)return;dialog.querySelector('[data-cyd54-content]').innerHTML=selfForm()+(profile.role==='store'?'':filters());renderRows();message(profile.role==='store'?'Ingresa tu clave actual y elige una nueva de 4 dígitos.':'Las claves tienen 4 dígitos. Edita la clave del acceso y guarda el cambio.');}catch(error){message(error.message,true);}
  }
  function navigation(){
    if(!profile)return;
    const grid=root.querySelector('.mode-grid');
    if(grid&&!grid.querySelector('[data-cyd54-users]')){const button=document.createElement('button');button.type='button';button.className='mode-tile';button.dataset.cyd54Users='1';button.innerHTML='<span class="mode-emoji" aria-hidden="true">⚿</span><strong>'+(profile.role==='store'?'Mi contraseña':'Gestión de usuario')+'</strong><small>'+(profile.role==='store'?'Cambiar la contraseña de este local':'Ver y cambiar claves de los locales asignados')+'</small>';grid.appendChild(button);}
    const side=root.querySelector('#cyd-walter-master .cd-side');
    if(side&&!side.querySelector('[data-cyd54-users]')){const button=document.createElement('button');button.type='button';button.className='cd-nav';button.dataset.cyd54Users='1';button.textContent='Gestión de usuario';side.insertBefore(button,side.querySelector('.cd-side-footer'));}
  }
  document.addEventListener('click',event=>{if(event.target.closest('[data-cyd54-users]')){event.preventDefault();event.stopPropagation();open();}},true);
  new MutationObserver(navigation).observe(root,{subtree:true,childList:true});
  g.CYD54_ACCESS={open,logout,allowedLocal,loadScript:script,get profile(){return profile;}};
  (async function boot(){
    try{
      const fragment=new URLSearchParams(location.hash.slice(1)),activation=fragment.get('cyd_walter');
      if(activation){history.replaceState(null,'',location.pathname+location.search);await api('/api/master/session','POST',{}, {'X-Carteleria-Access':'Walter','X-CYD-Desktop':'1','Authorization':'Bearer '+activation});localStorage.setItem('cyd.master.token',activation);sessionStorage.setItem('cyd.master','Walter');sessionStorage.removeItem('cyd54.forceLogin');}
      if(sessionStorage.getItem('cyd54.forceLogin')==='1')return login();
      const master=sessionStorage.getItem('cyd.master')==='Walter'&&localStorage.getItem('cyd.master.token');
      adopt(await api('/api/auth/session','GET',undefined,master?masterHeaders():undefined));
      await launch();
    }catch(error){const msg=sessionStorage.getItem('cyd54.login.message')||((error.status&&error.status===401)?'':error.message);sessionStorage.removeItem('cyd54.login.message');sessionStorage.removeItem('cyd.master');login(msg);}
  })();
})(window);
