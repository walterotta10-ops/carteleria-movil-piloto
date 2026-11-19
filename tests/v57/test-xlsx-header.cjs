const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname,'../../src/app/xlsx-reader.js'),'utf8');
const sandbox = {window:{},TextDecoder};
vm.runInNewContext(source,sandbox);
const read = sandbox.window.CYD_XLSX.read;

(async()=>{
  const weekly = [
    'Productos de Destacados',
    '',
    'Nombre,Estado Destacado,Item,Barra,Product Number,Descripción,Nuevo Precio,Cantidad',
    'LISTA A,En Tienda,294503,780220002113,6493,TOFFEE SURTIDO,1000,1',
  ].join('\n');
  const rows = await read({name:'jueves.csv',size:weekly.length,text:async()=>weekly});
  assert.equal(rows.length,2,'Solo encabezados y datos reales');
  assert.equal(rows[0][4],'Product Number');
  assert.equal(rows[1][4],'6493');
  const occam = [
    'PRODUCT NUMBER,UPC,Q,PRECIO PROMO,FORMATO',
    '1234,780220002113,2,2500,SBA'
  ].join('\n');
  const o = await read({name:'occam.csv',size:occam.length,text:async()=>occam});
  assert.equal(o.length,2,'OCCAM conserva carga normal');
  await assert.rejects(read({name:'invalido.csv',size:5,text:async()=> 'a,b\n1,2'}),/encabezados/);
  console.log('OK - XLSX reader: títulos previos, jueves, OCCAM y archivo inválido');
})().catch(e=>{console.error(e);process.exitCode=1;});