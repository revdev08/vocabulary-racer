# Generación del fondo urbano

Herramienta utilizada: `image_gen` integrada, sin CLI ni API externa configurada por el proyecto.

Asset actual: `assets/game/backgrounds/background_city_v3.png` (1024 × 1536). Se conservan v2 y el fondo original. La imagen incluye únicamente el entorno; la carretera jugable, los textos, portales, HUD y carro siguen renderizados por la aplicación.

## Adaptación al encuadre de tres carriles — v3

Edición integrada de `background_city_v2.png`, mediante `image_gen`, sin CLI. Se pidió una cámara más elevada conservando arquitectura, materiales e iluminación. El código utiliza el punto de fuga observado del resultado (49,6% / 44,1%), no las coordenadas solicitadas en el prompt. Pendiente aproximada del borde del asfalto: 0,47 píxeles horizontales por cada píxel vertical.

```text
Use case: precise-object-edit.
Edit target: the supplied city background for an existing driving game. Create a sibling camera-corrected environment plate. Preserve this exact premium realistic game art style, blue glass and warm pale limestone architecture, clear daytime lighting, restrained green trees, centered straight urban canyon and crisp layered depth.
CHANGE CAMERA / STREET FRAMING: raise the camera substantially, to approximately 22 meters above the avenue, looking forward with a gentle downward angle. The driving game now fits ALL THREE playable lanes within the screen. The asphalt must therefore be a much narrower central wedge with sidewalks and grounded lower building facades still visible along BOTH sides almost to the bottom. This is a three-lane urban street, NOT a broad boulevard, no additional empty asphalt shoulders.
Portrait 1024 x 1536 composition. Centered vanishing point near pixel (512,550). Left curb must run as a straight ray from (512,550) toward (65,1536), right curb toward (959,1536). Thus at y1000 asphalt extends only from x308 to x716; at y1400 from x127 to x897. Keep the street narrower than the input throughout the lower half. Buildings rise upright behind narrow sidewalks, camera above street-level trees. Continuous dark slate asphalt around #394450, subtle low-contrast fine grain, no large decorative shadows across street. Sidewalks and buildings directly border these rays. Dense midground architectural layers remain clear. Minimal natural haze only at the tiny distant vanishing point, no fog stripe.
Environment plate ONLY. Do not draw the three lane markings: the application draws those in code. NO road markings, NO white curb paint, NO cars/vehicles, NO people, NO signs/text/billboards, NO portals, NO UI, NO icons, NO watermark. Do not change architectural style or color palette.
```

## Historial de v2

Se generó una avenida y se realizaron dos ajustes de altura de cámara. El último resultado se encuadró en código usando su punto de fuga observado, no las coordenadas solicitadas al generador.

## Prompt inicial

```text
Use case: stylized-concept.
Asset type: standalone background plate for an existing premium 2.5D mobile driving game, portrait image, 1024 x 1536 composition.
Primary request: a much deeper, beautifully art-directed modern urban avenue, replacing a flat overly foggy city backdrop. This is ONLY the environment, not a screenshot or UI mockup.
Scene: a straight broad empty avenue through a dense modern city canyon. Tall realistic blue glass and warm pale limestone buildings tightly frame both left and right edges; several distinct layers of buildings step back toward a long central corridor. Refined architectural detail, recessed dark street-level storefronts WITHOUT signage, sidewalks, subtle low greenery at the outer edges. All buildings visibly grounded. Cool shaded lower facades, gentle sunlight on upper edges, clear pale blue sky. High-end polished realistic game environment / architectural visualization, crisp high resolution, controlled contrast and saturation.
Camera and composition: perfectly centered one-point perspective, no tilt or curve, fixed camera looking straight ahead from slightly above a car. The exact avenue vanishing point is at horizontal 50%, vertical 40% of the image. Tall foreground facades crop into the top corners; a narrow comfortable opening of sky remains in the upper center. Strong receding lines from building bases and sidewalks lead toward that one vanishing point. Midground side facades remain distinct at and BELOW the horizon; do not dissolve their bases into fog. Road edges should approximately run from the vanishing point to the left/right image edges at vertical 73% of image height. Keep the lower center a continuous plain desaturated dark slate asphalt surface, similar to #404953, for the app's separately rendered three-lane roadway to cover. The bottom quarter is calm, dark and low-detail so a red car can be added by code. Sidewalks only outside the main road, no central median, no cross streets.
Lighting: bright clear daytime with subtle warm highlights, atmospheric depth only in the very far distance. NO horizontal fog band, NO blue glow on the ground, NO milky white fade, NO overexposure, no sunrise glare. Use occlusion and layered architecture for depth, not fog. Small distance haze only at the tiny vanishing point.
Constraints: NO cars or any vehicles, NO people, NO road markings or painted lane dividers, NO signs, NO traffic lights, NO words, NO text, NO logos, NO billboards, NO portals, NO game controls, NO icons, NO HUD, NO watermark. Do not generate the red player car or any UI. Deliver only the opaque environment background plate.
```

## Prompt final de ajuste de cámara

```text
Use case: precise-object-edit.
Edit target: supplied empty city avenue background.
Preserve all the style, architecture, clear daylight, colors, visual quality and absence of fog, cars, people, road markings, text and UI.
One camera correction: LOWER the camera from the very high viewpoint in the source to an intermediate height of 8 meters. Still look straight ahead symmetrically. This should make the asphalt avenue wider in the lower half while keeping the vanishing point at horizontal center, approximately y650 on the 1024x1536 canvas.
Exact framing target: the asphalt curbs should now reach the LEFT and RIGHT image edges at y1150, NOT y1400 as in the input. At y900 the left asphalt edge is approximately x256 and the right edge x768, with grounded buildings and sidewalks outside them. At y1100 there should be just small strips of sidewalk near the edges. The entire lower quarter y1152..1536 is uninterrupted plain charcoal asphalt. Road not especially wide in world space, just camera projection changed. The slope of each curb from the vanishing point is approximately 1 horizontal pixel for 1 vertical pixel.
Retain the tall layered city canyon, subtle foliage and dark shaded lower facades. Keep architecture standing upright. No new objects, NO markings, no white edge paint, no vehicles, no people, no labels, no signage, no HUD. Environment plate only.
```
