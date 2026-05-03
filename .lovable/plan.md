Entendido: tu prueba demuestra que Android no está borrando el GPS; el mismo archivo conserva los metadatos al volver al PC. El fallo está en cómo la app lee/parsea esos bytes en Android.

Do I know what the issue is? Sí, lo más probable es que el problema esté en la ruta de parseo de `exifr` en Android: ahora la app lee el `ArrayBuffer`, pero sigue usando `exifr.gps()` sin opciones configurables. Revisando la librería, `exifr.gps()` usa internamente un primer chunk fijo de 40KB. En algunas fotos el bloque EXIF/GPS puede quedar fuera de esa ventana o no resolverse correctamente en Android, aunque desktop sí lo maneje. La solución es dejar de depender solo de `exifr.gps()` y hacer una extracción GPS explícita, leyendo el archivo completo y con fallback manual.

Plan de implementación:

1. Mantener intacto lo que ya funciona en otros dispositivos
   - No cambiar `MapView`, el footer, el layout ni la lógica visual del mapa.
   - No cambiar el comportamiento de desktop/tablet salvo que se beneficien del fallback si algún archivo raro falla.

2. Reforzar solo la extracción GPS en `src/hooks/useImageStore.ts`
   - Leer el archivo como `ArrayBuffer` completo, como ya se hace.
   - Ejecutar primero una extracción GPS explícita con `exifr.parse(buffer, { ... })` usando:
     - `tiff: true`
     - `ifd0: true`
     - `exif: true`
     - `gps: true`
     - `mergeOutput: true`
     - `translateKeys: true`
     - `translateValues: true`
     - `reviveValues: true`
     - `chunked: true`
     - `firstChunkSize: file.size`
     - `chunkSize: file.size`
   - Esto fuerza a `exifr` a trabajar con el archivo completo, evitando el límite interno de `exifr.gps()`.

3. Añadir un parser GPS manual como fallback
   - Si `exifr` devuelve metadata pero no `latitude/longitude`, buscar campos GPS crudos como:
     - `GPSLatitude`, `GPSLongitude`
     - `GPSLatitudeRef`, `GPSLongitudeRef`
     - variantes con arrays DMS: grados/minutos/segundos
   - Convertir coordenadas DMS a decimal.
   - Aplicar signo negativo cuando la referencia sea `S` o `W`.
   - Validar rango: latitud `-90..90`, longitud `-180..180`, no `0,0`.

4. Probar varias rutas de entrada sin alterar el selector Android
   - Mantener el selector Android por `showOpenFilePicker` + fallback actual, porque ya ayuda a elegir desde Archivos.
   - En Android, si sigue sin GPS después de todos los intentos, mantener el toast en inglés, pero el mensaje ya no culpará a Android de “borrar” datos; indicará que la app no pudo leer GPS desde ese archivo en ese navegador.

5. Añadir logs de diagnóstico seguros solo para Android
   - Registrar en consola, solo en Android y sin imprimir datos sensibles masivos:
     - nombre/tamaño/tipo del archivo
     - si se leyó el buffer y su tamaño
     - qué estrategia encontró GPS: `full-parse`, `raw-dms`, `exifr.gps`, o ninguna
   - Esto permitirá verificar en el próximo reporte si el archivo llega completo y en qué paso falla.

6. Corregir warning de React en `MetadataPanel`
   - El log muestra un warning de Framer Motion/React por refs con `AnimatePresence` y `MetaRow`.
   - No parece ser la causa del GPS, pero lo limpiaré para evitar ruido durante las pruebas.

Después de aplicar esto, la app debería detectar el GPS en Android usando la misma imagen que ya funciona en PC, siempre que el archivo llegue completo desde el selector de Archivos.