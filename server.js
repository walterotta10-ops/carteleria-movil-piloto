const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// Activa la web V53 únicamente cuando el puente ya responde con esa versión.
const cyd53Bundle=require('./cyd-v53-bundle.cjs');
const cyd53VM=require('node:vm');
function cyd53AssetMap(source){let depth=0,quoted=false,escape=false,start=source.indexOf('{');for(let i=start;i<source.length;i++){const c=source[i];if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0)return cyd53VM.runInNewContext('('+source.slice(start,i+1)+')',Object.create(null),{timeout:3000});}throw new Error('Paquete de interfaz inválido.');}
const cyd53FallbackPath=path.join(__dirname,'CLOUDFLARE-CYD-V52-MERCADOS-OFICIALES.js');
const cyd53Fallback=fs.existsSync(cyd53FallbackPath)?cyd53AssetMap(fs.readFileSync(cyd53FallbackPath,'utf8')):null;
let cyd53Status={checked:0,active:false},cyd53Probe=null;
async function cyd53Ready(){if(Date.now()-cyd53Status.checked<30000)return cyd53Status.active;if(cyd53Probe)return cyd53Probe;cyd53Probe=(async()=>{try{const r=await fetch('https://carteleria-puente-carta.walterotta10.workers.dev/health',{signal:AbortSignal.timeout(4000)}),data=await r.json(),m=/^v(\d+)/i.exec(data.version||'');cyd53Status={checked:Date.now(),active:!!(r.ok&&data.ok&&m&&Number(m[1])>=53)};}catch{cyd53Status.checked=Date.now();}return cyd53Status.active;})().finally(()=>{cyd53Probe=null;});return cyd53Probe;}
async function cyd53Serve(req,res,pathname){if(!['GET','HEAD'].includes(req.method))return false;const key=pathname==='/'?'/index.html':pathname;if(!cyd53Bundle.assets[key]&&!cyd53Fallback?.[key])return false;const active=await cyd53Ready(),assets=active||!cyd53Fallback?cyd53Bundle.assets:cyd53Fallback,asset=assets[key];if(!asset){res.statusCode=404;res.end('Not found');return true;}let body=asset.binary?Buffer.from(asset.body,'base64'):asset.body;if(asset.binary&&asset.type==='image/png'&&body.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'&&body.toString('utf8').startsWith('iVBOR'))body=Buffer.from(body.toString('utf8'),'base64');if(!active&&key==='/app.js')body=body.replace('src="assets/acuenta-logo.png"','src="assets/acuenta-logo.png?v=v53-logo-fix"');res.statusCode=200;res.setHeader('Content-Type',asset.type);res.setHeader('Cache-Control','no-store');res.setHeader('X-CYD-Version',active?'v53':'v52');res.end(req.method==='HEAD'?'':body);return true;}
async function cyd53Proxy(req,res,url){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>3500000){return json(res,413,{ok:false,error:'Archivo demasiado grande.'});}chunks.push(chunk);}const headers={'Content-Type':'application/json','Authorization':req.headers.authorization||'','X-Carteleria-Access':req.headers['x-carteleria-access']||'','X-CYD-Desktop':req.headers['x-cyd-desktop']||'','User-Agent':req.headers['user-agent']||'C&D PC'};try{const r=await fetch('https://carteleria-puente-carta.walterotta10.workers.dev'+url.pathname+url.search,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks),signal:AbortSignal.timeout(30000)});res.statusCode=r.status;res.setHeader('Content-Type',r.headers.get('Content-Type')||'application/json');res.setHeader('Cache-Control','no-store');res.end(Buffer.from(await r.arrayBuffer()));}catch{return json(res,503,{ok:false,error:'No se pudo contactar el puente de promociones.'});}}


const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_FILE = process.env.SYNC_DATA_FILE || path.join('/tmp', 'cid-carteleria-sync.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'cid-carteleria-piloto-local';

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && parsed.users ? parsed : { users: {} };
  } catch (_) {
    return { users: {} };
  }
}

let store = loadData();

function saveData() {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
    fs.renameSync(tmp, DATA_FILE);
  } catch (err) {
    console.error('No se pudo guardar la cola sincronizada:', err.message);
  }
}

function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function identityKey(name, local) {
  return crypto.createHash('sha256').update(`${normalizeName(name)}|${String(local).trim()}`).digest('hex');
}

function hashPin(pin, salt) {
  return crypto.scryptSync(String(pin), salt, 32).toString('hex');
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''), 'hex');
  const bb = Buffer.from(String(b || ''), 'hex');
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signToken(userId) {
  const payload = b64url(JSON.stringify({ sub: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }));
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  try {
    const [payload, sig] = String(token || '').split('.');
    if (!payload || !sig) return null;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.sub || !data.exp || Date.now() > data.exp) return null;
    return data.sub;
  } catch (_) {
    return null;
  }
}

function authUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const id = verifyToken(token);
  if (!id || !store.users[id]) return null;
  return { id, user: store.users[id] };
}

function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Carteleria-Access, X-CYD-Desktop');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => {
      raw += c;
      if (raw.length > 1_000_000) reject(new Error('body-too-large'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch (_) { reject(new Error('invalid-json')); }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

  if (pathname === '/api/health' && req.method === 'GET') {
    return json(res, 200, { ok: true, mode: 'pilot-sync', version: 'v53-ready', activeVersion: await cyd53Ready() ? 'v53' : 'v52' });
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); }
    catch (_) { return json(res, 400, { error: 'Solicitud inválida.' }); }

    const name = String(body.name || '').trim().replace(/\s+/g, ' ');
    const local = String(body.local || '').trim();
    const pin = String(body.pin || '').trim();
    if (name.length < 2 || name.length > 60) return json(res, 400, { error: 'Ingresa tu nombre.' });
    if (!/^\d{1,6}$/.test(local)) return json(res, 400, { error: 'Ingresa un número de local válido.' });
    if (!/^\d{4,8}$/.test(pin)) return json(res, 400, { error: 'El PIN debe tener entre 4 y 8 números.' });

    const id = identityKey(name, local);
    let user = store.users[id];
    if (!user) {
      const salt = crypto.randomBytes(16).toString('hex');
      user = store.users[id] = {
        name,
        local,
        salt,
        pinHash: hashPin(pin, salt),
        queue: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveData();
    } else if (!safeEqual(hashPin(pin, user.salt), user.pinHash)) {
      return json(res, 401, { error: 'PIN incorrecto para este usuario y local.' });
    }

    user.name = name;
    user.updatedAt = new Date().toISOString();
    saveData();
    return json(res, 200, {
      token: signToken(id),
      profile: { name: user.name, local: user.local },
      queue: Array.isArray(user.queue) ? user.queue : []
    });
  }

  if (pathname === '/api/me' && req.method === 'GET') {
    const a = authUser(req);
    if (!a) return json(res, 401, { error: 'Sesión no válida.' });
    return json(res, 200, { profile: { name: a.user.name, local: a.user.local }, queue: a.user.queue || [] });
  }

  if (pathname === '/api/queue' && req.method === 'GET') {
    const a = authUser(req);
    if (!a) return json(res, 401, { error: 'Sesión no válida.' });
    return json(res, 200, { queue: a.user.queue || [], updatedAt: a.user.updatedAt || null });
  }

  if (pathname === '/api/queue' && req.method === 'PUT') {
    const a = authUser(req);
    if (!a) return json(res, 401, { error: 'Sesión no válida.' });
    let body;
    try { body = await readBody(req); }
    catch (_) { return json(res, 400, { error: 'Solicitud inválida.' }); }
    const items = Array.isArray(body.items) ? body.items.map(x => String(x)).filter(x => /^\d{1,10}$/.test(x)).slice(0, 100) : null;
    if (!items) return json(res, 400, { error: 'Cola inválida.' });
    a.user.queue = items;
    a.user.updatedAt = new Date().toISOString();
    saveData();
    return json(res, 200, { ok: true, queue: a.user.queue, updatedAt: a.user.updatedAt });
  }

  return json(res, 404, { error: 'Ruta no encontrada.' });
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml'
};

function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(ROOT, decodeURIComponent(requested)));
  if (!filePath.startsWith(ROOT)) { res.statusCode = 403; return res.end('Forbidden'); }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      const index = path.join(ROOT, 'index.html');
      return fs.createReadStream(index).on('error', () => { res.statusCode = 404; res.end('Not found'); }).pipe(res);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', /\.(js|css|html)$/.test(filePath) ? 'no-store' : 'public, max-age=300');
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  cors(req, res);
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/master/') || url.pathname.startsWith('/api/catalogo') || url.pathname === '/api/interacciones') return cyd53Proxy(req, res, url);
  if (await cyd53Serve(req,res,url.pathname)) return;
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url.pathname);
  return serveStatic(req, res, url.pathname);
});

server.listen(PORT, () => console.log(`C&D Cartelería sync escuchando en puerto ${PORT}`));

