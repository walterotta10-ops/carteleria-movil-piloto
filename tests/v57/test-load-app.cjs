const assert=require('node:assert/strict'),{openApp}=require('./test-ui-fixture.cjs');
(async()=>{for(const [role,restore] of [['master',false],['store',false],['market',false],['master',true]]){
 const s=await openApp(role,{restore});try{
  const r=await s.win.fetch('/manual-items.json?v=v50');assert.equal(r.status,200);assert.ok(Object.keys(await r.json()).length>0);
  s.doc.querySelector('[data-cyd54-users]').click();await s.until(()=>role==='store'?s.doc.querySelector('[data-cyd54-own]'):s.doc.querySelectorAll('[data-cyd54-pin]').length===(role==='master'?139:12),'Gestión por rol');
  assert.deepEqual(s.errors,[]);console.log(JSON.stringify({ok:true,role,restore,realScripts:13,accounts:role==='master'?139:role==='market'?12:1}));
 }finally{await s.close();}
}})().catch(e=>{console.error(e);process.exitCode=1;});
