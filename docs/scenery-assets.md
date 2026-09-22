# Casas mediterráneas — 2026-09-22

Assets generados con la herramienta integrada ImageGen, sin API/CLI adicional. Archivos finales utilizados por el juego:

- `assets/scenery/townhouse.png`: casa alta con balcón, tejas y buganvilla. RGBA, 1024 × 1536, transparencia verificada.
- `assets/scenery/villa.png`: villa de dos pisos con balcón de madera y naranjo. RGBA, 1145 × 1374, transparencia verificada.

No se utilizan las variantes descartadas con damero incrustado. El fondo transparente se comprobó leyendo el canal alfa, además de la inspección dentro del juego.

## Prompt de townhouse.png

Use case: stylized-concept. Production game sprite, one isolated Mediterranean coastal townhouse for the LEFT side of a forward-driving mobile game road. Genuinely transparent alpha background, no backdrop or checkerboard drawn. Show entire house uncropped including tiny base contact shadow. Charming high-quality stylized 3D render, cream stucco three-story narrow townhouse, warm terracotta tiled sloping roof with individual tile detail, teal wooden shutters, recessed windows, small wrought iron balcony with green plants, arched wooden front door, terracotta pots and climbing bougainvillea. Perspective is rear chase-camera looking forward along a street: house is at left of street, viewer sees its broad FRONT facade on image right facing the roadway and a narrower shaded LEFT side wall. Camera slightly above ground looking down modestly, straight verticals, NOT top-down isometric, NOT frontal flat icon. Warm sunshine upper left, soft ambient shading, crisp clean silhouette, rounded refined shapes, appealing premium casual driving game art, realistic architectural proportions but simplified game textures. House occupies 85% canvas height, centered in portrait 2:3 canvas. No road, sidewalk strip, sky, mountains, ocean, people, cars, text, labels, border, logo or watermark. Only house, attached plants, very small transparent soft contact shadow.

## Prompt de villa.png

An isolated Mediterranean coastal villa game asset on a transparent background. Full compact two-story pale warm cream house, terracotta tile roof clearly visible from an elevated camera 25 degrees looking down, soft rounded premium 3D casual game rendering. Three teal shuttered windows, small wooden balcony, orange tree in terracotta pot, arched door, narrow side wall receding to image left, broad sunlit facade faces the street on image right. Entire building fits uncropped with small transparent padding. Crisp clean silhouette. No text, no street, no landscape, no sky, no floor or cast shadow beyond the footprint. Actual transparent PNG alpha outside building. Architectural style like a polished Mediterranean driving game, detailed roof tiles, subtle stucco and soft ambient occlusion. Portrait canvas.

## Integración

`Scenery.tsx` renderiza los PNG reutilizados. Nueve posiciones del recorrido alternan las dos variantes con separaciones no uniformes. La base se proyecta junto al borde izquierdo de la carretera. Casas, postes y marcas comparten un reloj Animated con interpolación de profundidad; se reciclan fuera del campo útil. Las palmeras ocupan el paseo marítimo derecho.

La escena deja de usar setState/requestAnimationFrame para cada fotograma. Los transforms y la opacidad utilizan el native driver en móvil. Web usa la implementación de Animated correspondiente. No se afirma un FPS concreto: sigue pendiente el perfilado en teléfonos reales.

El carro tiene vista trasera, suspensión leve, inclinación al cambiar de carril y reacción a resultados. Reducir movimiento del sistema desactiva los efectos secundarios del vehículo. La pausa detiene el recorrido.


## Road-facing revision — 2026-09-22

Active sprite: `assets/scenery/roadside-house-v2.png` (1312 × 1199, RGBA, verified alpha 0–255). Generated with the built-in imagegen tool. Original townhouse/villa files retained. The runtime projects its long facade along the left shoulder, scaling its width relative to viewport aspect ratio; this remains a 2D sprite approximation, not a 3D mesh.

Final generation prompt:
> Use case: stylized-concept. Create ONE isolated Mediterranean roadside house sprite for a mobile forward-driving racing game. Genuine transparent RGBA background. Cream stucco, terracotta tiled roof, teal shutters, small balcony and flower pots, polished detailed 3D game art, no emoji aesthetic. Crucial camera geometry: house sits LEFT of a straight road; its long decorated facade faces RIGHT toward that road and is viewed obliquely, its foundation and eaves run steeply from LOWER LEFT toward UPPER RIGHT, receding toward a distant vanishing point on the UPPER RIGHT. Show narrow near end wall at left and long road-facing wall on right, roof visible from moderately elevated chase camera. Do not show a broad front-facing symmetrical facade. Entire building isolated, tight framing, tiny foundation only, no street, no surrounding landscape, no sky, no text, no checkerboard painted into image. Sunlight upper left. Architectural perspective, vertical walls remain vertical.

The car uses the user-supplied `assets/basic-main-car.png` unchanged. Layout compensates for transparent margins; steering, suspension and impact animations remain. Signs use code-native borders and supports; both options start blue, correct answers turn green after evaluation and selected wrong answers turn red. Lane dashes shear to match the exact divider slope. HUD uses vector controls and segmented lives, not emoji icons.


## Layout correction — 2026-09-22

Supersedes the viewport-dependent house compression above: preserve the original 1312:1199 sprite ratio and use contain mode. Four houses per nine-second scenery cycle (2.25-second spacing), anchored entirely outside the road; eighteen dash pairs and seven post pairs maintain roadside rhythm. House heights alternate 190/220 world units. This is a 2D scenic approximation.

Choice cards now float 22 units above the ground with translucent blue glass, diagonal highlights and cyan borders. Removed all feet, ground chevrons and shadows under the choices. Slight hover motion during approach; 650ms expansion/fade after evaluation, respecting pause. No new raster assets.
