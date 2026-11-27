# Formato Maestro Tamaño Carta Horizontal — piloto local 622

Diseño visual aprobado el 27-11-2026. Base de integración: respaldo V1.7.8 (sin sustituirlo por V61).
Estado: especificación maestra aprobada; integración y validación del Worker pendientes. No desplegar este archivo en Cloudflare.

## Reglas
- Solo local 622 (normalizar 0622 a 622). Los otros locales mantienen su comportamiento.
- En Ingresar o escanear ítem y Cartelería Manual, ofrecer 1/4 Carta (predeterminado y sin cambios) y Tamaño Carta Horizontal (279,4 × 215,9 mm).
- Una hoja Carta horizontal por cartel. Mantener impresión exclusivamente en PC, validación de promoción, bloqueos, cola, y registro de impresión/reimpresión del flujo vigente. No contar vistas previas como impresiones.
- Blanco y negro, sin logos, cabeceras de campaña, fondos de color ni elementos gráficos nuevos. Precio y descripción alineados a la derecha, código de barras y datos operativos abajo a la izquierda, vigencia abajo a la derecha. Mantener la tipografía y reglas de datos de la aplicación.
- NxM: precio total de la mecánica, franja negra P. unitario / Ahorro; sin ahorro: sin franja negra; con ahorro unitario: franja negra Normal / Ahorro.
- El código de barras debe proceder del UPC real, mediante el generador vigente. No inventar datos ni vigencias.
- No cambiar D1, secretos, promociones, usuarios, permisos, medición EDLP/Lista, ni contador de reimpresiones 1, 2, 3.

## Referencias aprobadas
| Tipo | Precio | Franja | Descripción | Marca | Precio por unidad de medida | UPC | Ítem |
|---|---|---|---|---|---|---|---|
| NxM | 2x$3.000 | P. unitario: $1.850 / Ahorro: $700 | ATUN LOMITO AC 160 104GR | VAN CAMPS | $14.423 x KG | 7702367003900 | 753370 |
| Sin ahorro | $1.000 | ninguna | ATUN LOMITOS EN AGUA 140GR | SAN JOSE | $7.143 x KG | 7801235004534 | 5077776 |
| Ahorro unitario | $2.490 | Normal: $2.990 / Ahorro: $500 | SALSA SOYA 500 500CC | GOURMET | $4.980 x LT | 7802410400271 | 280613 |

## Validación antes de desplegar
Extraer el ZIP íntegro de V1.7.8, identificar el renderizador y los dos flujos de impresión reales, adaptar exclusivamente el tamaño horizontal, compilar el Worker y verificar sintaxis. Probar 622/otro local, los tres tipos, la impresión 1/4 Carta, el bloqueo móvil, la vigencia y los contadores. Confirmar impresión física Carta horizontal antes de ampliar a otros locales.
