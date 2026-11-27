#!/usr/bin/env python3
"""Actualiza solamente la maquetación Carta Horizontal de V1.7.9 (622)."""
import hashlib,json,pathlib,sys
src=pathlib.Path(sys.argv[1]); dst=pathlib.Path(sys.argv[2]); raw=src.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='259013227b3896bfef7f9f42f494ba079dc39e1d167995e6d7c99c31ab1e5b0d','Base diferente de V1.7.9 aprobada'
s=raw.decode('utf-8'); i=s.index('const G=')+8; g,_=json.JSONDecoder().raw_decode(s[i:]); a=g['/app.js']['body']
# Solo estilos del documento de impresión horizontal. No toca estilos 1/4 Carta.
css=r'''
/* V1.7.10 — precio protagonista, diseño maestro aprobado */
.price-block{top:12mm}
.price{font-size:94mm;font-weight:700;line-height:.94;letter-spacing:-1.2mm;display:flex;justify-content:flex-end;align-items:baseline}
.offer .price{font-size:88mm}
.nx .price{font-size:82mm;font-weight:700}
.standard-main-price .currency{font-size:.72em;margin-bottom:0;line-height:1}
.cyd83-price-run{display:inline-flex;flex:0 0 auto;align-items:baseline;gap:2mm;white-space:nowrap;transform-origin:right center}
.cyd83-price-run>*{flex:none}
.payment-line{margin-top:2mm}
.product-block{top:130mm}
'''
assert a.count('const cyd82HorizontalCSS=`')==1
end=a.index('`;',a.index('const cyd82HorizontalCSS=`'))
a=a[:end]+css+a[end:]
# Fit the real price, keeping the digit height and the original calculation. Reserve space for all metadata.
layout=r'''const poster=page.querySelector('.poster.horizontal'),price=page.querySelector('.price'),head=page.querySelector('.price-block'),product=page.querySelector('.product-block'),footer=page.querySelector('.poster-bottom');if(!poster||!price||!head||!product||!footer)continue;const run=document.createElement('span');run.className='cyd83-price-run';run.append(...price.childNodes);price.append(run);const name=product.querySelector('.product-name'),gap=head.querySelector('.promo-strip')?18:36;let size=parseFloat(getComputedStyle(price).fontSize),nameSize=parseFloat(getComputedStyle(name).fontSize);function arrange(){run.style.transform='none';const width=run.getBoundingClientRect().width;run.style.transform='scaleX('+Math.min(1,price.clientWidth/Math.max(width,1))+')';product.style.top=(head.getBoundingClientRect().bottom-poster.getBoundingClientRect().top+gap)+'px';}arrange();while(product.getBoundingClientRect().bottom>footer.getBoundingClientRect().top-12&&size>48){size-=2;price.style.fontSize=size+'px';arrange();}while(product.getBoundingClientRect().bottom>footer.getBoundingClientRect().top-12&&nameSize>18){nameSize-=1;name.style.fontSize=nameSize+'px';}'''
start=a.index("const price=page.querySelector('.price');",a.index('function cyd82HorizontalHTML'))
end=a.index('}setTimeout(function(){window.print()}',start)
a=a[:start]+layout+a[end:]
assert a.count('V1.7.9 SBA')==1;a=a.replace('V1.7.9 SBA','V1.7.10 SBA',1)
asset=s.index('"/app.js":',i); body=s.index('"body":',asset)+7; _,n=json.JSONDecoder().raw_decode(s[body:]);s=s[:body]+json.dumps(a,ensure_ascii=False)+s[body+n:]
assert s.count("version:'V1.7.9',servicio:")==1;s=s.replace("version:'V1.7.9',servicio:","version:'V1.7.10',servicio:",1)
dst.write_bytes(s.encode('utf-8'))
print(dst)
