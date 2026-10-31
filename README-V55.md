# Cartelería C&D · V55

Agrega **Filtro Categorías** y los botones **EDLP / Lista Promocional** al Layout panorámico. Mantiene los accesos protegidos de V54 R1, las claves, las promociones y los formatos de impresión.

## Filtro Categorías

La tarjeta aparece en el inicio de los locales y jefes de mercado. El usuario maestro dispone de la misma vista en su menú lateral.

Al abrir, muestra la lista completa de promociones OCCAM vigentes, con 12 productos por página. Se puede elegir 10, 12 o 15. Cada promoción conserva su lista y su mecánica, aunque el producto participe en más de una lista.

| Filtro | Datos utilizados |
| --- | --- |
| Departamento | Columna Subgrupo del OCCAM, presentada con el nombre Departamento. |
| Categoría | Categoría del OCCAM. Sus opciones se ajustan al departamento y tipo de cartel. |
| Cartel rojo · EDLP | EDLP, EDLP Extensión y EDLP MMPP. |
| Cartel amarillo · Lista Promocional | Bodegazo 3, Lista 4 y Tráfico 3. |
| Lista | Permite elegir una lista específica dentro del grupo seleccionado. |
| Buscar producto | Nombre, marca, ítem, UPC o referencia interna de producto. |

Los dos botones representan los carteles enviados como referencia: rojo **BARATO todos los días** y amarillo **Ahora más BARATO**. La opción **Todas las listas** restablece ambos grupos.

La tabla muestra producto, identificación por ítem/UPC, departamento, categoría, lista y precio vigente. Cuando no hay ítem verificado, muestra el UPC y permite agregar el cartel si los demás datos están completos. Product Number se usa para la búsqueda y el cruce; no reemplaza el ítem ni se imprime.

Se puede seleccionar una página o **todo el resultado filtrado**, por ejemplo una categoría que ocupa varias páginas, y enviarlo a la cola. Al cambiar los filtros se reinicia la selección, sin alterar los carteles que ya están en la cola. Antes de enviar se verifica la base vigente. Las colas conservan su límite de 1.000 carteles.

## Layout panorámico

El encabezado incluye **Selecciona la lista**, con los mismos botones rojo/amarillo y **Todas las listas**. La elección filtra los departamentos, categorías y productos del mapa. Se mantienen el zoom, la navegación, la selección por categoría y el envío a la cola.

## Locales, mercados y usuario maestro

- Los locales envían los carteles a su propia cola compartida móvil/PC y conservan el número de local en la impresión.
- Los jefes de mercado pueden revisar las promociones y elegir uno de sus locales asignados para enviarle carteles a la cola. El PC de ese local los imprime con su acceso habitual.
- El usuario maestro envía a su cola maestra. La impresión conserva la supresión de número de local y nombre de usuario.
- Se conservan las claves elegidas, la activación privada del maestro y las sesiones existentes de V54 R1. No se cambian las tablas ni la clave de cifrado de acceso.

## Actualizar Cloudflare

1. Descomprime **CYD-V55-ACTUALIZACION-CLOUDFLARE.zip**.
2. En el Worker actual, reemplaza el código por **CLOUDFLARE-CYD-V55-FILTRO-CATEGORIAS.js**.
3. Conserva la vinculación a la D1 existente con nombre **DB**. No borres ni reemplaces la base.
4. Publica y recarga la app con **Ctrl + F5**.

La interfaz de la web respaldada en GitHub se sirve desde su paquete V55. Los archivos privados se entregan después de validar la sesión contra Cloudflare. Los datos, las claves y las colas continúan en la misma D1. Esta interfaz es compatible con el backend protegido V54 R1; el enlace directo de Cloudflare recibe la nueva interfaz cuando publiques el JS V55.

El puente automático del PC y los formatos de carteles conservan el funcionamiento de V54 R1. Esta actualización no requiere volver a instalar el puente ni activar nuevamente el PC maestro.

## Respaldo y validación

`cyd-v55-bundle.cjs` contiene el Worker completo y sus recursos. Para reconstruir exactamente el archivo de Cloudflare:

```sh
node tools/exportar-v55.cjs
```

Pruebas con Node 22.13 o posterior:

```sh
npm install
npm test
```

Las pruebas incluyen acceso local/mercado/maestro, carga de los diez scripts reales, protección de datos y claves, correspondencia entre Subgrupo y Departamento, clasificación completa de las seis listas, paginación, envío de categorías de varias páginas, búsqueda con identificación verificada, productos sin ítem, filtros del Layout, cola maestra e impresión HTML sin número de local ni Product Number. También verifican el envío del jefe de mercado únicamente a sus locales, la actualización desde V54 R1 sin perder clave/sesión/cola y la interfaz de Render con backend V54 R1.

La hoja de estilos de impresión se conserva sin cambios. La impresión física debe comprobarse en el PC del local.
