# Barrera de carretera

Asset individual: `assets/game/obstacles/barrier_road_orange.png`.

PNG RGBA de **512 × 512**, con márgenes transparentes. Una barrera portátil ancha y baja, franjas diagonales naranjas/blancas y dos apoyos inferiores. Sin escenario, sombra proyectada, texto ni otros obstáculos.

Creado con ImageGen integrado utilizando `assets/game/player/car_player_red.png` como referencia de cámara, iluminación y acabado. La herramienta generó un máster de 1254 × 1254; se exportó el lienzo completo a 512 × 512 mediante reducción bicúbica con alfa, sin recortar, alterar proporciones ni retocar el diseño. El máster original se conserva en la carpeta de imágenes generadas de Codex.

Comprobaciones: dimensiones exactas, formato RGBA, perímetro completamente transparente, espacio transparente entre soportes y debajo de la barrera. El asset se entrega por separado; no se implementan obstáculos ni colisiones en el juego.

## Prompt

```text
Use case: stylized-concept.
Asset type: ONE individual portable road barricade sprite for a premium stylized 3D mobile driving game.
Input image: the red car is a REFERENCE ONLY for the game's high-quality 3D rendering, slightly elevated camera, soft-edged forms, glossy solid materials, lighting direction and level of detail. Do not put a car in the output.
Object: one wide LOW portable road barrier sized to block a SINGLE lane. A simple thick horizontal rectangular warning board with broad, crisp alternating DIAGONAL ORANGE AND WHITE STRIPES, five or six broad stripes total for readability when small. Gently rounded corners and subtly beveled edges. Exactly TWO sturdy lower support legs, separated clearly beneath the board, each with a short stable front-to-back foot. Supports and feet entirely visible. Clean orange structural frame with dark charcoal-gray stable feet, solid molded/plated materials, restrained highlights, no exaggerated wear. Balanced, practical original design. Overall silhouette approximately 2.2 times as wide as it is tall including its supports. No extra upper rails or warning lights.
Camera: face of the warning board toward the approaching player. View straight-on from slightly above, compatible with the chase camera behind the referenced car. A modest amount of the top edge and foot depth is visible. Horizontally centered and geometrically symmetrical. No lateral tilt, no yaw, no isometric/three-quarter side view. Supports extend toward the bottom, barrier spans horizontally.
Render: polished stylized 3D, crisp edges, same clean daylight direction and soft bright highlights from upper left / overhead as the reference, subtle self-shading to show depth. Keep stripe colors saturated safety orange and clear white. Readable at small mobile-game sizes.
Composition: square PNG, target EXACTLY 512 x 512 pixels for delivery; canvas size independent of the reference. One complete barrier only, occupying approximately 84% canvas width, centered in both axes, generous transparent margin on all sides. No cropping.
Background MUST be genuinely transparent with alpha=0 outside the object, including the open gap between the two support legs. NO ground, NO floor, NO cast shadow or shadow blob below feet. Only self-occlusion on the actual object.
Exclude: road, cars, buildings, cones, additional barriers/obstacles, warning lamps, text, symbols, logos, labels, UI, motion blur, scenery, watermark. One asset, no collage, no multiple views, no obstacle collection.
```
