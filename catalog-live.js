(async function(){
  const root=document.getElementById('app'),api=location.origin;
  window.CYD_API_BASE=api;
  try{
    const fragment=new URLSearchParams(location.hash.slice(1)),activation=fragment.get('cyd_walter');
    if(activation){history.replaceState(null,'',location.pathname+location.search);const session=await fetch(api+'/api/master/session',{method:'POST',headers:{'Content-Type':'application/json','X-Carteleria-Access':'Walter','X-CYD-Desktop':'1','Authorization':'Bearer '+activation}});const result=await session.json();if(!session.ok||!result.ok)throw new Error(result.error||'No se pudo activar este PC.');localStorage.setItem('cyd.master.token',activation);sessionStorage.setItem('cyd.master','Walter');}
    const r=await fetch(api+'/api/catalogo',{cache:'no-store'}),data=await r.json();if(!r.ok||!data.ok||!Array.isArray(data.catalog))throw new Error(data.error||'El puente todavía no tiene la actualización V53.');
    window.CARTELERIA_CATALOG=data.catalog;window.CARTELERIA_OCCAM_SBA=data.layout;window.CYD_CATALOG_REVISION=data.revision;
    const script=document.createElement('script');script.src='app.js?v=v54';script.onerror=()=>{root.textContent='No se pudo abrir la aplicación. Recarga esta página.';};document.body.appendChild(script);
  }catch(e){root.innerHTML='<section class="landing"><h1>Cartelería C&D</h1><p class="landing-copy"></p><button class="btn primary" id="retryCatalog">Reintentar</button></section>';root.querySelector('p').textContent='No se pudieron actualizar las promociones. '+e.message;root.querySelector('button').onclick=()=>location.reload();}
})();
