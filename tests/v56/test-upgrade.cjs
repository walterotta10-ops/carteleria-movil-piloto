const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cryptoNode=require('node:crypto'),{pathToFileURL}=require('node:url'),{D1}=require('../test-d1.cjs'),{fixtureWorker,TEST_TOKEN}=require('./test-access.cjs');
const oldBundle=require('../../cyd-v55-bundle.cjs');
async function legacyWorker(){const source=oldBundle.workerSource.replace(/const CYD53_AUTH_HASH="[a-f0-9]{64}";/,'const CYD53_AUTH_HASH="'+cryptoNode.createHash('sha256').update(TEST_TOKEN).digest('hex')+'";'),file=path.join(__dirname,'build/test-worker-v55.mjs');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,source);return (await import(pathToFileURL(file).href+'?test='+Date.now())).default;}
async function run(){
 const old=await legacyWorker(),fresh=await fixtureWorker(),env={DB:new D1()},base='https://carteleria-puente-carta.walterotta10.workers.dev',master={'X-Carteleria-Access':'Walter','X-CYD-Desktop':'1','User-Agent':'Desktop QA',Authorization:'Bearer '+TEST_TOKEN};
 const req=(route,options={})=>new Request(base+route,{...options,headers:{'Content-Type':'application/json',...options.headers}});
 const login=await old.fetch(req('/api/auth/login',{method:'POST',body:'{"access":"622","pin":"0622"}'}),env);assert.equal(login.status,200);const initial=await login.json();
 const changed=await old.fetch(req('/api/auth/password',{method:'POST',headers:{Cookie:login.headers.get('Set-Cookie').split(';')[0],'X-CYD-CSRF':initial.csrf},body:'{"currentPin":"0622","pin":"0486"}'}),env);assert.equal(changed.status,200);const cookie=changed.headers.get('Set-Cookie').split(';')[0],changedData=await changed.json();
 const cat=await (await old.fetch(req('/api/catalogo',{headers:{Cookie:cookie}}),env)).json(),p=cat.catalog.find(p=>p.code==='346590');
 const queued=await old.fetch(req('/api/cola?local=622',{method:'POST',headers:{Cookie:cookie,'X-CYD-CSRF':changedData.csrf},body:JSON.stringify({id:'upgrade-cyd',add:[{qid:'upgrade-copy',code:p.code,campaignId:p.campaignId,signId:p.signId}],remove:[]})}),env);assert.equal(queued.status,200);
 const session=await fresh.fetch(req('/api/auth/session',{headers:{Cookie:cookie}}),env);assert.equal(session.status,200);assert.equal((await session.json()).profile.code,'622');
 const accounts=await fresh.fetch(req('/api/auth/accounts',{headers:master}),env);assert.equal(accounts.status,200);assert.equal((await accounts.json()).accounts.find(a=>a.role==='store'&&a.code==='622').pin,'0486');
 const queue=await fresh.fetch(req('/api/cola?local=622',{headers:{Cookie:cookie}}),env);assert.equal(queue.status,200);assert.equal((await queue.json()).items[0].qid,'upgrade-copy');
 assert.equal((await fresh.fetch(req('/api/auth/login',{method:'POST',body:'{"access":"622","pin":"0486"}'}),env)).status,200);
 console.log('OK V55 → V56: conserva clave cambiada, sesión, cola e identificación de productos.');
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={legacyWorker};
