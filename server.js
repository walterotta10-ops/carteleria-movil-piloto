/* Cartelería V54: interfaz y acceso centralizado en el Worker/D1. Node >=20. */
const http=require('node:http');
const {assets}=require('./cyd-v54-bundle.cjs');
const publicFiles=new Set(['/index.html','/styles.css','/access-v54.js','/access-v54.css','/manifest.webmanifest']);
const jobs=new Set(['/trabajo','/tomar','/impreso','/fallo','/siguiente']);
function createApp({bridge='https://carteleria-puente-carta.walterotta10.workers.dev',fetchImpl=fetch,probeMs=10000}={}){
  let probe=null,state={checked:0,active:false};
  function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
  async function ready(){
    if(Date.now()-state.checked<probeMs)return state.active;
    if(!probe)probe=(async()=>{try{const r=await fetchImpl(bridge+'/health',{signal:AbortSignal.timeout(5000)}),d=await r.json();state={checked:Date.now(),active:!!(r.ok&&d.ok&&d.authentication&&/^v(\d+)/i.test(d.version)&&Number(d.version.match(/^v(\d+)/i)[1])>=54)};}catch{state={checked:Date.now(),active:false};}return state.active;})().finally(()=>{probe=null;});
    return probe;
  }
  return http.createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,'http://localhost'),key=url.pathname==='/'?'/index.html':url.pathname;
      res.setHeader('X-CYD-Version','v54');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Cache-Control','no-store');
      if((publicFiles.has(key)||key.startsWith('/assets/')&&assets[key]?.type?.startsWith('image/'))&&['GET','HEAD'].includes(req.method)){
        const asset=assets[key];if(!asset)return json(res,404,{ok:false,error:'Archivo no encontrado.'});
        let data=asset.binary?Buffer.from(asset.body,'base64'):Buffer.from(asset.body);
        if(asset.binary&&asset.type==='image/png'&&data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'&&data.toString('utf8').startsWith('iVBOR'))data=Buffer.from(data.toString('utf8'),'base64');
        res.setHeader('Content-Type',asset.type);res.statusCode=200;return res.end(req.method==='HEAD'?undefined:data);
      }
      if(url.pathname==='/health'||url.pathname==='/api/health'){const active=await ready();return json(res,active?200:503,{ok:active,version:'v54',authentication:true,workerReady:active,error:active?undefined:'Carga la actualización V54 en Cloudflare para habilitar los accesos con contraseña.'});}
      if(!url.pathname.startsWith('/api/')&&!jobs.has(url.pathname)&&!assets[key])return json(res,404,{ok:false,error:'Ruta no encontrada.'});
      if(!await ready())return json(res,503,{ok:false,error:'La actualización está lista. Primero carga el archivo V54 en Cloudflare y vuelve a ingresar.'});
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>3500000)return json(res,413,{ok:false,error:'Archivo demasiado grande.'});chunks.push(chunk);}
      const headers={};
      for(const name of ['content-type','authorization','cookie','origin','user-agent','x-carteleria-access','x-cyd-desktop','x-cyd-csrf'])if(req.headers[name])headers[name]=req.headers[name];
      const response=await fetchImpl(bridge+url.pathname+url.search,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks),signal:AbortSignal.timeout(30000),redirect:'manual'});
      for(const name of ['content-type','cache-control','x-cyd-version','x-content-type-options','referrer-policy','access-control-allow-origin','access-control-allow-credentials','access-control-allow-headers','access-control-allow-methods','vary','retry-after'])if(response.headers.has(name))res.setHeader(name,response.headers.get(name));
      const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);
      res.statusCode=response.status;res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
    }catch{if(!res.headersSent)return json(res,503,{ok:false,error:'No se pudo contactar el puente. Reintenta en unos segundos.'});res.end();}
  });
}
if(require.main===module)createApp().listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Cartelería V54: accesos protegidos y promociones en Cloudflare.'));
module.exports={createApp};
