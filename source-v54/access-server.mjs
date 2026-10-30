// V54: acceso por local/mercado, sesiones y gestión de claves sobre la misma D1.
const CYD54_INIT = new WeakMap();
const CYD54_KEYS = new WeakMap();
const CYD54_COOKIE = '__Host-cyd54';
const CYD54_SESSION_MS = 12 * 60 * 60 * 1000;
const CYD54_IDLE_MS = 2 * 60 * 60 * 1000;
const CYD54_WINDOW_MS = 15 * 60 * 1000;
const CYD54_ORIGINS = new Set(['https://carteleria-puente-carta.walterotta10.workers.dev', 'https://carteleria-movil-piloto.onrender.com']);
const CYD54_PUBLIC = new Set(['/', '/index.html', '/styles.css', '/access-v54.js', '/access-v54.css', '/manifest.webmanifest', '/favicon.ico']);
const CYD54_JOB_PATHS = new Set(['/trabajo', '/tomar', '/impreso', '/fallo', '/siguiente']);
const cyd54enc = new TextEncoder();
function cyd54b64(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function cyd54bytes(value) { return Uint8Array.from(atob(String(value).replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); }
function cyd54random(size = 32) { return cyd54b64(crypto.getRandomValues(new Uint8Array(size))); }
async function cyd54sha(value) { return cyd54b64(new Uint8Array(await crypto.subtle.digest('SHA-256', cyd54enc.encode(value)))); }
function cyd54same(a, b) { a=String(a); b=String(b); let diff=a.length^b.length; for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0); return diff===0; }
function cyd54code(value) { return String(value??'').trim().replace(/^0+(?=\d)/, ''); }
function cyd54account(role, code) {
  code=cyd54code(code);
  if(!/^\d{1,4}$/.test(code) || role==='store'&&!Object.prototype.hasOwnProperty.call(LOCAL_MERCADO,code) || role==='market'&&!Object.prototype.hasOwnProperty.call(MERCADOS,code) || !['store','market'].includes(role))return null;
  return {role,code,key:role+':'+code,market:role==='market'?code:LOCAL_MERCADO[code]};
}
function cyd54identify(value) { const code=cyd54code(value); return cyd54account(Object.prototype.hasOwnProperty.call(MERCADOS,code)?'market':'store',code); }
function cyd54default(account) { return account.code.padStart(4,'0'); }
function cyd54name(account) { return account.role==='market' ? MERCADO_NOMBRES[account.code] : CYD54_STORE_NAMES[account.code]?.name||'Local '+account.code; }
function cyd54profile(account) { return {role:account.role,code:account.code,name:cyd54name(account),market:account.market,marketName:MERCADO_NOMBRES[account.market],locals:account.role==='market'?[...MERCADOS[account.code]]:[account.code]}; }
function cyd54masterProfile() { return {role:'master',code:'Walter',name:'Usuario maestro',locals:[...w],markets:MERCADOS}; }
function cyd54origin(req) {
  const origin=req.headers.get('Origin');
  if(origin && origin!==new URL(req.url).origin && !CYD54_ORIGINS.has(origin))cyd53error('Este origen no tiene acceso a la aplicación.',403);
  return origin;
}
function cyd54response(req, response) {
  const headers=new Headers(response.headers);headers.delete('Access-Control-Allow-Origin');headers.delete('Access-Control-Allow-Credentials');
  const origin=req.headers.get('Origin');if(origin&&(origin===new URL(req.url).origin||CYD54_ORIGINS.has(origin))) {headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Credentials','true');headers.append('Vary','Origin');}
  headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers','Content-Type, Authorization, X-Carteleria-Access, X-CYD-Desktop, X-CYD-CSRF');
  headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','same-origin');headers.set('X-CYD-Version','v54');
  return new Response(response.body,{status:response.status,headers});
}
function cyd54json(data,status=200,extra={}) { return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra}}); }
function cyd54cookie(value,maxAge=CYD54_SESSION_MS/1000) { return `${CYD54_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`; }
function cyd54cookieValue(req) { return (req.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(CYD54_COOKIE+'='))?.slice(CYD54_COOKIE.length+1)||''; }
function cyd54post(req) { if(req.method!=='POST')cyd53error('Método no permitido.',405); if(!(req.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))cyd53error('La solicitud debe enviarse como JSON.',415); }
async function cyd54init(env) {
  if(!env.DB)cyd53error('No está conectada la base de datos del puente.',503);
  if(!CYD54_INIT.has(env.DB))CYD54_INIT.set(env.DB,(async()=>{
    await cyd53init(env);
    await env.DB.batch([
      env.DB.prepare('CREATE TABLE IF NOT EXISTS carteleria_access54 (account_key TEXT PRIMARY KEY,role TEXT NOT NULL,code TEXT NOT NULL,pin_salt TEXT NOT NULL,pin_hash TEXT NOT NULL,pin_encrypted TEXT NOT NULL,revision INTEGER NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL,UNIQUE(role,code))'),
      env.DB.prepare('CREATE TABLE IF NOT EXISTS carteleria_sessions54 (token_hash TEXT PRIMARY KEY,account_key TEXT NOT NULL,account_revision INTEGER NOT NULL,csrf TEXT NOT NULL,expires_at INTEGER NOT NULL,last_seen INTEGER NOT NULL,created_at INTEGER NOT NULL)'),
      env.DB.prepare('CREATE INDEX IF NOT EXISTS cyd54_session_account ON carteleria_sessions54(account_key)'),
      env.DB.prepare('CREATE TABLE IF NOT EXISTS carteleria_attempts54 (bucket TEXT PRIMARY KEY,attempts INTEGER NOT NULL,window_start INTEGER NOT NULL,blocked_until INTEGER NOT NULL DEFAULT 0)'),
      env.DB.prepare('CREATE TABLE IF NOT EXISTS carteleria_access_audit54 (id TEXT PRIMARY KEY,actor TEXT NOT NULL,target TEXT NOT NULL,action TEXT NOT NULL,occurred_at TEXT NOT NULL)'),
      env.DB.prepare("INSERT OR IGNORE INTO carteleria_config (key,value) VALUES ('access54_key',?)").bind(cyd54random())
    ]);
    const key=await env.DB.prepare("SELECT value FROM carteleria_config WHERE key='access54_key'").first();
    CYD54_KEYS.set(env.DB,{secret:key.value,aes:await crypto.subtle.importKey('raw',cyd54bytes(key.value),'AES-GCM',false,['encrypt','decrypt'])});
  })().catch(e=>{CYD54_INIT.delete(env.DB);CYD54_KEYS.delete(env.DB);throw e;}));
  await CYD54_INIT.get(env.DB);
}
async function cyd54hashPin(pin,salt,env) {
  const raw=cyd54enc.encode(pin+':'+CYD54_KEYS.get(env.DB).secret);
  const key=await crypto.subtle.importKey('raw',raw,'PBKDF2',false,['deriveBits']);
  return cyd54b64(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:cyd54bytes(salt),iterations:100000},key,256)));
}
async function cyd54seal(pin,account,env) {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:cyd54enc.encode(account.key)},CYD54_KEYS.get(env.DB).aes,cyd54enc.encode(pin));
  return cyd54b64(iv)+'.'+cyd54b64(new Uint8Array(encrypted));
}
async function cyd54reveal(row,account,env) {
  if(!row)return cyd54default(account);
  const [iv,data]=row.pin_encrypted.split('.');
  return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:cyd54bytes(iv),additionalData:cyd54enc.encode(account.key)},CYD54_KEYS.get(env.DB).aes,cyd54bytes(data)));
}
async function cyd54row(account,env) { return env.DB.prepare('SELECT * FROM carteleria_access54 WHERE account_key=?').bind(account.key).first(); }
async function cyd54pinRecord(pin,account,env) { const salt=cyd54random(16);return {salt,hash:await cyd54hashPin(pin,salt,env),encrypted:await cyd54seal(pin,account,env)}; }
async function cyd54checkPin(pin,row,account,env) { return row ? cyd54same(await cyd54hashPin(pin,row.pin_salt,env),row.pin_hash) : cyd54same(pin,cyd54default(account)); }
async function cyd54buckets(req,key) { return [{key:'account:'+key,limit:5},{key:'ip:'+await cyd54sha(req.headers.get('CF-Connecting-IP')||'unknown'),limit:60}]; }
async function cyd54throttle(req,key,env) {
  const buckets=await cyd54buckets(req,key);const now=Date.now();
  for(const b of buckets){const r=await env.DB.prepare('SELECT blocked_until FROM carteleria_attempts54 WHERE bucket=?').bind(b.key).first();if(r&&r.blocked_until>now)cyd53error('Demasiados intentos. Espera 15 minutos o solicita un cambio de clave a tu jefe de mercado.',429);}
  return buckets;
}
async function cyd54failed(buckets,env) {
  const now=Date.now();
  await env.DB.batch(buckets.map(b=>env.DB.prepare(`INSERT INTO carteleria_attempts54 (bucket,attempts,window_start,blocked_until) VALUES (?,1,?,0)
    ON CONFLICT(bucket) DO UPDATE SET
    attempts=CASE WHEN ?-window_start>=? THEN 1 ELSE attempts+1 END,
    blocked_until=CASE WHEN ?-window_start>=? THEN 0 WHEN attempts+1>=? THEN ? ELSE blocked_until END,
    window_start=CASE WHEN ?-window_start>=? THEN ? ELSE window_start END`).bind(b.key,now,now,CYD54_WINDOW_MS,now,CYD54_WINDOW_MS,b.limit,now+CYD54_WINDOW_MS,now,CYD54_WINDOW_MS,now)));
}
async function cyd54clearAttempts(account,env) { await env.DB.prepare('DELETE FROM carteleria_attempts54 WHERE bucket=?').bind('account:'+account.key).run(); }
async function cyd54session(account,row,env) {
  const token=cyd54random(),csrf=cyd54random(),now=Date.now(),expires=now+CYD54_SESSION_MS;
  await env.DB.prepare('INSERT INTO carteleria_sessions54 (token_hash,account_key,account_revision,csrf,expires_at,last_seen,created_at) VALUES (?,?,?,?,?,?,?)').bind(await cyd54sha(token),account.key,row.revision,csrf,expires,now,now).run();
  return {token,csrf,expiresAt:new Date(expires).toISOString(),profile:cyd54profile(account)};
}
async function cyd54principal(req,env) {
  if(String(req.headers.get('X-Carteleria-Access')||'').toLowerCase()==='walter') { await cyd53master(req);return {profile:cyd54masterProfile(),session:null,account:null}; }
  const token=cyd54cookieValue(req);if(!/^[A-Za-z0-9_-]{43}$/.test(token))cyd53error('Ingresa nuevamente con tu local y contraseña.',401);
  await cyd54init(env);
  const hash=await cyd54sha(token);
  const session=await env.DB.prepare('SELECT s.*,a.role,a.code,a.revision AS current_revision FROM carteleria_sessions54 s JOIN carteleria_access54 a ON a.account_key=s.account_key WHERE s.token_hash=?').bind(hash).first();
  const now=Date.now();
  if(!session||session.account_revision!==session.current_revision||session.expires_at<=now||session.last_seen<=now-CYD54_IDLE_MS){if(session)await env.DB.prepare('DELETE FROM carteleria_sessions54 WHERE token_hash=?').bind(hash).run();cyd53error('La sesión terminó. Ingresa nuevamente con tu contraseña.',401);}
  const account=cyd54account(session.role,session.code);if(!account)cyd53error('El acceso ya no pertenece a la nómina oficial.',403);
  if(now-session.last_seen>300000)await env.DB.prepare('UPDATE carteleria_sessions54 SET last_seen=? WHERE token_hash=?').bind(now,hash).run();
  return {profile:cyd54profile(account),session,account};
}
function cyd54csrf(req,principal) { if(principal.profile.role==='master')return; if(!principal.session||!cyd54same(req.headers.get('X-CYD-CSRF')||'',principal.session.csrf))cyd53error('Actualiza tu sesión antes de guardar este cambio.',403); }
function cyd54scope(principal,local) { local=cyd54code(local);if(!Object.prototype.hasOwnProperty.call(LOCAL_MERCADO,local))cyd53error('Local no reconocido.',403);if(principal.profile.role==='master')return local;if(!principal.profile.locals.includes(local))cyd53error('Este acceso no puede gestionar ese local.',403);return local; }
async function cyd54login(req,env) {
  cyd54post(req);await cyd54init(env);const body=await cyd53body(req,4096),identity=String(body.access??body.local??'').trim();
  const account=cyd54identify(identity),pin=String(body.pin??'');
  if(!/^\d{4}$/.test(pin))cyd53error('Ingresa una contraseña de exactamente 4 dígitos.');
  const buckets=await cyd54throttle(req,account?.key||'invalid:'+identity.slice(0,20),env);
  let row=account?await cyd54row(account,env):null;
  if(!account||!await cyd54checkPin(pin,row,account,env)){await cyd54failed(buckets,env);cyd53error('Acceso o contraseña incorrectos.',401);}
  if(!row){const value=await cyd54pinRecord(pin,account,env);await env.DB.prepare('INSERT OR IGNORE INTO carteleria_access54 (account_key,role,code,pin_salt,pin_hash,pin_encrypted,revision,updated_at,updated_by) VALUES (?,?,?,?,?,?,1,?,?)').bind(account.key,account.role,account.code,value.salt,value.hash,value.encrypted,new Date().toISOString(),'Clave inicial').run();row=await cyd54row(account,env);if(!await cyd54checkPin(pin,row,account,env)){await cyd54failed(buckets,env);cyd53error('La contraseña cambió. Ingresa nuevamente.',401);}}
  await cyd54clearAttempts(account,env);
  const session=await cyd54session(account,row,env);
  await env.DB.prepare('DELETE FROM carteleria_sessions54 WHERE expires_at<?').bind(Date.now()).run();
  return cyd54json({ok:true,profile:session.profile,csrf:session.csrf,expiresAt:session.expiresAt},200,{'Set-Cookie':cyd54cookie(session.token)});
}
async function cyd54accounts(principal,env) {
  await cyd54init(env);const role=principal.profile.role;
  const accounts=role==='master'?[...Object.keys(MERCADOS).map(c=>cyd54account('market',c)),...w.map(c=>cyd54account('store',c))]:role==='market'?[cyd54account('market',principal.profile.code),...principal.profile.locals.map(c=>cyd54account('store',c))]:[principal.account];
  const stored=(await env.DB.prepare('SELECT * FROM carteleria_access54').all()).results;const rows=new Map(stored.map(r=>[r.account_key,r]));
  const out=[];for(const a of accounts){const row=rows.get(a.key),canSee=role==='master'||role==='market'&&a.role==='store';out.push({role:a.role,code:a.code,name:cyd54name(a),market:a.market,marketName:MERCADO_NOMBRES[a.market],revision:row?.revision||0,pin:canSee?await cyd54reveal(row,a,env):null,updatedAt:row?.updated_at||null,updatedBy:row?.updated_by||'Clave inicial',canReset:canSee});}
  return cyd54json({ok:true,profile:principal.profile,accounts:out});
}
async function cyd54change(req,principal,env,admin) {
  cyd54post(req);cyd54csrf(req,principal);await cyd54init(env);const body=await cyd53body(req,4096);
  const target=admin?cyd54account(String(body.role||''),body.code):principal.account;
  if(!target)cyd53error('Acceso no válido.',403);
  if(admin){if(principal.profile.role==='store'||principal.profile.role==='market'&&(target.role!=='store'||!principal.profile.locals.includes(target.code)))cyd53error('Solo puedes cambiar claves de los locales de tu mercado.',403);}
  const pin=String(body.pin??'');if(!/^\d{4}$/.test(pin))cyd53error('La contraseña nueva debe tener exactamente 4 dígitos.');
  const row=await cyd54row(target,env),revision=row?.revision||0;
  if(admin&&body.revision!==revision)cyd53error('Otro usuario cambió esta clave. Actualiza la lista y vuelve a intentarlo.',409);
  if(!admin){const buckets=await cyd54throttle(req,target.key,env);if(!/^\d{4}$/.test(String(body.currentPin??''))||!await cyd54checkPin(String(body.currentPin),row,target,env)){await cyd54failed(buckets,env);cyd53error('La contraseña actual es incorrecta.',400);}}
  const value=await cyd54pinRecord(pin,target,env),now=new Date().toISOString(),actor=principal.profile.role==='master'?'Usuario maestro':(principal.profile.role==='market'?'Mercado ':'Local ')+principal.profile.code;
  const result=row?await env.DB.prepare('UPDATE carteleria_access54 SET pin_salt=?,pin_hash=?,pin_encrypted=?,revision=revision+1,updated_at=?,updated_by=? WHERE account_key=? AND revision=?').bind(value.salt,value.hash,value.encrypted,now,actor,target.key,revision).run():await env.DB.prepare('INSERT OR IGNORE INTO carteleria_access54 (account_key,role,code,pin_salt,pin_hash,pin_encrypted,revision,updated_at,updated_by) VALUES (?,?,?,?,?,?,1,?,?)').bind(target.key,target.role,target.code,value.salt,value.hash,value.encrypted,now,actor).run();
  if(Number(result.meta?.changes)!==1)cyd53error('La clave cambió durante la operación. Actualiza e intenta nuevamente.',409);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM carteleria_sessions54 WHERE account_key=?').bind(target.key),
    env.DB.prepare('DELETE FROM carteleria_attempts54 WHERE bucket=?').bind('account:'+target.key),
    env.DB.prepare('INSERT INTO carteleria_access_audit54 (id,actor,target,action,occurred_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),actor,target.key,admin?'reset_password':'change_password',now)
  ]);
  const self=principal.account?.key===target.key;
  if(self){const fresh=await cyd54row(target,env),session=await cyd54session(target,fresh,env);return cyd54json({ok:true,profile:session.profile,csrf:session.csrf,expiresAt:session.expiresAt,message:'Contraseña actualizada.'},200,{'Set-Cookie':cyd54cookie(session.token)});}
  return cyd54json({ok:true,message:'Contraseña actualizada. El local deberá ingresar con su nueva clave.'});
}
async function cyd54authorize(req,env,url,principal) {
  const path=url.pathname;
  if(path.startsWith('/api/master/')){if(principal.profile.role!=='master')cyd53error('Este acceso corresponde al usuario maestro.',403);return req;}
  if(path==='/api/catalogo'||path==='/api/catalogo/version')return req;
  if(path==='/api/estadisticas'){
    if(principal.profile.role==='store')cyd53error('Esta vista corresponde a un jefe de mercado.',403);
    const access=principal.profile.role==='market'?principal.profile.code:String(req.headers.get('X-Carteleria-Access')||'');
    if(!Object.prototype.hasOwnProperty.call(MERCADOS,access))cyd53error('Selecciona un mercado válido.',403);
    const headers=new Headers(req.headers);headers.set('X-Carteleria-Access',access);return new Request(req,{headers});
  }
  if(path==='/api/cola'){cyd54scope(principal,url.searchParams.get('local'));return req;}
  if(path==='/api/uso'||path==='/api/interacciones'){const body=await cyd53body(req.clone(),5000);cyd54scope(principal,body.local);return req;}
  if(path==='/trabajo'){const body=await cyd53body(req.clone(),3500000);cyd54scope(principal,body.local);return req;}
  if(path==='/tomar'||path==='/siguiente'){cyd54scope(principal,url.searchParams.get('local'));return req;}
  if(path==='/impreso'||path==='/fallo'){
    const body=await cyd53body(req.clone(),4096);await b(env);const job=await env.DB.prepare('SELECT local FROM trabajos WHERE id=?').bind(Number(body.id)||0).first();if(!job)cyd53error('Trabajo no encontrado.',404);cyd54scope(principal,job.local);return req;
  }
  if(path.startsWith('/api/'))cyd53error('Ruta no encontrada.',404);
  return req;
}
async function cyd54fetch(req,env,ctx) {
  try{
    const url=new URL(req.url),path=url.pathname;cyd54origin(req);
    if(req.method==='OPTIONS')return cyd54response(req,new Response(null,{status:204}));
    if((path==='/health'||path==='/api/health')&&req.method==='GET')return cyd54response(req,cyd54json({ok:true,version:'v54',servicio:'Cartelería C&D',authentication:true,master:true,promotions:true}));
    if(path==='/api/auth/login')return cyd54response(req,await cyd54login(req,env));
    if(path==='/api/auth/logout'){
      cyd54post(req);const token=cyd54cookieValue(req);if(token){await cyd54init(env);const hash=await cyd54sha(token),session=await env.DB.prepare('SELECT csrf FROM carteleria_sessions54 WHERE token_hash=?').bind(hash).first();let master=false;if(String(req.headers.get('X-Carteleria-Access')||'').toLowerCase()==='walter'){await cyd53master(req);master=true;}if(session&&!cyd54same(req.headers.get('X-CYD-CSRF')||'',session.csrf)&&!master)cyd53error('Actualiza tu sesión antes de salir.',403);await env.DB.prepare('DELETE FROM carteleria_sessions54 WHERE token_hash=?').bind(hash).run();}
      return cyd54response(req,cyd54json({ok:true},200,{'Set-Cookie':cyd54cookie('',0)}));
    }
    const publicAsset=CYD54_PUBLIC.has(path)||path.startsWith('/assets/')&&G[path]?.type?.startsWith('image/');
    if(publicAsset&&['GET','HEAD'].includes(req.method)){
      if(path!=='/'&&!G[path])return cyd54response(req,cyd54json({ok:false,error:'Archivo no encontrado.'},404));
      return cyd54response(req,await CYD54_BASE.fetch(req,env,ctx));
    }
    const principal=await cyd54principal(req,env);
    if(path==='/api/auth/session'&&req.method==='GET')return cyd54response(req,cyd54json({ok:true,profile:principal.profile,csrf:principal.session?.csrf||null,expiresAt:principal.session?new Date(principal.session.expires_at).toISOString():null}));
    if(path==='/api/auth/accounts'&&req.method==='GET')return cyd54response(req,await cyd54accounts(principal,env));
    if(path==='/api/auth/password')return cyd54response(req,await cyd54change(req,principal,env,false));
    if(path==='/api/auth/accounts/password')return cyd54response(req,await cyd54change(req,principal,env,true));
    if((path.startsWith('/api/')||CYD54_JOB_PATHS.has(path))&&!['GET','HEAD'].includes(req.method)){cyd54post(req);cyd54csrf(req,principal);}
    const request=await cyd54authorize(req,env,url,principal);
    return cyd54response(req,await CYD54_BASE.fetch(request,env,ctx));
  }catch(error){const err=/** @type {Error & {status?:number}} */(error);return cyd54response(req,cyd54json({ok:false,error:err.status?err.message:'No se pudo completar la operación. Reintenta.',code:err.status===401?'session_required':undefined},err.status||500));}
}
export default {fetch:cyd54fetch,async scheduled(controller,env,ctx){await z.scheduled(controller,env,ctx);await cyd54init(env);await env.DB.batch([env.DB.prepare('DELETE FROM carteleria_sessions54 WHERE expires_at<?').bind(Date.now()),env.DB.prepare('DELETE FROM carteleria_attempts54 WHERE window_start<?').bind(Date.now()-7*86400000)]);}};
