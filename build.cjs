const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, 'src', 'app');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png'
};
const assets = {};

function addAssets(directory, prefix = '') {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, entry.name);
    const route = prefix + '/' + entry.name;
    if (entry.isDirectory()) {
      addAssets(file, route);
      continue;
    }
    const extension = path.extname(entry.name);
    const type = types[extension];
    if (!type) throw new Error('Tipo de archivo desconocido: ' + route);
    const binary = extension === '.png';
    assets[route] = { type, binary, body: fs.readFileSync(file, binary ? 'base64' : 'utf8') };
  }
}

addAssets(root);
const backend = fs.readFileSync(path.join(__dirname, 'src', 'worker-backend.mjs'), 'utf8');
const target = path.join(__dirname, 'worker-v61.mjs');
fs.writeFileSync(target, 'const G=' + JSON.stringify(assets) + backend);
console.log(target);
