# Prompts de la ciudad móvil

Método: herramienta ImageGen integrada, sin CLI. Imagen de referencia: `assets/game/backgrounds/background_city_v3.png`. Ambos resultados se guardan en el proyecto; el fondo original permanece intacto.

## Fachadas — `assets/game/scenery/facades_city.png`

```text
Use case: stylized-concept.
Input image: style reference ONLY. It is the approved background of a driving game. We are making modular moving scenery matching its blue glass, pale limestone, clear daytime realistic premium architectural render style.
Output asset: an OPAQUE rectangular facade texture atlas, portrait 1024x1536, NOT a street scene. Orthographic front elevation, absolutely straight-on, zero perspective, no vanishing point. Two adjacent tower facades each filling EXACTLY one half of the canvas, full height from roof at top edge to ground at bottom edge. Left 512px panel: refined blue glass tower with pale limestone structural piers and dark mullions. Right 512px panel: warm pale limestone facade with inset dark blue reflective windows, varied architectural bays. Buildings 15 floors, same overall height. Lowest two floors have recessed dark glass lobby entrances, stone columns and a subtle horizontal canopy. Reflections softly suggest neighboring blue buildings, understated. Fine stone surface detail, crisp aligned window grids, gentle ambient occlusion, soft warm daylight. The texture must fill the canvas all the way to all four edges, no gaps, no padding, no background outside the two facades. Vertical seam at x512 is a straight stone column boundary.
Keep same quality and palette as reference, not cartoon. Do not include the street, sidewalks, trees, sky, cars, plants, people, signs, text, logos, UI, watermark. This is a game-ready texture that code will map onto projected building walls; do NOT paint perspective into this texture.
```

## Árbol — `assets/game/scenery/tree_planter.png`

```text
Use case: background-extraction.
Input image: style and subject reference, the approved city in a driving game.
Create ONE isolated street tree in its small rectangular pale gray concrete planter, matching the green sidewalk trees in the reference. Game sprite on TRUE TRANSPARENT ALPHA background. Only one tree and one planter, centered, entire silhouette visible, no clipping and very small margins. Portrait composition 1024 x 1536. Detailed realistic architectural-visualization finish, NOT cartoon. Fresh layered olive and golden green foliage, slender visible brown trunk, squared understated light gray stone planter with a small tuft of low green shrubs at its base. Mature small urban tree, canopy about twice as wide as planter, nice natural asymmetric branches. Clear daylight warm light from upper left, softly shaded right.
Camera: straight-on, slightly elevated 20 degrees, looking down enough to see top of planter and some upper leaf surfaces; vertical trunk upright. No ground plane, no cast shadow outside planter, no sidewalk, no buildings, no sky, no text, no border, no road, no other objects, no backdrop. Transparency between outer leaves and through branch gaps. Only tree and planter cutout.
```

