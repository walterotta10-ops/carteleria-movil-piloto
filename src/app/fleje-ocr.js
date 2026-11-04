(function(g){
 'use strict';
 const VERSION='6.0.1',CORE='6.1.2',DATA='https://cdn.jsdelivr.net/npm/@tesseract.js-data/spa@1.0.0/4.0.0_best_int';
 let loader=null;
 function load(){if(g.Tesseract)return Promise.resolve(g.Tesseract);if(!loader)loader=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@'+VERSION+'/dist/tesseract.min.js';script.crossOrigin='anonymous';script.onload=()=>resolve(g.Tesseract);script.onerror=()=>{loader=null;script.remove();reject(new Error('No se pudo cargar el lector del fleje. Reintenta con conexión a internet o completa los campos.'));};document.head.appendChild(script);});return loader;}
 async function photo(file){if(!/^image\//.test(file.type)||file.size>20*1024*1024)throw new Error('Selecciona una foto de hasta 20 MB.');const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();if(img.width<400||img.height<200)throw new Error('La foto es muy pequeña. Acerca la cámara y enfoca el fleje completo.');const canvas=document.createElement('canvas'),scale=Math.min(1,1400/img.width,1400/img.height);canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);let quality=.85,data=canvas.toDataURL('image/jpeg',quality);while(data.length>280000&&quality>.3){quality-=.1;data=canvas.toDataURL('image/jpeg',quality);}if(data.length>320000)throw new Error('La foto pesa demasiado. Recorta el encuadre al fleje.');let image=img;if(Math.max(img.width,img.height)>2200){const scan=document.createElement('canvas'),factor=2200/Math.max(img.width,img.height);scan.width=Math.round(img.width*factor);scan.height=Math.round(img.height*factor);scan.getContext('2d').drawImage(img,0,0,scan.width,scan.height);image=scan;}return {image,evidence:data};}finally{URL.revokeObjectURL(url);}}
 function rectangle(image,x,y,width,height){
  const left=Math.max(0,Math.round(image.width*x)),top=Math.max(0,Math.round(image.height*y));
  const right=Math.min(image.width,Math.round(image.width*(x+width))),bottom=Math.min(image.height,Math.round(image.height*(y+height)));
  return right-left>=12&&bottom-top>=8?{rectangle:{left,top,width:right-left,height:bottom-top}}:null;
 }
 function yellowBand(image){
  const {width,height}=image,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const {data}=ctx.getImageData(0,0,width,height);
  const yellow=(i)=>data[i]>=100&&data[i+1]>=85&&data[i+1]>=data[i]*.63&&data[i+2]<=Math.min(data[i],data[i+1])*.55;
  let start=0,bestTop=0,bestBottom=0;
  for(let y=0;y<=height;y++){
   let count=0;
   if(y<height)for(let x=0;x<width;x+=3)if(yellow(4*(y*width+x)))count+=3;
   if(count>=width*.24)continue;
   if(y-start>bestBottom-bestTop){bestTop=start;bestBottom=y;}
   start=y+1;
  }
  const bandHeight=bestBottom-bestTop;
  if(bandHeight<30)return null;
  let left=width,right=0;
  for(let x=0;x<width;x++){
   let count=0;
   for(let y=bestTop;y<bestBottom;y+=3)if(yellow(4*(y*width+x)))count+=3;
   if(count>=bandHeight*.35){left=Math.min(left,x);right=x+1;}
  }
  const bandWidth=right-left;
  if(bandWidth<width*.25||bandWidth/bandHeight<1.6||bandWidth/bandHeight>8)return null;
  return {x:left/width,y:bestTop/height,w:bandWidth/width,h:bandHeight/height};
 }
 function cut(image,rect){
  const {left,top,width,height}=rect.rectangle,canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  canvas.getContext('2d').drawImage(image,left,top,width,height,0,0,width,height);
  return canvas;
 }
 async function read(image,lookup,onProgress=()=>{},signal){
  onProgress('Preparando lector…');const Tesseract=await load();if(signal?.aborted)throw new Error('Lectura cancelada.');
  const worker=await Tesseract.createWorker('spa',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@'+VERSION+'/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@'+CORE,langPath:DATA,logger:m=>{if(m.status==='recognizing text')onProgress('Leyendo fleje… '+Math.round(m.progress*100)+'%');}});
  let ended=false;const stop=()=>{if(!ended){ended=true;worker.terminate();}};signal?.addEventListener('abort',stop,{once:true});
  try{
   if(signal?.aborted)throw new Error('Lectura cancelada.');
   const band=yellowBand(image),framed=band&&(band.y>.15||band.w<.88);
   const region=(x,y,w,h)=>rectangle(image,band.x+band.w*x,band.y+band.h*y,band.w*w,band.h*h);
   async function recognize(rect,mode,whitelist=''){
    if(signal?.aborted)throw new Error('Lectura cancelada.');
    if(!rect)return '';
    await worker.setParameters({tessedit_pageseg_mode:mode,tessedit_char_whitelist:whitelist});
    return (await worker.recognize(image,rect)).data.text.trim();
   }
   const digits='0123456789';
   let top=await recognize(framed?region(.02,.10,.90,.51):rectangle(image,.048828125,.1058201,.69010417,.1957672),'6');
   if(framed&&top.includes('\n')){
    const description=await recognize(region(.06,.16,.59,.28),'7','ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ0123456789-.,& ');
    if(description.split(/\s+/).length>=2&&/[A-Z]{2}/.test(description)){
     const firstLine=top.split('\n')[0];
     // Conserva la línea completa cuando el recorte alcanzó solo parte del nombre.
     if(description.length>=firstLine.length-2)top=description+top.slice(firstLine.length);
    }
   }
   const upcRegion=framed?region(.63,1.69,.31,.15):rectangle(image,.6184896,.8074074,.2734375,.0761905);
   let upc=await recognize(upcRegion,'7',digits);
   if(framed&&!/\b(?:\d{12}|\d{13})\b/.test(upc))upc=await recognize(region(.60,1.64,.37,.23),'7',digits);
   const barcodeRegion=framed?region(.55,1.33,.44,.58):rectangle(image,.55,.68,.43,.24);
   if(barcodeRegion&&'BarcodeDetector' in g){
    try{
     const detector=new g.BarcodeDetector({formats:['ean_13','upc_a','ean_8']});
     const found=await detector.detect(cut(image,barcodeRegion));
     const codes=[...new Set(found.map(result=>result.rawValue).filter(code=>/^\d{8,13}$/.test(code)))];
     if(codes.length===1)upc=codes[0];
    }catch{}
   }
   const item=await recognize(framed?region(.02,1.59,.53,.27):rectangle(image,.0455729,.7724868,.46875,.1269841),'7',digits);
   if(signal?.aborted)throw new Error('Lectura cancelada.');
   return g.CYD56_CORE.parseFleje({top,upc,item},lookup);
  }finally{signal?.removeEventListener('abort',stop);if(!ended){ended=true;await worker.terminate();}}
 }
 g.CYD56_FLEJE={photo,read};
})(window);
