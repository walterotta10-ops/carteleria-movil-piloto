/* Cartelería V56: interfaz y acceso centralizado en el Worker/D1. Node >=20. */
const http=require('node:http');
const {assets:currentAssets}=require('./cyd-v56-bundle.cjs'),{assets:legacyAssets}=require('./cyd-v55-bundle.cjs');
const publicFiles=new Set(['/index.html','/styles.css','/access-v54.js','/access-v54.css','/category-filters.css','/products.css','/manifest.webmanifest']);
const jobs=new Set(['/trabajo','/tomar','/impreso','/fallo','/siguiente']);
function createApp({bridge='https://carteleria-puente-carta.walterotta10.workers.dev',fetchImpl=fetch,probeMs=10000}={}){
  let probe=null,state={checked:0,active:false,manualProducts:false};
  function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
  async function ready(){
    if(Date.now()-state.checked<probeMs)return state.active;
    if(!probe)probe=(async()=>{try{const r=await fetchImpl(bridge+'/health',{signal:AbortSignal.timeout(5000)}),d=await r.json();state={checked:Date.now(),manualProducts:!!(d.manualProducts&&Number((d.version||'').match(/^v(\d+)/i)?.[1]||0)>=56),active:!!(r.ok&&d.ok&&d.authentication&&/^v(\d+)/i.test(d.version)&&Number(d.version.match(/^v(\d+)/i)[1])>=54)};}catch{state={checked:Date.now(),active:false,manualProducts:false};}return state.active;})().finally(()=>{probe=null;});
    return probe;
  }
  return http.createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,'http://localhost'),key=url.pathname==='/'?'/index.html':url.pathname;
      await ready();const requested=url.searchParams.get('v'),assets=requested==='v55'?legacyAssets:requested==='v56'?currentAssets:state.manualProducts?currentAssets:legacyAssets;
      res.setHeader('X-CYD-Version',assets===currentAssets?'v56':'v55');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Cache-Control','no-store');
      if((publicFiles.has(key)||key.startsWith('/assets/')&&assets[key]?.type?.startsWith('image/'))&&['GET','HEAD'].includes(req.method)){
        const asset=assets[key];if(!asset)return json(res,404,{ok:false,error:'Archivo no encontrado.'});
        let data=asset.binary?Buffer.from(asset.body,'base64'):Buffer.from(asset.body);
        if(asset.binary&&asset.type==='image/png'&&data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'&&data.toString('utf8').startsWith('iVBOR'))data=Buffer.from(data.toString('utf8'),'base64');
        res.setHeader('Content-Type',asset.type);res.statusCode=200;return res.end(req.method==='HEAD'?undefined:data);
      }
      if(url.pathname==='/health'||url.pathname==='/api/health'){const active=await ready();return json(res,active?200:503,{ok:active,version:'v56',authentication:true,workerReady:active,manualProducts:state.manualProducts,compatibleInterface:state.manualProducts?'v56':'v55',error:active?undefined:'Carga la actualización V56 en Cloudflare para habilitar los accesos con contraseña.'});}
      if(!url.pathname.startsWith('/api/')&&!jobs.has(url.pathname)&&!assets[key])return json(res,404,{ok:false,error:'Ruta no encontrada.'});
      if(url.pathname.startsWith('/api/manual/')||url.pathname.startsWith('/api/master/manual/')){if(!state.manualProducts)return json(res,503,{ok:false,error:'Carga el archivo V56 en Cloudflare para habilitar la maestra colaborativa.'});}
      if(!await ready())return json(res,503,{ok:false,error:'La actualización está lista. Primero carga el archivo V56 en Cloudflare y vuelve a ingresar.'});
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>3500000)return json(res,413,{ok:false,error:'Archivo demasiado grande.'});chunks.push(chunk);}
      const headers={};
      for(const name of ['content-type','authorization','cookie','origin','user-agent','x-carteleria-access','x-cyd-desktop','x-cyd-csrf'])if(req.headers[name])headers[name]=req.headers[name];
      if(assets[key]&&['GET','HEAD'].includes(req.method)){
        const auth=await fetchImpl(bridge+'/api/auth/session',{method:'GET',headers,signal:AbortSignal.timeout(15000),redirect:'manual'});
        let session;try{session=await auth.json();}catch{return json(res,503,{ok:false,error:'No se pudo verificar el acceso. Reintenta.'});}
        if(!auth.ok||!session.ok||!['store','market','master'].includes(session.profile?.role))return json(res,auth.ok?401:auth.status,{ok:false,error:session.error||'Ingresa con tu local y contraseña.'});
        const asset=assets[key],data=asset.binary?Buffer.from(asset.body,'base64'):Buffer.from(asset.body);res.setHeader('Content-Type',asset.type);res.statusCode=200;return res.end(req.method==='HEAD'?undefined:data);
      }
      const response=await fetchImpl(bridge+url.pathname+url.search,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks),signal:AbortSignal.timeout(30000),redirect:'manual'});
      for(const name of ['content-type','cache-control','x-cyd-version','x-content-type-options','referrer-policy','access-control-allow-origin','access-control-allow-credentials','access-control-allow-headers','access-control-allow-methods','vary','retry-after'])if(response.headers.has(name))res.setHeader(name,response.headers.get(name));
      const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);
      res.statusCode=response.status;res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
    }catch{if(!res.headersSent)return json(res,503,{ok:false,error:'No se pudo contactar el puente. Reintenta en unos segundos.'});res.end();}
  });
}
if(require.main===module)createApp().listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Cartelería V56: accesos protegidos y promociones en Cloudflare.'));
module.exports={createApp};
