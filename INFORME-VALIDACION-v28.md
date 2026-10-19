# Informe de validación — Cartelería móvil v28
**Proyecto:** Impresión de Cartel | **Fuente:** `data/campanas-22086-source.json` (response de 31 ítems).
**Alcance:** validación del generador y simulaciones controladas, **no** impresión en HP o Zebra real.

## Resultados de datos — Campaña 22086, Vinos 3X
- Registros: **31 / 31** cargados y verificables.
- Vigencia de origen: **01/01/2026 a 31/12/2026** (30 con fecha completa y 1 recuperado exclusivamente dentro de la misma campaña).
- Frase generada en **31 / 31**: **«Vigencia: del 01 de enero al 31 de Diciembre 2026»**.
- Mecánicas: **18 carteles 3x$6.990** y **13 carteles 3x$9.990**.
- Marca, descripción, ítem, código EAN-13 y categoría: verificados contra el response. **31 / 31** EAN-13 válidos.
- **31 / 31** precios por medida salen en **x LT** cuando el producto trae envase CC. Ejemplo: oferta de 3x$6.990 / (3 × 0,750 LT) = **$3.107 x LT** (redondeado al peso).
- Se conservan **modaPrice y sbPrice**. Para «P. unitario» y «Ahorro», el generador emplea **modaPrice** (como la etiqueta de referencia que se entregó); el precio de sala **sbPrice** se guarda como dato adicional. **Ocho registros** traen valores distintos en ambos campos y constan en `data/auditoria-listas.json`; ya no se sustituyen ni se mezclan.
- **Local del cartel:** SIEMPRE el número ingresado al abrir la aplicación. El `storeNbr` de extracción no bloquea listas ni modifica ofertas.

## Pruebas ejecutadas
1. Generación JavaScript: **31 / 31** carteles sin errores de validación ni fechas antiguas.
2. Navegación real en Chromium: ingreso de local -> menú de dos opciones -> layout -> Licores -> Vinos -> selección de 31 ítems -> cola -> impresión Carta simulada: **OK**.
3. Local **541** y cambio a **622**: los carteles muestran el número realmente ingresado: **OK**.
4. Cola antigua con vigencia julio-octubre y precio alterado: reemplazo automático por el ítem del catálogo activo: **OK**. Si el ítem no se identifica de forma única, se bloquea.
5. **Envío remoto Carta móvil simulado:** el JSON enviado al puente contenía **31 fechas exactas, 31 locales 541, 31 precios x LT**, 8 hojas Carta (31 carteles, uno de los 32 espacios vacío), sin «23 de julio» ni «x KG»: **OK**. NO se envió a un dispositivo real.
6. Pinza táctil simulada mediante eventos `touchstart` y `touchmove`: zoom del 100% al 200%: **OK**. Prueba física de dos dedos pendiente.
7. Importación nueva de campaña de prueba: importación de dos ítems sin mezclar campañas; fecha ausente heredada **solo de la misma campaña**; una campaña distinta sin fecha quedó bloqueada: **OK**.
8. Integridad de puentes: los archivos PowerShell HP Carta, Zebra RF y Worker Cloudflare están **sin modificar** respecto de la v26.

## Protecciones operativas
- El catálogo es la única fuente para la previsualización, cola y envío. No se leen valores de precios/fechas de una cola antigua.
- Si falta campo imprescindible, fecha comprobable, medida o EAN válido, se bloquea ese cartel con mensaje y se puede retirar de la cola.
- `tools/import-lista.cjs` analiza cualquier campaña completa que venga en el response y produce un informe. **Por defecto NO cambia datos**; `--apply` actualiza el catálogo tras revisar el informe. La importación no ocurre sola: requiere incorporar el archivo de campaña.
- La opción «Layout panorámico promociones» conserva un plano genérico sin identificación de local. Se ampliaron categorías de referencia del Excel; los conteos solo muestran listas realmente cargadas.

## Pendientes antes de imprimir una campaña completa
- Validar **una impresión Carta física** tras publicar la v28, incluyendo lectura de la vigencia y presentación del cartel.
- Verificar el navegador del celular haya actualizado los archivos. El encabezado muestra **«Cartelería · v28»**. Si se ve otra versión, NO imprimir.
- HP, Zebra, Cloudflare Worker y el envío real no se probaron desde este entorno. Se conservaron sus archivos de puente, pero la publicación y el equipo remoto requieren comprobación.

**Resultado:** código y datos **APTOS PARA PRUEBA CONTROLADA**, no se declara instalación/impresión real verificada.
