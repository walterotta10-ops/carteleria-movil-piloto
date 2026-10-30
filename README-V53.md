# Cartelería C&D V53

La V53 incorpora el usuario maestro Walter en PC, la vista de los 11 mercados y sus 128 locales, el detalle de interacciones y las cargas directas de promociones desde Excel o CSV.

Las cargas de listas admiten actualización completa y parcial. La carga de jueves compara el precio por unidad y la cantidad; se aplica cuando el precio baja o cambia la mecánica y conserva el precio antes de OCCAM.

Product Number se usa como referencia interna. OCCAM no contiene ítem: se recupera desde las bases verificadas. Por producto y lista se conserva la primera barra. Si no se recupera un ítem, el cartel se imprime sin ese campo. No se usa CID ni Product Number para reemplazarlo. Las listas conservan su separación.

Los carteles impresos desde Walter no incluyen su nombre, número de local ni Product Number. El formato de impresión V52 se conserva y la cola de Walter no se cuenta como actividad de un local.

El acceso maestro requiere la activación privada del PC. Escribir Walter sin esa activación no permite consultar los mercados ni cargar promociones. El código público solo contiene el verificador criptográfico de la activación. El archivo privado de activación no pertenece a este repositorio.

## Activación de la versión

1. Exportar el Worker con `node tools/exportar-v53.cjs`, o usar el JS incluido en el paquete de actualización.
2. Reemplazar el código del Worker existente `carteleria-puente-carta` y desplegar, conservando su vínculo `DB`.
3. La web de Render activa la interfaz V53 cuando el puente responde con V53. Hasta entonces conserva la interfaz V52.
4. Abrir el archivo privado de activación desde el PC de Walter. Después puede ingresar escribiendo Walter en el acceso habitual.

La actualización conserva las tablas anteriores y los eventos históricos. Crea tablas nuevas para promociones, versiones e interacciones. Las cargas requieren revisión antes de aplicarse y guardan la versión anterior. Las estadísticas cuentan solicitudes enviadas a imprimir, sin confirmar salida física en papel.

## Base inicial recibida

- OCCAM: 1.827 filas, 1.775 referencias por lista luego de conservar la primera barra.
- Reporte de jueves: 1.101 filas, 952 Product Number únicos; genera 22 cambios de promoción.
- 1.677 referencias OCCAM con ítem recuperado; 98 se permiten sin ítem.
- 1.766 referencias OCCAM imprimibles. El archivo de revisión distingue los carteles que imprimen sin ítem y las 9 referencias con otros datos de precios, categoría o medida por revisar.
- Se conservan 361 carteles anteriores en sus campañas separadas.

Se corrigió el logo aCuenta: en V52 estaba codificado dos veces y se servía texto en vez de PNG. La V53 entrega la imagen correcta y cambia su referencia para evitar una copia antigua en caché.

Se verificaron las reglas de cruces, mecánicas, precios, cargas completas/parciales, permisos maestro, históricos, importación simultánea e idempotencia, la cola V52 y los carteles sin ítem. La lectura de ambos Excel se comprobó en Chrome.
