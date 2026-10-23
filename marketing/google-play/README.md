# Dashword — ficha Google Play (español)

## Archivos para subir

- `es/icon-512.png`: icono 512 × 512, PNG de menos de 1 MB.
- `es/feature-1024x500.png`: gráfico destacado 1024 × 500, PNG sin transparencia.
- `es/phone/01` a `05`: cinco capturas promocionales 1080 × 1920 (9:16), PNG sin transparencia y menores de 8 MB. Subir en orden numérico.
- `es/listing-es.txt`: nombre, descripción breve y descripción completa.
- `es/preview.png`: vista conjunta para revisar; NO subir como captura individual.
- `es/editable`: composiciones SVG editables; NO subir a Play Console.
- `es/manifest.json`: dimensiones, pesos y procedencia de las imágenes.

El campo de vídeo puede quedar vacío. No se ha creado ni publicado un vídeo de YouTube.

## Procedencia y límites

Se conserva el icono configurado actualmente en la app. Los diseños se adaptaron de la campaña editable de App Store utilizando las capturas del proyecto sin modificar el contenido de las pantallas. No se han generado interfaces ficticias ni se han añadido elementos exclusivos de iOS. Los archivos de origen conservan su prefijo histórico `iphone`; no son capturas nuevas de la compilación Android instalada. Comparar visualmente con la versión Android que se vaya a publicar si su interfaz ha cambiado.

Los textos no prometen idiomas específicos, cantidades fijas de niveles, acceso gratuito permanente ni resultados garantizados. Se informa del acceso mediante suscripción y se omiten precios regionales fijos.

## Regenerar

`node marketing/google-play/build-assets.cjs`

Guía de Google: https://support.google.com/googleplay/android-developer/answer/9866151
