# C&D Cartelería móvil — versión sincronizada

Esta versión incorpora las correcciones de visualización y el flujo celular → computador.

## Qué cambia

- Pantalla inicial sin datos precargados: Nombre, Número de local y PIN.
- El mismo Nombre + Local + PIN recupera la misma cola desde celular o computador.
- El campo de ítem parte vacío y muestra `Ingresar ítem`.
- La previsualización móvil del cartel es compacta: el aire vertical se reserva solo para impresión.
- La miniatura de la cola usa una composición propia y limpia.
- La impresión se mantiene en A4 2×2 y se elevan código de barras, vigencia y metadata para evitar cortes en la segunda fila.
- Se conserva la base de 30 productos.

## Sincronización piloto

El repositorio crea un segundo servicio Render llamado `carteleria-movil-piloto-sync`.
El sitio existente `carteleria-movil-piloto` consulta ese servicio para guardar la cola.

### Importante

En esta etapa la sincronización del servidor usa almacenamiento de archivo temporal de Render. Sirve para validar el flujo entre celular y computador, pero Render puede borrar esa información si el servicio se reinicia o se vuelve a desplegar. Antes de uso operativo permanente hay que conectar una base persistente (PostgreSQL/Supabase/Render Postgres).

## Render

El `render.yaml` conserva el sitio estático actual y agrega el servicio Node de sincronización.
Al subir los archivos al mismo repositorio, el Blueprint debería detectar el nuevo servicio y pedir crear `carteleria-movil-piloto-sync`.

## Prueba recomendada

1. Abrir el sitio desde el celular.
2. Ingresar Nombre, Número de local y PIN.
3. Agregar 2 o 3 carteles.
4. Abrir el mismo sitio desde un computador.
5. Ingresar exactamente las mismas credenciales.
6. Verificar que aparezca la misma cola.
7. Imprimir desde el computador.
