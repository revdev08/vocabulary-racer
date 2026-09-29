# Dashword — imágenes promocionales para App Store

Entrega en español: **cinco piezas para iPhone y cinco para iPad**, con capturas integradas, titulares y beneficios. El ZIP contiene solamente los diez PNG finales en sus dos carpetas.

## Archivos para subir

- `es/iphone/`: 5 PNG RGB, sRGB, sin transparencia, **1284 × 2778 px**.
- `es/ipad/`: 5 PNG RGB, sRGB, sin transparencia, **2064 × 2752 px** (grupo de pantalla 13 pulgadas).
- `dashword-app-store-es.zip`: las dos carpetas anteriores.

Medidas ajustadas a los formatos indicados en App Store Connect por el usuario. El diseño se escala proporcionalmente, sin estirar textos ni capturas.

Orden: elegir traducción, obstáculos, niveles, repetición espaciada y pronunciación. No subir las vistas previas panorámicas: sirven solamente para revisar el conjunto.

## Procedencia y edición

Las pantallas son capturas de la versión web local del proyecto, con controles de desarrollo desactivados, a 440 × 956 y 1032 × 1376. No son capturas tomadas en un simulador nativo de iOS. Antes de publicar, contrastar las pantallas con la compilación que se enviará a revisión. La presentación de iPad conserva el ancho máximo y los márgenes laterales reales de la aplicación.

El fondo decorativo se generó con IA. Las capturas no se redibujaron: se integraron en una composición vectorial, con texto tipográfico y marco. Los textos promocionales no se limitan a un idioma ni prometen cantidades fijas de niveles, temas o palabras; el contenido puede variar según el idioma. Las capturas muestran el ejemplo español–inglés actualmente disponible. La pantalla de repaso muestra un resultado real de una partida de captura; las puntuaciones mostradas no son promesas comerciales.

`es/editable/` contiene las diez composiciones SVG autónomas. `es/sources/` conserva materiales de trabajo y tomas alternativas; no son piezas para subir a la tienda. `es/manifest.json` registra medidas y fuentes.

Para regenerar: `node marketing/app-store/build-posters.cjs` (requiere sharp; admite el runtime local de Codex). El generador verifica dimensiones y ausencia de transparencia.

