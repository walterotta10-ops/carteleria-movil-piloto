const assert=require('node:assert/strict'),{createApp}=require('../../server.js'),{fixtureWorker}=require('./test-access.cjs'),{D1}=require('../test-d1.cjs');
async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port;}
async function run(){
 const worker=await fixtureWorker(),env={DB:new D1()};let forwarded=0;
 const server=createApp({probeMs:0,fetchImpl:async(url,init)=>{forwarded++;return worker.fetch(new Request(url,init),env);}}),base=await listen(server);
 try{
  assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/assets/acuenta-logo.png')).headers.get('Content-Type'),'image/png');
  assert.equal((await fetch(base+'/health')).status,200);assert.equal((await fetch(base+'/api/catalogo')).status,401);assert.equal((await fetch(base+'/app.js')).status,401);
  const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://carteleria-movil-piloto.onrender.com'},body:JSON.stringify({access:'622',pin:'0622'})}),data=await r.json();assert.equal(r.status,200,JSON.stringify(data));
  const cookie=r.headers.get('Set-Cookie');assert.match(cookie,/HttpOnly; Secure; SameSite=Lax/);
  const headers={Cookie:cookie.split(';')[0],'Content-Type':'application/json','X-CYD-CSRF':data.csrf,Origin:'https://carteleria-movil-piloto.onrender.com'};
  const sess=await fetch(base+'/api/auth/session',{headers});assert.equal(sess.status,200);assert.equal((await sess.json()).profile.code,'622');
  assert.equal((await fetch(base+'/api/cola?local=622',{headers})).status,200);assert.equal((await fetch(base+'/api/cola?local=541',{headers})).status,403);
  assert.equal((await fetch(base+'/app.js',{headers})).status,200);assert.equal((await fetch(base+'/api/no-existe',{headers})).status,404);
  const changed=await fetch(base+'/api/auth/password',{method:'POST',headers,body:JSON.stringify({currentPin:'0622',pin:'0099'})});assert.equal(changed.status,200);assert.notEqual(changed.headers.get('Set-Cookie'),cookie);
  assert.equal((await fetch(base+'/api/auth/session',{headers})).status,401);
  const direct=await worker.fetch(new Request('https://carteleria-puente-carta.walterotta10.workers.dev/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"access":"622","pin":"0099"}'}),env);assert.equal(direct.status,200);
  assert.equal((await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://externo.example'},body:'{"access":"622","pin":"0099"}'})).status,403);
  assert.ok(forwarded>10);
 }finally{await new Promise(resolve=>server.close(resolve));}
 let forbiddenForward=0;const old=createApp({probeMs:0,fetchImpl:async(url)=>{if(!url.endsWith('/health'))forbiddenForward++;return Response.json({ok:true,version:'v53'});}}),oldBase=await listen(old);
 try{assert.equal((await fetch(oldBase+'/')).status,200);for(const p of ['/health','/api/catalogo','/app.js'])assert.equal((await fetch(oldBase+p)).status,503);assert.equal((await fetch(oldBase+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,503);assert.equal(forbiddenForward,0);}finally{await new Promise(resolve=>old.close(resolve));}
 console.log('OK Render V54: sesión, cookies, CSRF y permisos compartidos con Cloudflare; espera segura si el Worker todavía está en V53.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
