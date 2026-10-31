// V56: maestra colaborativa, evidencias privadas y publicación de aportes revisados.
const CYD56_INIT=new WeakMap();
const CYD56_CORE=createProductCore();
let cyd56baseCache=null;
function cyd56base(){if(!cyd56baseCache)cyd56baseCache=JSON.parse(G['/manual-items.json'].body);return cyd56baseCache;}
async function cyd56init(env){
 await cyd54init(env);
 if(!CYD56_INIT.has(env.DB))CYD56_INIT.set(env.DB,env.DB.batch([
  env.DB.prepare('CREATE TABLE IF NOT EXISTS carteleria_products56 (item TEXT NOT NULL,upc TEXT NOT NULL,descripcion TEXT NOT NULL,marca TEXT NOT NULL,unidad TEXT NOT NULL,revision INTEGER NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL,PRIMARY KEY(item,upc))'),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS carteleria_contributions56 (id TEXT PRIMARY KEY,local TEXT NOT NULL,actor TEXT NOT NULL,item TEXT NOT NULL,upc TEXT NOT NULL,descripcion TEXT NOT NULL,marca TEXT NOT NULL,unidad TEXT NOT NULL,fingerprint TEXT NOT NULL,state TEXT NOT NULL,assessment TEXT NOT NULL,revision INTEGER NOT NULL,photo_data TEXT,created_at TEXT NOT NULL,reviewed_at TEXT,reviewed_by TEXT,review_id TEXT,note TEXT NOT NULL DEFAULT '',UNIQUE(local,fingerprint))"),
  env.DB.prepare('CREATE INDEX IF NOT EXISTS cyd56_contributions_state ON carteleria_contributions56(state,local)'),
  env.DB.prepare('CREATE TABLE IF NOT EXISTS carteleria_manual_meta56 (id INTEGER PRIMARY KEY,revision INTEGER NOT NULL,nonce TEXT NOT NULL)'),
  env.DB.prepare("INSERT OR IGNORE INTO carteleria_manual_meta56 (id,revision,nonce) VALUES (1,0,'initial')"),
  env.DB.prepare('CREATE TABLE IF NOT EXISTS carteleria_publications56 (id TEXT PRIMARY KEY,report TEXT NOT NULL,created_at TEXT NOT NULL)')
 ]).catch(error=>{CYD56_INIT.delete(env.DB);throw error;}));
 await CYD56_INIT.get(env.DB);
}
function cyd56issues(product,records){const issues=CYD56_CORE.errors(product);if(product.upc.length===13&&!CYD56_CORE.validEan(product.upc)&&!records.some(row=>CYD56_CORE.identity(row)===CYD56_CORE.identity(product)))issues.push('El dígito verificador del EAN-13 no coincide. Revisa el UPC del fleje.');return issues;}
function cyd56actor(principal){return principal.profile.role==='master'?'Usuario maestro':(principal.profile.role==='market'?'Mercado ':'Local ')+principal.profile.code;}
async function cyd56published(env){return (await env.DB.prepare('SELECT item,upc,descripcion,marca,unidad FROM carteleria_products56 ORDER BY item,upc').all()).results;}
async function cyd56records(env){return CYD56_CORE.merge(cyd56base(),await cyd56published(env));}
function cyd56scope(principal,local){if(local==='master'&&principal.profile.role==='master')return 'master';return cyd54scope(principal,local||principal.profile.code);}
function cyd56photo(value){if(!value)return null;const data=String(value);if(data.length>320000||!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(data))cyd53error('La evidencia debe ser una foto JPEG de hasta 240 KB.',400);return data;}
async function cyd56products(principal,env,url){
 await cyd56init(env);const requested=url.searchParams.get('local'),local=requested?cyd56scope(principal,requested):principal.profile.role==='store'?principal.profile.code:'',published=await cyd56published(env),meta=await env.DB.prepare('SELECT revision FROM carteleria_manual_meta56 WHERE id=1').first();
 const pending=local?(await env.DB.prepare("SELECT c.item,c.upc,c.descripcion,c.marca,c.unidad FROM carteleria_contributions56 c WHERE c.local=? AND c.state IN ('pending','approved') AND c.assessment<>'conflict' AND NOT EXISTS (SELECT 1 FROM carteleria_products56 p WHERE p.item=c.item AND p.upc=c.upc AND p.updated_at>=c.created_at) ORDER BY c.created_at,c.id").bind(local).all()).results:[];
 return cyd54json({ok:true,revision:meta.revision,local,published,pending});
}
async function cyd56submit(req,principal,env){
 await cyd56init(env);const body=await cyd53body(req,350000),local=cyd56scope(principal,body.local);
 if(body.confirmed!==true)cyd53error('Revisa y confirma los datos del producto antes de enviarlos.');
 const records=await cyd56records(env),assessment=CYD56_CORE.assess(body.product||{},records),product=assessment.product,issues=cyd56issues(product,records);if(issues.length)cyd53error(issues.join(' '));
 if(assessment.kind==='duplicate')return cyd54json({ok:true,duplicate:true,product,message:'El producto ya tiene esos datos en la maestra. No se creó un duplicado.'});
 const evidence=cyd56photo(body.photo),id=crypto.randomUUID(),fingerprint=await cyd54sha(CYD56_CORE.fingerprint(product)),now=new Date().toISOString();
 const result=await env.DB.batch([
  env.DB.prepare("INSERT OR IGNORE INTO carteleria_contributions56 (id,local,actor,item,upc,descripcion,marca,unidad,fingerprint,state,assessment,revision,photo_data,created_at) VALUES (?,?,?,?,?,?,?,?,?,'pending',?,1,?,?)").bind(id,local,cyd56actor(principal),product.item,product.upc,product.descripcion,product.marca,product.unidad,fingerprint,assessment.kind,evidence,now),
  env.DB.prepare('UPDATE carteleria_manual_meta56 SET revision=revision+1 WHERE id=1 AND EXISTS (SELECT 1 FROM carteleria_contributions56 WHERE id=?)').bind(id)
 ]);
 const row=await env.DB.prepare('SELECT id,state,assessment,revision FROM carteleria_contributions56 WHERE local=? AND fingerprint=?').bind(local,fingerprint).first();
 return cyd54json({ok:true,id:row.id,state:row.state,assessment:row.assessment,revision:row.revision,duplicate:!result[0].meta?.changes,usable:row.assessment!=='conflict'&&['pending','approved','published'].includes(row.state),product,message:row.state==='rejected'?'Ese aporte fue devuelto para corrección. Revisa los datos.':row.assessment==='conflict'?'Aporte enviado a revisión: el UPC coincide con otro ítem.':'Datos guardados para este local y enviados a revisión para compartirlos con todos.'});
}
function cyd56master(principal){if(principal.profile.role!=='master')cyd53error('La revisión y publicación corresponde al usuario maestro.',403);}
async function cyd56contributions(principal,env,url){
 await cyd56init(env);cyd56master(principal);const state=url.searchParams.get('state')||'pending';if(!['pending','approved','published','rejected'].includes(state))cyd53error('Estado no reconocido.');
 const rows=(await env.DB.prepare('SELECT id,local,actor,item,upc,descripcion,marca,unidad,fingerprint,state,assessment,revision,created_at,reviewed_at,reviewed_by,note,CASE WHEN photo_data IS NULL THEN 0 ELSE 1 END AS hasPhoto FROM carteleria_contributions56 WHERE state=? ORDER BY created_at DESC LIMIT 500').bind(state).all()).results;
 const counts=(await env.DB.prepare('SELECT state,COUNT(*) AS total FROM carteleria_contributions56 GROUP BY state').all()).results;
 return cyd54json({ok:true,contributions:rows,counts,limit:500});
}
async function cyd56evidence(principal,env,url){await cyd56init(env);cyd56master(principal);const row=await env.DB.prepare('SELECT photo_data FROM carteleria_contributions56 WHERE id=?').bind(url.searchParams.get('id')||'').first();if(!row?.photo_data)cyd53error('La foto ya no está disponible.',404);const bytes=Uint8Array.from(atob(row.photo_data.split(',')[1]),c=>c.charCodeAt(0));return new Response(bytes,{headers:{'Content-Type':'image/jpeg','Cache-Control':'no-store'}});}
async function cyd56review(req,principal,env){
 await cyd56init(env);cyd56master(principal);const body=await cyd53body(req,5000),row=await env.DB.prepare('SELECT * FROM carteleria_contributions56 WHERE id=?').bind(String(body.id||'')).first();
 if(!row)cyd53error('No se encontró el aporte.',404);if(!['pending','approved'].includes(row.state)||Number(body.revision)!==row.revision)cyd53error('El aporte cambió. Actualiza antes de revisarlo.',409);
 if(!['approve','reject'].includes(body.action))cyd53error('Selecciona aprobar o devolver.');
 const approve=body.action==='approve';if(approve&&body.confirmed!==true)cyd53error('Confirma que revisaste los datos del producto.');
 const records=await cyd56records(env),assessment=CYD56_CORE.assess(body.product||row,records),product=assessment.product,issues=cyd56issues(product,records);if(approve&&issues.length)cyd53error(issues.join(' '));if(approve&&assessment.kind==='conflict')cyd53error(assessment.message);
 const fingerprint=await cyd54sha(CYD56_CORE.fingerprint(product)),reviewId=crypto.randomUUID(),now=new Date().toISOString(),state=approve?'approved':'rejected',note=String(body.note||'').trim().slice(0,300);
 // Si una corrección produciría un duplicado local, se revisa sin cambiar su identidad; se publica una sola ficha.
 const duplicate=await env.DB.prepare('SELECT id FROM carteleria_contributions56 WHERE local=? AND fingerprint=? AND id<>?').bind(row.local,fingerprint,row.id).first();if(duplicate)cyd53error('La corrección coincide con otro aporte del mismo local. Devuelve este y aprueba el registro existente.',409);
 const result=await env.DB.batch([
  env.DB.prepare("UPDATE carteleria_contributions56 SET item=?,upc=?,descripcion=?,marca=?,unidad=?,fingerprint=?,state=?,assessment=?,revision=revision+1,reviewed_at=?,reviewed_by=?,review_id=?,note=?,photo_data=CASE WHEN ?='rejected' THEN NULL ELSE photo_data END WHERE id=? AND revision=? AND state IN ('pending','approved')").bind(product.item,product.upc,product.descripcion,product.marca,product.unidad,fingerprint,state,assessment.kind,now,cyd56actor(principal),reviewId,note,state,row.id,row.revision),
  env.DB.prepare("UPDATE carteleria_contributions56 SET item=?,upc=?,descripcion=?,marca=?,unidad=?,fingerprint=?,state=?,assessment=?,revision=revision+1,reviewed_at=?,reviewed_by=?,review_id=?,note=?,photo_data=CASE WHEN ?='rejected' THEN NULL ELSE photo_data END WHERE fingerprint=? AND id<>? AND state IN ('pending','approved') AND NOT EXISTS (SELECT 1 FROM carteleria_contributions56 AS other WHERE other.local=carteleria_contributions56.local AND other.fingerprint=? AND other.id<>carteleria_contributions56.id) AND EXISTS (SELECT 1 FROM carteleria_contributions56 WHERE id=? AND review_id=?)").bind(product.item,product.upc,product.descripcion,product.marca,product.unidad,fingerprint,state,assessment.kind,now,cyd56actor(principal),reviewId,note,state,row.fingerprint,row.id,fingerprint,row.id,reviewId),
  env.DB.prepare('UPDATE carteleria_manual_meta56 SET revision=revision+1 WHERE id=1 AND EXISTS (SELECT 1 FROM carteleria_contributions56 WHERE id=? AND review_id=?)').bind(row.id,reviewId)
 ]);
 if(!result[0].meta?.changes)cyd53error('Otro cambio modificó el aporte. Actualiza.',409);
 return cyd54json({ok:true,state,reviewed:Number(result[0].meta.changes)+Number(result[1].meta.changes),message:approve?'Aporte revisado. Se compartirá en la próxima publicación de la maestra.':'Aporte devuelto para corrección.'});
}
async function cyd56publish(env,key,actor){
 await cyd56init(env);const receipt=await env.DB.prepare('SELECT report FROM carteleria_publications56 WHERE id=?').bind(key).first();if(receipt)return {...JSON.parse(receipt.report),alreadyApplied:true};
 const meta=await env.DB.prepare('SELECT revision,nonce FROM carteleria_manual_meta56 WHERE id=1').first(),approved=(await env.DB.prepare("SELECT id,item,upc,descripcion,marca,unidad,revision FROM carteleria_contributions56 WHERE state='approved' ORDER BY reviewed_at,id").all()).results;
 if(!approved.length){const report={ok:true,published:0,contributions:0,revision:meta.revision};await env.DB.prepare('INSERT OR IGNORE INTO carteleria_publications56 (id,report,created_at) VALUES (?,?,?)').bind(key,JSON.stringify(report),new Date().toISOString()).run();const saved=await env.DB.prepare('SELECT report FROM carteleria_publications56 WHERE id=?').bind(key).first();return JSON.parse(saved.report);}
 const records=await cyd56records(env),products=new Map();for(const row of approved){const assessment=CYD56_CORE.assess(row,[...records,...products.values()]);if(cyd56issues(assessment.product,records).length)cyd53error('Un aporte revisado necesita corregir su EAN-13 antes de publicarse.',409);if(assessment.kind==='conflict')cyd53error('Hay aportes aprobados con UPC e ítem incompatibles. Revisa los aportes antes de publicar.',409);products.set(CYD56_CORE.identity(row),CYD56_CORE.normalize(row));}
 const revision=Number(meta.revision)+1,nonce=crypto.randomUUID(),now=new Date().toISOString(),snapshot=JSON.stringify(approved.map(r=>({id:r.id,revision:r.revision}))),payload=JSON.stringify([...products.values()]),report={ok:true,published:products.size,contributions:approved.length,revision};
 // El lote es atómico. Un nonce y las revisiones capturadas impiden publicar una revisión concurrente o repetirla.
 const result=await env.DB.batch([
  env.DB.prepare("UPDATE carteleria_manual_meta56 SET revision=?,nonce=? WHERE id=1 AND revision=? AND nonce=? AND (SELECT COUNT(*) FROM carteleria_contributions56 c JOIN json_each(?) j ON c.id=json_extract(j.value,'$.id') AND c.revision=json_extract(j.value,'$.revision') WHERE c.state='approved')=? AND NOT EXISTS (SELECT 1 FROM carteleria_publications56 WHERE id=?)").bind(revision,nonce,meta.revision,meta.nonce,snapshot,approved.length,key),
  env.DB.prepare("INSERT INTO carteleria_products56 (item,upc,descripcion,marca,unidad,revision,updated_at,updated_by) SELECT json_extract(j.value,'$.item'),json_extract(j.value,'$.upc'),json_extract(j.value,'$.descripcion'),json_extract(j.value,'$.marca'),json_extract(j.value,'$.unidad'),?,?,? FROM json_each(?) j WHERE EXISTS (SELECT 1 FROM carteleria_manual_meta56 WHERE id=1 AND nonce=?) ON CONFLICT(item,upc) DO UPDATE SET descripcion=excluded.descripcion,marca=excluded.marca,unidad=excluded.unidad,revision=excluded.revision,updated_at=excluded.updated_at,updated_by=excluded.updated_by").bind(revision,now,actor,payload,nonce),
  env.DB.prepare("UPDATE carteleria_contributions56 SET state='published',revision=revision+1,photo_data=NULL WHERE id IN (SELECT json_extract(value,'$.id') FROM json_each(?)) AND state='approved' AND EXISTS (SELECT 1 FROM carteleria_manual_meta56 WHERE id=1 AND nonce=?)").bind(snapshot,nonce),
  env.DB.prepare('INSERT INTO carteleria_publications56 (id,report,created_at) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM carteleria_manual_meta56 WHERE id=1 AND nonce=?)').bind(key,JSON.stringify(report),now,nonce)
 ]);
 if(!result[0].meta?.changes){const saved=await env.DB.prepare('SELECT report FROM carteleria_publications56 WHERE id=?').bind(key).first();if(saved)return {...JSON.parse(saved.report),alreadyApplied:true};cyd53error('Los aportes cambiaron durante la publicación. Actualiza e intenta nuevamente.',409);}return report;
}
async function cyd56route(req,principal,env,url){
 const path=url.pathname;if(!path.startsWith('/api/manual/')&&!path.startsWith('/api/master/manual/'))return null;
 if(req.method!=='GET'){cyd54post(req);cyd54csrf(req,principal);}
 if(path==='/api/manual/products'&&req.method==='GET')return cyd56products(principal,env,url);
 if(path==='/api/manual/contributions'&&req.method==='POST')return cyd56submit(req,principal,env);
 if(path==='/api/master/manual/contributions'&&req.method==='GET')return cyd56contributions(principal,env,url);
 if(path==='/api/master/manual/photo'&&req.method==='GET')return cyd56evidence(principal,env,url);
 if(path==='/api/master/manual/review'&&req.method==='POST')return cyd56review(req,principal,env);
 if(path==='/api/master/manual/publish'&&req.method==='POST'){cyd56master(principal);const body=await cyd53body(req,2000);if(!/^[\w-]{8,80}$/.test(String(body.id||'')))cyd53error('Actualiza antes de publicar.');return cyd54json(await cyd56publish(env,'manual:'+body.id,cyd56actor(principal)));}
 cyd53error('Ruta no encontrada.',404);
}
async function cyd56weeklyCommit(req,env){
 const body=await cyd53body(req.clone(),4000),response=await cyd53commit(req,env);if(!response.ok)return response;
 const result=await response.json(),draft=await env.DB.prepare('SELECT kind,state FROM carteleria_imports53 WHERE id=?').bind(String(body.id||'')).first();
 if(draft?.kind==='weekly'&&draft.state==='applied'){try{result.manualProducts=await cyd56publish(env,'weekly:'+String(body.id),'Actualización semanal');}catch(error){result.manualProducts={ok:false,error:'Las promociones se actualizaron. La maestra requiere una nueva publicación desde Aportes de productos.'};}}
 return cyd54json(result);
}
