# Fotogramas de cambio de carril

Generados con la herramienta integrada `image_gen`, usando exclusivamente `assets/game/player/car_player_red.png` como referencia maestra. Son dos generaciones independientes, sin reflejar horizontalmente una para obtener la otra.

## Archivos entregados

- `assets/game/player/car_player_red_left.png`: giro sutil hacia la izquierda, solicitado de 9°.
- `assets/game/player/car_player_red_right.png`: giro sutil hacia la derecha, solicitado de 9°.

Ambos archivos son PNG RGBA de **1254 × 1254 px**, el mismo lienzo que el original. La herramienta conservó la resolución de la referencia, aunque el prompt mencionaba 1024 × 1024. Se copiaron sin reescalado ni modificaciones posteriores y se comprobó la igualdad SHA-256 con las salidas generadas.

La transparencia se verificó leyendo el canal alfa (rango 0–255 y aproximadamente 46.6 % de píxeles completamente transparentes en ambos). Para alfa mayor que 32, la silueta original ocupa `(40, 208, 1213, 1034)`, la izquierda `(67, 205, 1240, 1038)` y la derecha `(25, 207, 1203, 1042)`. El borde inferior visible varía 4 y 8 píxeles respecto al original. Los dos vehículos permanecen completos dentro del lienzo.

Se revisaron visualmente las dos orientaciones, la predominancia de la vista trasera, las luces, el alerón, los retrovisores y los cuatro escapes. El sprite original se conserva como pose recta. Los dos fotogramas están integrados en la [animación de cambio de carril](player-turn-animation.md).

## Prompts finales

### Izquierda

```text
Use case: precise-object-edit.
Asset type: ONE additional animation sprite for an existing mobile driving game.
Input image 1 is the MASTER EDIT TARGET: the existing red player's car. This is the same individual car, not a design reference for a new car. Make a faithful minimal 3D pose edit.
Scene: genuine transparent background, PNG with alpha=0 outside the car. No background color or painted checkerboard.
Keep the exact distinctive body shell and proportions, glossy bright red paint, original angular red LED rear lights, integrated rear spoiler and its supports, both mirrors, rear window with dark glass, roof and small roof fin, black diffuser, exactly FOUR round exhaust outlets in two pairs, the same wheels and tires. Keep the blank body-colored license recess blank. Preserve the same light source direction and quality, with highlights moving only as physically required by the subtle yaw.
Camera is fixed in the exact same rear elevated position and distance as the master, aimed at the car. Keep camera roll and pitch unchanged. The rear view must strongly dominate, with only a very narrow suggestion of a side; not a pronounced three-quarter or side view. No image-plane tilt, no banking, no stretching, no horizontal mirroring, no fake 2D rotation.
Composition: one whole centered car, square 1024 x 1024 canvas with real transparent margins. Match the master's normalized framing: roof approximately y=17% of canvas; tire contact baseline approximately y=82.4%; car center x=50%; car width approximately 93% of the canvas. Preserve apparent car height, distance and scale; do not zoom or recrop tightly. Both rear wheels visible and their contact heights approximately equal, preserving a horizontal support plane. Vehicle points toward the top of the canvas.
No road, ground, cast ground shadow, buildings, other cars, smoke, exhaust flames, nitro, motion blur, text, logos, brands, watermark, labels, UI, collage or additional views. Only ONE complete car in the image.
ONLY REQUESTED CHANGE: turn the actual car subtly 9 degrees about its vertical axis to perform a gentle LEFT lane change. Its FRONT/NOSE points slightly toward the LEFT of the image, compared with its rear. Keep the body upright and rear-dominant. The tail, roof and window should show a small coherent genuine perspective yaw toward LEFT. Not a right turn. Preserve the master identity and framing.
```

### Derecha

```text
Use case: precise-object-edit.
Asset type: ONE additional animation sprite for an existing mobile driving game.
Input image 1 is the MASTER EDIT TARGET: the existing red player's car. This is the same individual car, not a design reference for a new car. Make a faithful minimal 3D pose edit.
Scene: genuine transparent background, PNG with alpha=0 outside the car. No background color or painted checkerboard.
Keep the exact distinctive body shell and proportions, glossy bright red paint, original angular red LED rear lights, integrated rear spoiler and its supports, both mirrors, rear window with dark glass, roof and small roof fin, black diffuser, exactly FOUR round exhaust outlets in two pairs, the same wheels and tires. Keep the blank body-colored license recess blank. Preserve the same light source direction and quality, with highlights moving only as physically required by the subtle yaw.
Camera is fixed in the exact same rear elevated position and distance as the master, aimed at the car. Keep camera roll and pitch unchanged. The rear view must strongly dominate, with only a very narrow suggestion of a side; not a pronounced three-quarter or side view. No image-plane tilt, no banking, no stretching, no horizontal mirroring, no fake 2D rotation.
Composition: one whole centered car, square 1024 x 1024 canvas with real transparent margins. Match the master's normalized framing: roof approximately y=17% of canvas; tire contact baseline approximately y=82.4%; car center x=50%; car width approximately 93% of the canvas. Preserve apparent car height, distance and scale; do not zoom or recrop tightly. Both rear wheels visible and their contact heights approximately equal, preserving a horizontal support plane. Vehicle points toward the top of the canvas.
No road, ground, cast ground shadow, buildings, other cars, smoke, exhaust flames, nitro, motion blur, text, logos, brands, watermark, labels, UI, collage or additional views. Only ONE complete car in the image.
ONLY REQUESTED CHANGE: turn the actual car subtly 9 degrees about its vertical axis to perform a gentle RIGHT lane change. Its FRONT/NOSE points slightly toward the RIGHT of the image, compared with its rear. Keep the body upright and rear-dominant. The tail, roof and window should show a small coherent genuine perspective yaw toward RIGHT. Not a left turn. Preserve the master identity and framing. Generate this orientation freshly from the master, never mirror a left-turn sprite; keep illumination consistent with the master.
```
