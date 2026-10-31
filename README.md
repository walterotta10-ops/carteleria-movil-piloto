# Cartelería C&D · V56

Agrega **Ver cartel** a Layout panorámico, escaneo con cámara a Cartelería manual y una maestra colaborativa para completar los productos que faltan.

## Actualizar Cloudflare

1. Descomprime `CYD-V56-ACTUALIZACION-CLOUDFLARE.zip`.
2. Abre el Worker actual y reemplaza su código por **CLOUDFLARE-CYD-V56-MAESTRA-COLABORATIVA.js**.
3. Conserva la D1 existente y su vinculación **DB**. Publica el código.
4. Recarga la app con **Ctrl + F5**. En el celular, cierra y vuelve a abrir la página.

No hace falta reinstalar el puente del PC ni volver a activar el usuario maestro. Se conservan las claves, sesiones, colas y promociones existentes.

## Layout panorámico y Cartelería manual

- Cada producto de Layout panorámico tiene **Ver cartel**. Abrirlo no selecciona el producto ni cambia la cola.
- En el celular, Cartelería manual incorpora **Escanear ítem o UPC**, con el mismo lector de cámara utilizado en la búsqueda de promociones.
- El botón amarillo **Ingresar datos de producto** abre un formulario con ítem, UPC, descripción, marca y unidad de medida.
- **Subir foto del fleje — Recomendado** aparece primero. Se puede tomar una foto del fleje completo o seleccionar una imagen. La lectura propone los campos y el usuario los revisa y confirma antes de enviar. También se pueden escribir los datos a mano.
- La información del producto y su contenido se utilizan en el cartel manual. El precio de la foto no se carga: quien crea el cartel ingresa el precio y la promoción.

La lectura se procesa en el navegador. La primera vez necesita conexión para descargar el lector y su idioma. La foto comprimida queda como evidencia privada para la revisión del usuario maestro; se retira al compartir o devolver el aporte. La cámara debe estar permitida en el navegador. La lectura automática de códigos depende de la compatibilidad del navegador, igual que en la búsqueda existente.

## EAN-13: completar el dígito verificador

Para una base EAN de 12 dígitos se alternan pesos **1 y 3** desde la izquierda. Se suman los resultados y se calcula el dígito que falta para llegar al siguiente múltiplo de diez:

`dígito = (10 - (suma % 10)) % 10`

La lectura del fleje puede completar los 12 dígitos cuando falta el verificador. El formulario también incluye **Completar EAN-13 desde 12 dígitos**. Los UPC de 12 dígitos que ya tienen una referencia exacta en la maestra se conservan; no se modifica masivamente la base anterior.

Con la foto enviada:

| Campo | Resultado verificado |
| --- | --- |
| Ítem | 412916, normalizado desde 000412916 |
| Base del EAN en el fleje | 780220013113 |
| Dígito calculado | 2: la suma ponderada es 58 y el siguiente múltiplo es 60 |
| EAN-13 completo | 7802200131132 |
| Descripción | FRUGELE HALLOWEEN |
| Marca | AMBROSOLI |
| Unidad | 360 g |

El artículo ya existe en la maestra. Este aporte completa su unidad de medida, sin crear otra ficha. El nombre y la marca se recuperan de la referencia existente, porque el OCR puede confundir letras. Calcular el verificador no prueba que todos los dígitos de la foto se hayan leído bien: los campos siguen siendo revisables.

Fuentes GS1: https://gs1chile.org/Codigos/Calculadora y https://www.gs1ie.org/tools-services/tools/check-digit-calculator/ . Implementación OCR basada en la documentación oficial de Tesseract.js: https://github.com/naptha/tesseract.js/blob/master/docs/api.md . Versiones fijadas: Tesseract.js 6.0.1, núcleo 6.1.2 y datos de español 1.0.0.

## Cómo se comparten los aportes

1. El local envía los datos confirmados. Quedan disponibles para su Cartelería manual y guardados para revisión. Si un UPC apunta a otro ítem, se pide revisión del maestro antes de utilizarlo.
2. El usuario maestro abre **Aportes de productos**, revisa la foto y los campos, corrige si corresponde y aprueba o devuelve. Los aportes coincidentes de varios locales se presentan juntos.
3. **Compartir revisados con todos** publica una sola ficha por ítem y UPC. Al aplicar la actualización semanal de promociones también se publican automáticamente los aportes ya revisados. Los que siguen pendientes no se comparten.

Los jefes de mercado pueden ingresar aportes para sus locales asignados. Solo el usuario maestro revisa y comparte la maestra global. Los nuevos datos complementan Cartelería manual; la actualización de promociones conserva su cruce y sus precios.

Las repeticiones del mismo envío no crean registros adicionales. La publicación utiliza revisiones y un lote atómico para evitar resultados parciales o duplicados cuando coinciden dos operaciones. Una ficha compartida más reciente prevalece sobre un aporte local anterior aún pendiente.

## GitHub y web

El respaldo de GitHub incorpora la misma V56. Hasta que Cloudflare tenga V56, la web conserva la interfaz compatible V55; después habilita los nuevos módulos. Las solicitudes de una página V55 abierta conservan sus recursos V55 durante la transición.

Para exportar nuevamente el JS desde el repositorio: `node tools/exportar-v56.cjs`.

Las pruebas se ejecutan con Node 22.13 o posterior: `npm install` y `npm test`. Incluyen los 13 scripts reales de la app, búsqueda por ítem/UPC abreviado, cálculo EAN, carga local, evidencia privada, revisión, deduplicación, publicación concurrente, integración semanal, cola manual con unidad de medida, vista previa sin selección, permisos, claves, actualización desde V55 e impresión maestra sin número de local ni Product Number. La foto proporcionada se probó con el lector real; las pruebas de interfaz usan cámara simulada. La cámara y la impresión físicas quedan para verificar en el celular y el PC del local.
