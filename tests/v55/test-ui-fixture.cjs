const assert=require('node:assert/strict'),{JSDOM,ResourceLoader,VirtualConsole,CookieJar}=require('jsdom'),{webcrypto}=require('node:crypto'),{fixtureWorker,TEST_TOKEN}=require('./test-access.cjs'),{D1}=require('../test-d1.cjs');
const bundle=require('../../cyd-v55-bundle.cjs'),base='https://carteleria-puente-carta.walterotta10.workers.dev';
async function openApp(role,{restore=false,mobile=false}={}){
 const worker=await fixtureWorker(),env={DB:new D1()},jar=new CookieJar(),blobs=new Map(),requests=[],errors=[],popups=[];let activeRequests=0,lastRequest=Date.now();
 async function network(input,init={},kind='fetch'){
  activeRequests++;const original=input instanceof Request?new Request(input,init):new Request(new URL(input,base),init),headers=new Headers(original.headers),cookie=jar.getCookieStringSync(base);if(cookie)headers.set('Cookie',cookie);headers.set('User-Agent',mobile?'Android Mobile QA':'Desktop QA');
  const req=new Request(original,{headers}),operation=new URL(req.url).pathname==='/api/cola'&&req.method==='POST'?await req.clone().json():null,r=await worker.fetch(req,env);for(const c of r.headers.getSetCookie())jar.setCookieSync(c,base);
  const trace={path:new URL(req.url).pathname,query:new URL(req.url).search,method:req.method,kind,status:r.status,master:headers.get('X-Carteleria-Access')==='Walter',authorized:headers.has('Authorization')};
  if(operation)trace.operation=operation;requests.push(trace);activeRequests--;lastRequest=Date.now();return r;
 }
 if(restore&&role!=='master'){const code=role==='market'?'814':'622';const r=await network('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({access:code,pin:code.padStart(4,'0')})});assert.equal(r.status,200);}
 class Loader extends ResourceLoader{fetch(url){return (async()=>{if(blobs.has(url))return Buffer.from(await blobs.get(url).arrayBuffer());const r=await network(url,{},'script-or-css');if(!r.ok)throw Error('HTTP '+r.status+' '+url);return Buffer.from(await r.arrayBuffer());})();}}
 const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message);});let blobId=0;
 const dom=new JSDOM(bundle.assets['/index.html'].body,{url:base+'/',runScripts:'dangerously',resources:new Loader(),cookieJar:jar,virtualConsole:vc,pretendToBeVisual:true,beforeParse(win){
  Object.assign(win,{fetch:(input,init)=>network(input,init),Request,Response,Headers,Blob,TextEncoder,TextDecoder,AbortController,queueMicrotask,confirm:()=>false,alert:msg=>errors.push('alert: '+msg),print:()=>{},scrollTo:()=>{},matchMedia:()=>({matches:mobile,addEventListener(){},removeEventListener(){}})});
  Object.defineProperty(win,'crypto',{value:webcrypto});
  win.URL.createObjectURL=blob=>{const url='blob:'+base+'/fixture-'+(++blobId);blobs.set(url,blob);return url;};win.URL.revokeObjectURL=url=>blobs.delete(url);
  win.open=()=>{const popup={html:'',closed:false,document:{open(){popup.html='';},write(html){popup.html+=html;},close(){popup.ready=true;}},close(){popup.closed=true;}};popups.push(popup);return popup;};
  if(role==='master'){win.localStorage.setItem('cyd.master.token',TEST_TOKEN);if(restore)win.sessionStorage.setItem('cyd.master','Walter');}
 }});
 const win=dom.window,doc=win.document;
 async function until(predicate,label){const end=Date.now()+12000;while(Date.now()<end){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,10));}throw Error(label+' no apareció. Errores: '+JSON.stringify(errors)+'; pantalla: '+doc.getElementById('app').textContent.slice(0,550));}
 async function select(selector,value){const el=doc.querySelector(selector);assert.ok(el,selector);el.value=value;el.dispatchEvent(new win.Event('change',{bubbles:true}));await Promise.resolve();}
 async function search(value){const input=doc.querySelector('[data-cyd55-search]');input.value=value;input.dispatchEvent(new win.Event('input',{bubbles:true}));await Promise.resolve();}
 try{
  if(!restore){await until(()=>doc.getElementById('cyd54Login'),'Acceso');const access=role==='master'?'Walter':role==='market'?'814':'622',field=doc.getElementById('cyd54Access');field.value=access;field.dispatchEvent(new win.Event('input',{bubbles:true}));if(role!=='master')doc.getElementById('cyd54Pin').value=access.padStart(4,'0');doc.getElementById('cyd54Login').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));}
  await until(()=>role==='master'?doc.querySelector('#cyd-walter-master .cd-side'):doc.getElementById('modeItem'),'Inicio de '+role);
  await until(()=>doc.querySelector('[data-cyd54-users]'),'Gestión de usuario');
  const expected=['queue-aliases.js','cartel-rules.js','queue-sync.js','usage.js','interactions.js','xlsx-reader.js','category-filters.js','master.js','catalog-live.js','app.js'];
  for(const name of expected){const r=requests.find(r=>r.path==='/'+name&&r.kind==='fetch');assert.ok(r,name+' se carga mediante fetch');assert.equal(r.status,200);if(role==='master')assert.ok(r.authorized&&r.master);}
  return {win,doc,worker,env,network,requests,errors,popups,until,select,search,async close(){const end=Date.now()+2000;while((activeRequests||Date.now()-lastRequest<35)&&Date.now()<end)await new Promise(resolve=>setTimeout(resolve,10));win.close();}};
 }catch(error){win.close();throw error;}
}
module.exports={openApp};
