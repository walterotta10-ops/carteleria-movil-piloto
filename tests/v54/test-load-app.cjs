// Carga HTML y todos los scripts reales en un DOM con recursos; usa solo una D1 y activación ficticias.
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM,ResourceLoader,VirtualConsole,CookieJar}=require('jsdom'),{webcrypto}=require('node:crypto'),{fixtureWorker,TEST_TOKEN}=require('./test-access.cjs'),{D1}=require('../test-d1.cjs');
const base='https://carteleria-puente-carta.walterotta10.workers.dev';
async function load(role,mode='restore'){
 const worker=await fixtureWorker(),env={DB:new D1()},jar=new CookieJar(),blobs=new Map(),requests=[],errors=[];
 if(role!=='master'&&mode==='restore'){
  const access=role==='market'?'814':'622',r=await worker.fetch(new Request(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({access,pin:access.padStart(4,'0')})}),env);
  assert.equal(r.status,200);for(const c of r.headers.getSetCookie())jar.setCookieSync(c,base);
 }
 async function network(input,init={},kind='fetch'){
  const original=input instanceof Request?new Request(input,init):new Request(new URL(input,base),init),headers=new Headers(original.headers),cookie=jar.getCookieStringSync(base);
  if(cookie)headers.set('Cookie',cookie);headers.set('User-Agent','Desktop load QA');
  const req=new Request(original,{headers}),r=await worker.fetch(req,env);for(const c of r.headers.getSetCookie())jar.setCookieSync(c,base);
  requests.push({path:new URL(req.url).pathname,kind,status:r.status,master:headers.get('X-Carteleria-Access')==='Walter',authorized:headers.has('Authorization')});return r;
 }
 class Loader extends ResourceLoader{fetch(url){return (async()=>{if(blobs.has(url))return Buffer.from(await blobs.get(url).arrayBuffer());const r=await network(url,{},'script-or-css');if(!r.ok)throw Error('HTTP '+r.status+' '+url);return Buffer.from(await r.arrayBuffer());})();}}
 const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='unhandled exception')errors.push(e.message);});
 let blobId=0;
 const dom=new JSDOM(require('../../cyd-v54-bundle.cjs').assets['/index.html'].body,{url:base+'/',runScripts:'dangerously',resources:new Loader(),cookieJar:jar,virtualConsole:vc,pretendToBeVisual:true,beforeParse(win){
  Object.assign(win,{fetch:(input,init)=>network(input,init),Request,Response,Headers,Blob,TextEncoder,TextDecoder,AbortController,queueMicrotask,confirm:()=>false,alert:msg=>errors.push('alert: '+msg),print:()=>{},scrollTo:()=>{},matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})});
  Object.defineProperty(win,'crypto',{value:webcrypto});
  win.URL.createObjectURL=blob=>{const url='blob:'+base+'/fixture-'+(++blobId);blobs.set(url,blob);return url;};win.URL.revokeObjectURL=url=>blobs.delete(url);
  if(role==='master'){win.localStorage.setItem('cyd.master.token',TEST_TOKEN);if(mode==='restore')win.sessionStorage.setItem('cyd.master','Walter');}
 }});
 const win=dom.window;
 async function until(predicate,label){const end=Date.now()+12000;while(Date.now()<end){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,15));}throw Error(label+' no apareció. Errores: '+JSON.stringify(errors)+'; peticiones: '+JSON.stringify(requests)+'; pantalla: '+win.document.getElementById('app').textContent.slice(0,450));}
 try{
  if(mode==='login'){
   await until(()=>win.document.getElementById('cyd54Login'),'Formulario de acceso');const access=role==='master'?'Walter':role==='market'?'814':'622',field=win.document.getElementById('cyd54Access');field.value=access;field.dispatchEvent(new win.Event('input',{bubbles:true}));if(role!=='master')win.document.getElementById('cyd54Pin').value=access.padStart(4,'0');win.document.getElementById('cyd54Login').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
  }
  await until(()=>role==='master'?win.document.querySelector('#cyd-walter-master .cd-side'):win.document.getElementById('modeItem'),'Inicio de '+role);
  await until(()=>win.document.querySelector('[data-cyd54-users]'),'Gestión de usuario');
  const expected=['queue-aliases.js','cartel-rules.js','queue-sync.js','usage.js','interactions.js','xlsx-reader.js','master.js','catalog-live.js','app.js'];
  for(const name of expected){const r=requests.find(r=>r.path==='/'+name&&r.kind==='fetch');assert.ok(r,name+' se carga mediante fetch');assert.equal(r.status,200,name);if(role==='master')assert.ok(r.authorized&&r.master,name+' lleva autorización maestra');}
  const manual=await win.fetch('/manual-items.json?v=v50');assert.equal(manual.status,200);assert.ok(Object.keys(await manual.json()).length>0);
  win.document.querySelector('[data-cyd54-users]').click();await until(()=>role==='store'?win.document.querySelector('[data-cyd54-own]'):win.document.querySelectorAll('[data-cyd54-pin]').length===(role==='master'?139:12),'Gestión por rol');
  assert.deepEqual(errors,[]);const failures=requests.filter(r=>r.status>=400&&r.path!=='/api/auth/session'&&!(role==='market'&&r.path==='/api/cola'&&r.status===403));assert.deepEqual(failures,[]);
  console.log(JSON.stringify({ok:true,role,mode,realScripts:expected.length,management:role==='master'?139:role==='market'?12:1,protectedRequests:requests.length}));
 }finally{win.close();}
}
(async()=>{for(const role of ['master','store','market'])await load(role,'login');await load('master','restore');})().catch(e=>{console.error(e);process.exitCode=1;});
