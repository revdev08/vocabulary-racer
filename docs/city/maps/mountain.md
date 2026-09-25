# Montaña alpina

Primer mapa de `maps-remaining-prompt.md`, terminado el 24 de septiembre de 2026. Desierto, atardecer y nieve quedan pendientes de la revisión grabada de montaña en un teléfono, como exige la entrega por etapas.

## Abrir y jugar

- Partida: `/race?level=descriptions`, nivel 9, «Describe tu mundo». La unidad 3, «Nuevos horizontes», usa montaña en los niveles 9–12. Las unidades posteriores siguen el ciclo existente.
- Vista de revisión: `/map-preview?map=mountain&pose=traffic`. El botón «Animar tráfico de prueba» permite inspeccionar el avance; «Detener vista de prueba» lo detiene. Solo está disponible en desarrollo.
- Capturas sin ese botón: añadir `&clean=1`; poses `traffic`, `question` y `right`.

## Arte y registro

Se generaron tres PNG de 1024 × 1536 con image_gen usando los assets de ciudad como referencias de acabado, cámara e iluminación. No se modificaron las imágenes de ciudad, costa, coches, HUD ni portales.

| Asset | Contenido | Verificación del alfa |
| --- | --- | --- |
| `assets/game/maps/mountain/backdrop.png` | Valle alpino, picos nevados azulados y cielo de mañana | Opaco |
| `assets/game/maps/mountain/walls.png` | Granito con musgo a la izquierda; pinos densos a la derecha | 10,449 % completamente transparente; mitad inferior sólida al umbral 0,5 |
| `assets/game/maps/mountain/roadside.png` | Pino joven con roca en la base | 63,603 % completamente transparente; límites visibles (157,29)–(870,1492) |

Medición reproducible: `node scripts/measure-mountain.cjs`. Los 21 pares de muestras de los bordes de carretera, entre y=800 e y=1300, y el análisis RGBA están en [mountain-measurements.json](mountain-measurements.json). Se midió el resultado generado: las coordenadas solicitadas en el prompt no se asumieron como correctas.

| Parámetro | Valor |
| --- | --- |
| Punto de fuga de la placa | (508,788228; 702,690421) px |
| Punto de fuga normalizado | (0,4968635; 0,4574807) |
| Pendientes izquierda / derecha | −0,813402597 / +0,813662338 |
| Pendiente media absoluta | 0,813532468 |
| Residuo máximo del ajuste | 1,29 px |
| Escala del fondo / separación del borde | 1,22 / 1,54 carriles |
| Atmósfera / bruma de carretera | 0,018 / 0,08 |
| Pared izquierda: distancia lateral / altura / módulo | 2,75 / 12 / 4 |
| Pared derecha: distancia lateral / altura / módulo | 2,75 / 7,5 / 2,5 |
| Variación de altura | 0 en ambos lados |
| Atlas / cielo | Mitad 0 izquierda, mitad 1 derecha; `sky: true` en ambas |
| Arcén | Grava gris parda; sin juntas; grano 0,16 |
| Bordillo | Piedra gris con textura que avanza en coordenadas del mundo |
| Repetición del entorno | 40 unidades |
| Pinos de borde | Altura 1,55; separación 2; desfase derecho 1; 14 por lado |
| Apoyo del sprite | 1492 / 1536 |

Cada mitad del atlas mide 512 × 1536: las relaciones 4 × 12 y 2,5 × 7,5 conservan exactamente su proporción 1:3. Se reflejan módulos naturales consecutivos para que se encuentren por el mismo borde y las crestas irregulares no den un salto. El período 40 coincide con las repeticiones de roca (8), bosque (5), grava y pinos.

## Movimiento y extensión del shader

El shader compartido admite alfa menor que 0,5 en las paredes: esas zonas muestran el cielo cuando `sky` está activo, o la placa cuando está desactivado. El filtrado pondera el alfa para evitar franjas oscuras en las copas. Las paredes opacas conservan su comportamiento.

La grava y el bordillo reciben grano procedural en coordenadas del mundo, con frecuencias atenuadas cuando su detalle es menor que un píxel. Esto evita que un arcén uniforme se perciba inmóvil. No se desplaza la placa completa: los picos y el horizonte permanecen fijos; roca, bosque, pinos, grava y carretera avanzan. No hay nuevas imágenes por fotograma, capas de desenfoque ni cambios a la simulación.

Se renderizó el shader real con `render-map-motion.cjs`, en distancias 3 y 3,55. El umbral de la prueba sigue siendo `staticShare < 0.05`.

| Tamaño | Bloques cercanos con textura | Bloques estáticos | staticShare | Evidencia |
| --- | ---: | ---: | ---: | --- |
| 320 × 568 | 186 | 0 | 0 | [A](previews/mountain-320x568-a.png), [B](previews/mountain-320x568-b.png), [máscara](previews/mountain-320x568-static.png) |
| 390 × 844 | 419 | 0 | 0 | [A](previews/mountain-390x844-a.png), [B](previews/mountain-390x844-b.png), [máscara](previews/mountain-390x844-static.png) |
| 430 × 932 | 501 | 0 | 0 | [A](previews/mountain-430x932-a.png), [B](previews/mountain-430x932-b.png), [máscara](previews/mountain-430x932-static.png) |

Las tres máscaras se inspeccionaron: están vacías, sin bloques rojos. Esta comparación de dos instantes es una regresión automatizada de movimiento, no una medición de FPS ni una garantía para cualquier dispositivo.

## Capturas con interfaz

| Tamaño | Tráfico | Pregunta | Carril derecho |
| --- | --- | --- | --- |
| 320 × 568 | [Ver](previews/mountain-320-traffic.png) | [Ver](previews/mountain-320-question.png) | [Ver](previews/mountain-320-right.png) |
| 390 × 844 | [Ver](previews/mountain-390-traffic.png) | [Ver](previews/mountain-390-question.png) | [Ver](previews/mountain-390-right.png) |
| 430 × 932 | [Ver](previews/mountain-430-traffic.png) | [Ver](previews/mountain-430-question.png) | [Ver](previews/mountain-430-right.png) |

Se revisaron visualmente los nueve estados. La nieve queda lejana y azulada; la zona cercana mantiene valores oscuros que permiten reconocer el coche rojo y los portales. En 320 px el texto auxiliar del HUD existente queda compacto: no se cambió porque el encargo excluye el HUD.

También se activó y detuvo la animación web: [instante A](previews/mountain-live-a.png) y [instante B](previews/mountain-live-b.png). Cambian las rocas, copas, árboles y tráfico mientras los picos mantienen su posición. La pestaña abierta tras finalizar el shader no registró errores de consola.

## Ciudad y costa

Se guardó primero la corrección previa de costa en el commit `83b5823`, separada de montaña y de los otros cambios locales del proyecto. Los parámetros y assets de esos dos mapas permanecen iguales.

La comparación anterior/posterior de ambos mapas, dos fotogramas por cada uno de los tres tamaños, produjo 11 PNG idénticos byte a byte de 12. En ciudad 430 × 932, fotograma A, solo cambia el rojo del píxel (37,214), de 70 a 71; diferencia numérica de un nivel sin cambio visual de composición. [Registro, hashes y rutas antes/después](mountain-regression.json).

| Mapa | 320 × 568 | 390 × 844 | 430 × 932 |
| --- | ---: | ---: | ---: |
| Ciudad staticShare | 0,011 | 0,022 | 0,019 |
| Costa staticShare | 0,014 | 0,029 | 0,029 |

## Verificación

- `node node_modules/typescript/bin/tsc --noEmit`: correcto.
- `node node_modules/typescript/bin/tsc -p tsconfig.geometry.json`: correcto.
- `node node_modules/eslint/bin/eslint.js src scripts`: correcto.
- `node --test tests/city/*.test.cjs`: 127 pruebas, 124 pasan; las 3 fallidas son las previas del catálogo en `journey.test.cjs` que ya identifica el encargo: numeración y claves de progreso, extensión del catálogo y paginación. No se ocultaron ni modificaron.
- Pruebas de mapas y montaña: 11 correctas, incluyendo alfa real de los PNG, proporciones, apoyo del sprite, repetición y compilación del shader con texeles por encima y debajo del umbral de transparencia.
- Exportación Expo de web, iOS y Android: correcta (`.qa/mountain-export`). Es una exportación de bundles, no una ejecución nativa.

Pendiente: grabación en iPhone/Expo Go, fluidez y estabilidad térmica en dispositivo, memoria y FPS medidos, posibles diferencias del shader en Metal/Android y observación prolongada del avance. No se afirma rendimiento medido. No iniciar desierto hasta revisar esa grabación.

## Prompts finales

### backdrop

Use case: stylized-concept. One opaque 1024x1536 portrait environment plate for an existing premium 2.5D mobile driving game. Reference image: the city plate is ONLY the master for elevated camera, centered one-point perspective, framing and polished render quality.
Scene: straight alpine valley road towards distant blue-grey mountain peaks with restrained pale blue snow. Crisp clear morning sunlight from upper left. Muted grey granite, low conifer forest along both verges. Near roadside vegetation/rocks MUST be LOW, below the horizon throughout both lateral edges, since moving cliffs and pine walls will be drawn over them by the game. The top half and lateral upper corners contain blue sky and only DISTANT mountain silhouettes, absolutely no tall foreground trees or cliffs. Mountains are distant, modest in height, layered and softly blue; no white peaks directly at road vanishing point.
Geometry: perfectly centered one-point perspective, no tilt or curve. Elevated camera matching reference. Vanishing point approximately (508,677). Straight asphalt-edge rays from vanishing point to (104,1536) and (912,1536), at y1000 road spans x356..660, y1300 x215..801. Narrow grey-brown gravel verges start immediately outside those edges, no extra shoulders, medians or fences.
Dark slate road #394450, fine low-contrast grain, no markings, no large shadows across it. Bottom quarter calm. Upper 25% medium saturated morning blue sky, never white. Muted horizon, no bright white or brilliant cyan behind future portals. Depth from layered occlusion, no fog stripe, glare, bloom or lens flare.
NO cars, people, animals, text, signs, logos, billboards, traffic lights, lane markings, UI or watermark. No buildings. One environment plate only.

### walls

Use case: stylized-concept. Production RGBA texture atlas for the side walls of an alpine 2.5D driving game. Exactly 1024x1536 portrait. The city facade reference establishes perfectly FLAT FRONTAL orthographic render quality ONLY, not architecture. Second city plate reference establishes polished game style only.
Two separate front elevation panels side by side, each EXACTLY 512 px wide: LEFT HALF grey granite rock cliff with natural cracks, modest moss and a few small rooted alpine pines along the irregular top crest; RIGHT HALF dense dark green alpine conifer forest seen from the side, overlapping pine branches and trunks, tree crowns forming an irregular silhouette along its upper edge.
Each panel fills its full bottom and both side edges with continuous cliff/forest material (NO side margins, NO individual floating objects). Bottom edge is street-level base, no ground plane. Texture must tile horizontally within EACH half: left and right edges of each half must match in silhouette height and material. Avoid seam-like vertical borders. Two narrow tall 1:3 elevations, never squeeze a whole wide landscape into a panel.
Top silhouette: transparent alpha ABOVE an irregular cliff crest/pine canopy. Roughly top 12–25% varies between completely transparent gaps and the tops of rocks/pines. Cliff and forest below silhouettes solid/opaque, no transparent holes deep in their lower half. NO painted sky anywhere, NO checkerboard, NO background color. Real transparent pixels around the upper crests, while the bottom remains filled. Orthographic, NO perspective, NO receding lines, NO cast ground shadow, NO external vignette.
Cool grey rock and restrained olive/blue-green forest. Upper-left morning light, readable middle-value surfaces, detailed but not noisy. No saturated reds, oranges or white snow. No road, cars, people, animals, text, signs, logos, UI, watermark. A single atlas containing precisely two texture panels.

### roadside

Use case: stylized-concept. One production isolated roadside sprite for an existing premium mobile driving game, 1024x1536 portrait PNG RGBA with genuinely transparent background. Reference tree planter is for polished 3D render quality, elevated frontal camera and upper-left sunlight ONLY. City reference is supporting overall render style.
Object: ONE slender young alpine pine with a small grey granite rock nestled at its base, no planter. Upright trunk, restrained dark olive/blue-green needles, natural irregular tiered branches. Entire tree and rock visible, centered. Slightly above frontal camera, compatible with driving camera behind a car. Narrow elegant silhouette, about 65% of canvas width; apex at y50, base at y1485 with transparent margins. At least 45% of pixels completely transparent.
Solid premium game render, coherent lighting, no painted backdrop, no checkerboard, NO soft glow or halo, no ground patch beyond the small rock, NO cast ground shadow. No snow, no bright white, no saturated red/orange. No vehicles, people, text, logos, road, UI, additional trees or collage. One pine-and-rock sprite only.
