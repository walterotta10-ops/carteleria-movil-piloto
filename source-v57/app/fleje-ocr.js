(function(g){
 'use strict';
 const VERSION='6.0.1',CORE='6.1.2',DATA='https://cdn.jsdelivr.net/npm/@tesseract.js-data/spa@1.0.0/4.0.0_best_int';
 let loader=null;
 function load(){if(g.Tesseract)return Promise.resolve(g.Tesseract);if(!loader)loader=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@'+VERSION+'/dist/tesseract.min.js';script.crossOrigin='anonymous';script.onload=()=>resolve(g.Tesseract);script.onerror=()=>{loader=null;script.remove();reject(new Error('No se pudo cargar el lector del fleje. Reintenta con conexión a internet o completa los campos.'));};document.head.appendChild(script);});return loader;}
 async function photo(file){if(!/^image\//.test(file.type)||file.size>20*1024*1024)throw new Error('Selecciona una foto de hasta 20 MB.');const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();if(img.width<400||img.height<200)throw new Error('La foto es muy pequeña. Acerca la cámara y enfoca el fleje completo.');const canvas=document.createElement('canvas'),scale=Math.min(1,1400/img.width,1400/img.height);canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);let quality=.85,data=canvas.toDataURL('image/jpeg',quality);while(data.length>280000&&quality>.3){quality-=.1;data=canvas.toDataURL('image/jpeg',quality);}if(data.length>320000)throw new Error('La foto pesa demasiado. Recorta el encuadre al fleje.');let image=img;if(Math.max(img.width,img.height)>2200){const scan=document.createElement('canvas'),factor=2200/Math.max(img.width,img.height);scan.width=Math.round(img.width*factor);scan.height=Math.round(img.height*factor);scan.getContext('2d').drawImage(img,0,0,scan.width,scan.height);image=scan;}return {image,evidence:data};}finally{URL.revokeObjectURL(url);}}
 function rectangle(image,x,y,width,height){return {rectangle:{left:Math.round(image.width*x),top:Math.round(image.height*y),width:Math.round(image.width*width),height:Math.round(image.height*height)}};}
 async function read(image,lookup,onProgress=()=>{},signal){
  onProgress('Preparando lector…');const Tesseract=await load();if(signal?.aborted)throw new Error('Lectura cancelada.');
  const worker=await Tesseract.createWorker('spa',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@'+VERSION+'/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@'+CORE,langPath:DATA,logger:m=>{if(m.status==='recognizing text')onProgress('Leyendo fleje… '+Math.round(m.progress*100)+'%');}});
  let ended=false;const stop=()=>{if(!ended){ended=true;worker.terminate();}};signal?.addEventListener('abort',stop,{once:true});
  try{
   if(signal?.aborted)throw new Error('Lectura cancelada.');
   await worker.setParameters({tessedit_pageseg_mode:'3'});
   const full=(await worker.recognize(image)).data.text;
   await worker.setParameters({tessedit_pageseg_mode:'6'});
   const top=(await worker.recognize(image,rectangle(image,.048828125,.1058201,.69010417,.1957672))).data.text;
   await worker.setParameters({tessedit_pageseg_mode:'7',tessedit_char_whitelist:'0123456789'});
   let upc=(await worker.recognize(image,rectangle(image,.6184896,.8074074,.2734375,.0761905))).data.text;
   if('BarcodeDetector' in g){try{const detector=new g.BarcodeDetector({formats:['ean_13','upc_a','ean_8']}),found=await detector.detect(image),barcode=found.find(result=>/^\d{8,13}$/.test(result.rawValue));if(barcode)upc=barcode.rawValue;}catch{}}
   const item=(await worker.recognize(image,rectangle(image,.0455729,.7724868,.46875,.1269841))).data.text;
   if(signal?.aborted)throw new Error('Lectura cancelada.');
   return g.CYD56_CORE.parseFleje({text:full,top,upc:upc.trim()||full,item},lookup);
  }finally{signal?.removeEventListener('abort',stop);if(!ended){ended=true;await worker.terminate();}}
 }
 g.CYD56_FLEJE={photo,read};
})(window);
