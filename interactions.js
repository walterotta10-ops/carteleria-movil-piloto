(function(g){
  const KEY='carteleria.interacciones.v53';let running=false;
  function load(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[];}catch{return [];}}
  async function flush(){if(running)return;running=true;try{for(let n=0;n<20;n++){const queue=load().filter(x=>g.CYD54_ACCESS?.allowedLocal(x.local));if(!queue.length)break;const item=queue[0],res=await fetch((g.CYD_API_BASE||'https://carteleria-puente-carta.walterotta10.workers.dev')+'/api/interacciones',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)});if(!res.ok)break;localStorage.setItem(KEY,JSON.stringify(load().filter(x=>x.id!==item.id)));}}catch{}finally{running=false;}}
  function record(local,kind,detail){if(!/^\d+$/.test(String(local)))return;try{const queue=load();queue.push({id:g.crypto?.randomUUID?g.crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),local:String(local),kind,detail:String(detail).slice(0,240),occurredAt:new Date().toISOString()});localStorage.setItem(KEY,JSON.stringify(queue.slice(-250)));}catch{}flush();}
  g.CYD_EVENTS={record,flush};window.addEventListener('online',flush);flush();
})(window);
