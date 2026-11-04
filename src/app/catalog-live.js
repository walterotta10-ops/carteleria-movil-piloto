(async function(){
  const root=document.getElementById('app'),api=location.origin;
  window.CYD_API_BASE=api;
  try{
    const r=await fetch(api+'/api/catalogo',{cache:'no-store'}),data=await r.json();if(!r.ok||!data.ok||!Array.isArray(data.catalog))throw new Error(data.error||'La aplicación no pudo obtener el catálogo.');
    window.CARTELERIA_CATALOG=data.catalog;window.CARTELERIA_OCCAM_SBA=data.layout;window.CYD_CATALOG_REVISION=data.revision;
    await window.CYD54_ACCESS.loadScript('app.js');
  }catch(e){root.innerHTML='<section class="landing"><h1>Cartelería C&D</h1><p class="landing-copy"></p><button class="btn primary" id="retryCatalog">Reintentar</button></section>';root.querySelector('p').textContent='No se pudieron actualizar las promociones. '+e.message;root.querySelector('button').onclick=()=>location.reload();}
})();
