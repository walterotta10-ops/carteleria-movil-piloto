const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cryptoNode=require('node:crypto'),{pathToFileURL}=require('node:url'),{D1}=require('../test-d1.cjs');
const TEST_TOKEN='test-only-'.padEnd(43,'x');
async function fixtureWorker(){
  const source=require('../../cyd-v54-bundle.cjs').workerSource.replace(/const CYD53_AUTH_HASH="[a-f0-9]{64}";/,'const CYD53_AUTH_HASH="'+cryptoNode.createHash('sha256').update(TEST_TOKEN).digest('hex')+'";');
  const file=path.join(__dirname,'build/test-worker.mjs');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,source);
  return (await import(pathToFileURL(file).href+'?test='+Date.now())).default;
}
async function run(){
  const worker=await fixtureWorker(),env={DB:new D1()},base='https://carteleria-puente-carta.walterotta10.workers.dev';let checks=0;
  const master={'X-Carteleria-Access':'Walter','X-CYD-Desktop':'1',Authorization:'Bearer '+TEST_TOKEN,'User-Agent':'Desktop QA'};
  async function call(route,{method='GET',body,session,headers={}}={}){const h={'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-CYD-CSRF':session.csrf}:{}),...headers};return worker.fetch(new Request(base+route,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)}),env);}
  async function expect(route,status,options){const r=await call(route,options);assert.equal(r.status,status,route+': '+await r.clone().text());checks++;return r;}
  async function login(access,pin){const r=await expect('/api/auth/login',200,{method:'POST',body:{access,pin}}),data=await r.json(),cookie=r.headers.get('Set-Cookie');assert.match(cookie,/HttpOnly; Secure; SameSite=Lax/);assert.match(cookie,/^__Host-cyd54=/);return {...data,cookie:cookie.split(';')[0]};}
  async function accounts(session,headers){return (await (await expect('/api/auth/accounts',200,{session,headers})).json()).accounts;}
  assert.equal((await expect('/health',200)).headers.get('X-CYD-Version'),'v54');
  const index=await (await expect('/',200)).text();assert.match(index,/access-v54\.js/);assert.doesNotMatch(index,/Walter/);
  const logo=Buffer.from(await (await expect('/assets/acuenta-logo.png',200)).arrayBuffer());assert.equal(logo.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  await expect('/favicon.ico',404);await expect('/assets/no-existe.png',401);
  for(const route of ['/api/catalogo','/api/cola?local=622','/api/estadisticas','/api/auth/accounts','/app.js','/catalog.js','/manual-items.json'])await expect(route,401);
  await expect('/api/cola?local=622',401,{headers:{'X-Carteleria-Access':'814'}});
  await expect('/api/auth/login',400,{method:'POST',body:{access:'622',pin:'622'}});
  await expect('/api/auth/login',401,{method:'POST',body:{access:'622',pin:'0000'}});
  await expect('/api/auth/login',401,{method:'POST',body:{access:'514',pin:'0514'}});
  await expect('/api/auth/login',403,{method:'POST',body:{access:'622',pin:'0622'},headers:{Origin:'https://externo.example'}});
  let store=await login('0622','0622'),otherSession=await login('622','0622');
  assert.equal(store.profile.code,'622');assert.equal(store.profile.role,'store');assert.equal((await accounts(store))[0].pin,null);
  const cat=await (await expect('/api/catalogo',200,{session:store})).json();assert.equal(cat.catalog.length,2136);assert.equal(cat.layout.length,1775);
  const missing=cat.catalog.find(p=>p.importVersion===53&&!p.code),verified=cat.catalog.find(p=>p.sourceProductNbr==='355301');assert.ok(missing);assert.equal(verified.code,'346590');
  await expect('/api/cola?local=622',403,{method:'POST',body:{id:'csrf-missing',add:[]},session:store,headers:{'X-CYD-CSRF':''}});
  await expect('/api/cola?local=541',403,{session:store});await expect('/api/estadisticas',403,{session:store});
  await expect('/api/master/stats',403,{session:store});
  await expect('/api/auth/accounts/password',403,{session:store,method:'POST',body:{role:'store',code:'541',pin:'1234',revision:0}});
  const queue=await (await expect('/api/cola?local=622',200,{session:store,method:'POST',body:{id:'v54-missing-item',add:[{qid:'without-item',code:'',signId:missing.signId,campaignId:missing.campaignId}],remove:[]}})).json();assert.equal(queue.items[0].code,'');
  await expect('/api/uso',403,{session:store,method:'POST',body:{id:'scope',local:'541',kind:'visit'}});
  await expect('/api/uso',200,{session:store,method:'POST',body:{id:'use-v54',local:'622',kind:'visit',channel:'app',signs:0,occurredAt:'2026-10-30T12:00:00Z'}});
  await expect('/api/interacciones',200,{session:store,method:'POST',body:{id:'inter-v54',local:'622',kind:'search',detail:'Prueba de acceso',occurredAt:'2026-10-30T12:01:00Z'}});
  const manager=await login('814','0814'),localAccounts=await accounts(manager);assert.equal(localAccounts.filter(a=>a.role==='store').length,12);assert.ok(localAccounts.filter(a=>a.role==='store').every(a=>a.market==='814'&&/^\d{4}$/.test(a.pin)));assert.equal(localAccounts.find(a=>a.role==='market').pin,null);
  const stats=await (await expect('/api/estadisticas?from=2026-10-30&to=2026-10-30',200,{session:manager,headers:{'X-Carteleria-Access':'867'}})).json();assert.equal(stats.locals.length,12);assert.ok(stats.locals.includes('622'));
  const all=await accounts(undefined,master);assert.equal(all.filter(a=>a.role==='store').length,128);assert.equal(all.filter(a=>a.role==='market').length,11);assert.equal(new Set(all.map(a=>a.code)).size,139);assert.ok(all.every(a=>a.pin===a.code.padStart(4,'0')));
  const out=all.find(a=>a.role==='store'&&a.market!=='814');
  await expect('/api/auth/accounts/password',403,{session:manager,method:'POST',body:{role:'store',code:out.code,pin:'1234',revision:out.revision}});
  await expect('/api/cola?local='+out.code,403,{session:manager});
  await expect('/api/auth/accounts/password',403,{session:manager,method:'POST',body:{role:'market',code:'814',pin:'1234',revision:1}});
  await expect('/api/auth/logout',401,{method:'POST',body:{},session:store,headers:{'X-CYD-CSRF':'','X-Carteleria-Access':'Walter','X-CYD-Desktop':'1'}});
  await expect('/api/auth/session',200,{session:store});
  await expect('/api/master/session',403,{method:'POST',body:{},headers:{...master,'User-Agent':'iPhone Mobile'}});
  await expect('/api/auth/accounts',401,{headers:{...master,Authorization:'Bearer '+'x'.repeat(43)}});
  const r622=localAccounts.find(a=>a.code==='622');
  await expect('/api/auth/accounts/password',200,{session:manager,method:'POST',body:{role:'store',code:'622',pin:'0427',revision:r622.revision}});
  await expect('/api/auth/session',401,{session:store});await expect('/api/auth/session',401,{session:otherSession});
  await expect('/api/auth/login',401,{method:'POST',body:{access:'622',pin:'0622'}});
  store=await login('622','0427');
  await expect('/api/auth/accounts/password',409,{session:manager,method:'POST',body:{role:'store',code:'622',pin:'5555',revision:r622.revision}});
  await expect('/api/auth/password',400,{session:store,method:'POST',body:{currentPin:'0427',pin:'123'}});
  await expect('/api/auth/password',400,{session:store,method:'POST',body:{currentPin:'0000',pin:'1234'}});await expect('/api/auth/session',200,{session:store});
  const changed=await expect('/api/auth/password',200,{session:store,method:'POST',body:{currentPin:'0427',pin:'0012'}}),changedData=await changed.json(),old=store;
  store={...changedData,cookie:changed.headers.get('Set-Cookie').split(';')[0]};assert.notEqual(store.cookie,old.cookie);await expect('/api/auth/session',401,{session:old});
  assert.equal((await accounts(manager)).find(a=>a.code==='622').pin,'0012');assert.equal((await accounts(undefined,master)).find(a=>a.role==='store'&&a.code==='622').pin,'0012');
  const marketAccount=(await accounts(undefined,master)).find(a=>a.role==='market'&&a.code==='814');
  await expect('/api/auth/accounts/password',200,{headers:master,method:'POST',body:{role:'market',code:'814',pin:'0044',revision:marketAccount.revision}});await expect('/api/auth/session',401,{session:manager});
  await expect('/api/auth/login',401,{method:'POST',body:{access:'814',pin:'0814'}});const newManager=await login('814','0044');
  await expect('/api/auth/password',200,{session:newManager,method:'POST',body:{currentPin:'0044',pin:'0045'}});assert.equal((await accounts(undefined,master)).find(a=>a.role==='market'&&a.code==='814').pin,'0045');
  const stored=env.DB.db.prepare("SELECT * FROM carteleria_access54 WHERE account_key='store:622'").get();assert.notEqual(stored.pin_hash,'0012');assert.notEqual(stored.pin_encrypted,'0012');assert.ok(!JSON.stringify(stored).includes('0012'));
  const secret=env.DB.db.prepare("SELECT value FROM carteleria_config WHERE key='access54_key'").get().value;assert.ok(!JSON.stringify(await (await call('/api/auth/accounts',{headers:master})).json()).includes(secret));
  for(let i=0;i<5;i++)await expect('/api/auth/login',401,{method:'POST',body:{access:'7',pin:'9999'}});
  await expect('/api/auth/login',429,{method:'POST',body:{access:'7',pin:'0007'}});
  const r7=(await accounts(undefined,master)).find(a=>a.role==='store'&&a.code==='7');await expect('/api/auth/accounts/password',200,{headers:master,method:'POST',body:{role:'store',code:'7',pin:'0008',revision:r7.revision}});await login('7','0008');
  const job=await (await expect('/trabajo',200,{session:store,method:'POST',body:{local:'622',printer_ip:'192.0.2.10',contenido:'{"kind":"carta_html","version":"v23","html":"fixture"}'}})).json();assert.ok(job.id);
  await expect('/tomar?local=622',403,{session:store,method:'POST',body:{},headers:{'X-CYD-CSRF':''}});
  const foreign=await login(out.code,out.pin);await expect('/impreso',403,{session:foreign,method:'POST',body:{id:job.id}});await expect('/tomar?local=622',403,{session:foreign,method:'POST',body:{}});
  assert.equal((await (await expect('/tomar?local=622',200,{session:store,method:'POST',body:{}})).json()).trabajo.id,job.id);await expect('/impreso',200,{session:store,method:'POST',body:{id:job.id}});
  const persistedWorker=await fixtureWorker(),persisted=await persistedWorker.fetch(new Request(base+'/api/auth/session',{headers:{Cookie:store.cookie}}),env);assert.equal(persisted.status,200);
  const persistedAccounts=await persistedWorker.fetch(new Request(base+'/api/auth/accounts',{headers:master}),env);assert.equal(persistedAccounts.status,200);assert.equal((await persistedAccounts.json()).accounts.find(a=>a.role==='store'&&a.code==='622').pin,'0012');assert.equal(env.DB.db.prepare("SELECT value FROM carteleria_config WHERE key='access54_key'").get().value,secret);
  env.DB.db.prepare("UPDATE carteleria_sessions54 SET last_seen=? WHERE account_key='store:622'").run(Date.now()-2*3600000-1);await expect('/api/auth/session',401,{session:store});
  const tiny=all.find(a=>a.role==='store'&&a.code==='5');await login(tiny.code,'0005');
  const logout=await login('622','0012');await expect('/api/auth/logout',403,{method:'POST',body:{},session:logout,headers:{'X-CYD-CSRF':''}});await expect('/api/auth/logout',200,{method:'POST',body:{},session:logout});await expect('/api/auth/session',401,{session:logout});
  const audits=env.DB.db.prepare('SELECT * FROM carteleria_access_audit54').all();assert.ok(audits.length>=3);assert.ok(audits.every(a=>!Object.hasOwn(a,'pin')));
  console.log(JSON.stringify({ok:true,checks,stores:128,markets:11,catalog:cat.catalog.length,missingItemsAllowed:cat.catalog.filter(p=>p.importVersion===53&&!p.code).length,checksInclude:'login, roles, CSRF, CORS, PIN visible según rol, cambios y revocación, bloqueo de intentos, persistencia, cola sin ítem, trabajo de impresión protegido'}));
  return {worker,env,master,fixtureWorker,call};
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={fixtureWorker,TEST_TOKEN};
