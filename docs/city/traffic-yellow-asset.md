# Sedán compacto amarillo

Asset individual: `assets/game/traffic/car_traffic_yellow.png`.

Generado con ImageGen integrado usando `assets/game/player/car_player_red.png` como referencia de cámara, luz y acabado. No se modificó el carro del jugador ni se añadió tráfico a la simulación.

PNG RGBA; transparencia real comprobada en todo el perímetro. Un único vehículo completo, sin carretera, escenario, sombra en el suelo, interfaz, texto ni marcas.

Resolución solicitada: 1024 × 1024. Resolución efectivamente devuelta por la herramienta: 1254 × 1254. Un segundo intento explícito de ajuste de resolución también conservó 1254 × 1254; se guardó esta segunda generación, con el mismo diseño y márgenes, cuyo perímetro tiene alfa cero en todos sus píxeles.

## Prompt de generación

```text
Use case: stylized-concept.
Asset type: one standalone traffic-vehicle sprite for the same polished 2.5D mobile driving game as the reference.
Input image: red player sports car, reference ONLY for render style, exact rear camera orientation and elevation, lighting direction, framing scale, and detail level. Do not recolor or copy its sports-car body.
Subject: ONE original unbranded compact four-door YELLOW SEDAN, ordinary believable proportions, taller passenger cabin, modest narrow tires, clean bodywork, dark blue-black tinted windows, a conventional trunk, simple refined red rear lamps. Distinct from the red sports car: no rear wing, no widebody flares, no racing diffuser, no giant exhausts. Unmarked body, an empty plain license-plate recess with NO letters or emblem.
Camera and pose: DIRECTLY REAR VIEW, centered and left/right symmetrical, slightly elevated behind the car at the SAME HEIGHT and downward viewing angle as the reference. See the roof, rear window, trunk and rear bumper in the same proportions of perspective as the reference. Zero yaw or roll, NOT a rear three-quarter view and NOT overhead top-down. Car faces AWAY toward the TOP of the image, rear bumper toward bottom. Both side mirrors visible and balanced.
Render: premium stylized 3D, matching the reference's crisp sculpted edges, glossy vivid paint, carefully controlled realistic reflections, dark glass and black rubber. Match the reference's upper-left / overhead daylight highlights. Yellow is rich warm yellow, not orange or lime green. Clean finished production game asset.
Composition: square PNG, target EXACTLY 1024 x 1024 pixels. Full single car including wheels and mirrors, centered. Comparable framing to the red car: vehicle approximately 90% of canvas width and 66% of canvas height, with clear transparent margins on all sides, approximately 16% above and below. Preserve normal sedan proportions; do not stretch to fill. No cropping.
Background: GENUINELY TRANSPARENT ALPHA, including around tires and mirror silhouettes. No solid-colored or checkerboard background. NO cast shadow or ambient shadow on any ground; only the car's own surface shading and self-occlusion.
Exclude: road, pavement, buildings, other cars, people, ground plane, propulsion jets or blue lights, smoke, motion blur, UI, text, logos, watermark. One car only, no collage, no contact sheet, no alternative views.
```

## Prompt final de ajuste (resultado seleccionado)

```text
Use case: precise-object-edit.
The supplied image is the FINAL APPROVED DESIGN of a single yellow compact sedan traffic sprite on transparent alpha. Preserve the complete car exactly: same original unbranded design, yellow paint, materials, rear camera pose and elevation, lighting, details, proportions, framing and transparent margins.
ONLY REQUIRED EDIT: deliver this same asset as a square PNG with EXACT output dimensions 1024 x 1024 pixels. The current source is 1254 x 1254; resample the whole canvas uniformly to 1024 x 1024, preserving aspect ratio. Do not crop, do not redraw or restyle, do not add anything.
Keep genuine transparent alpha outside the car, no background or ground shadow, no text or logos. Output one 1024x1024 image, not a collage.
```
