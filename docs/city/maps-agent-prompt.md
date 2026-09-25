# Prompt: nuevos mapas a partir del mapa de ciudad

Copia todo lo que hay debajo de la línea y dáselo a tu agente. Está pensado para un agente que puede leer el repositorio, generar imágenes y editar código. Los prompts de imagen van en inglés porque los generadores responden mejor así.

---

Eres responsable de añadir **nuevos mapas (escenarios)** al juego Vocab Racer (Expo / React Native + Skia) que **encajen exactamente** con la cámara, la carretera y el estilo del mapa de ciudad actual. No cambies la jugabilidad, el motor, el HUD, los portales, el carro del jugador, el tráfico ni las barreras.

## 1. Antes de generar nada, estudia el mapa actual

Lee estos archivos y entiende qué dibuja cada uno:

| Pieza | Archivo | Qué es |
| --- | --- | --- |
| Fondo lejano | `assets/game/backgrounds/background_city_v3.png` + `src/game/world/CityBackdrop.tsx` | Placa opaca 1024×1536: cielo, entorno lejano y calle hacia el punto de fuga. Se registra con `scene.background` en `src/game/config/visual.ts` (punto de fuga 49,6 % / 44,1 %, pendiente del bordillo 0,47, `widthScale` 1,22). |
| Paredes laterales | `assets/game/scenery/facades_city.png` + `src/game/world/ScenerySurfaces.tsx` | Atlas opaco 1024×1536 con **dos alzados frontales planos** lado a lado (512 px cada uno), planta baja abajo, bordes izquierdo/derecho enlazables. Un shader los proyecta como paredes a ±2,75 carriles, módulos de 6 unidades, 18/20 de alto, visibles hasta 22 de profundidad. El mismo shader dibuja la acera procedural (colores fijos en SKSL) entre el bordillo (±1,54) y la pared. |
| Objeto de borde | `assets/game/scenery/tree_planter.png` + `src/game/world/RoadsideTrees.tsx` | Sprite RGBA 1024×1536 (árbol en jardinera), base centrada abajo, a ±2,12 carriles, alto 1,35, cada 1,2 unidades. |
| Asfalto | `assets/game/road/road_asphalt_tile.png` + `src/game/world/Road.tsx` | Solo se usa la luminancia como grano. El color del asfalto y de la bruma está fijo en el shader. |
| Parámetros | `src/game/config/scenery.ts`, `src/game/config/visual.ts`, `src/game/config/assets.ts` | Distancias en unidades de carril. La carretera jugable termina en ±1,5. |
| Temas por unidad | `src/game/data/journey.ts` | Cada unidad del recorrido ya tiene `theme: 'coast' \| 'city' \| 'mountain'`. |

Lee también `docs/city/background-generation-prompt.md` y `docs/city/background-visual-update.md`: explican cómo se generó y registró el fondo actual. **Lección clave de esos documentos: el generador nunca respeta las coordenadas pedidas. Hay que medir el punto de fuga y la pendiente reales de la imagen generada y registrar esos valores en la configuración.**

Sigue `AGENTS.md` (Expo SDK 57: consulta la documentación versionada antes de tocar APIs de Expo).

## 2. Arquitectura: convertir el mapa en un tema de datos

1. Crea `src/game/config/maps.ts` con un tipo `MapTheme` y un registro de temas. Cada tema define:
   - Assets: placa de fondo, atlas de paredes (izquierda y derecha pueden diferir), objeto de borde y, opcionalmente, un grano de asfalto.
   - Registro de la placa: punto de fuga medido, pendiente medida del bordillo, `widthScale`.
   - Por cada lado: si hay pared, a qué distancia lateral y con qué altura (0 = sin pared, p. ej. el lado del mar en la costa), y el material del suelo entre bordillo y pared (acera, hierba, arena, nieve…: colores, tamaño de baldosa y si hay juntas).
   - Colores del asfalto, de la bruma lejana y del cielo de respaldo.
2. Refactoriza `CityBackdrop`, `ScenerySurfaces`, `Road` y `RoadsideTrees` para leer esos valores como uniforms/props en vez de constantes. **El tema `city` debe verse exactamente igual que hoy**: compáralo con capturas de antes del cambio.
3. `GameWorld` debe cargar **solo** las texturas del tema activo. No cargues todos los mapas a la vez: la memoria y el tiempo de carga ya son altos.
4. Resuelve el tema desde el nivel: nivel → unidad del recorrido → `theme`. Amplía la unión de temas en `journey.ts` para los nuevos mapas y reparte los temas entre las unidades. El modo repaso usa `city`.
5. Rendimiento: nada de `BlurMask` sobre geometría que cambia en cada fotograma, ni capas nuevas a pantalla completa. Prefiere degradados y geometría fija con transformaciones.

## 3. Mapas a crear (uno por uno, empezando por la costa)

Haz primero **un mapa completo** (generar, medir, integrar, revisar), enséñame las capturas y solo después sigue con los demás.

1. `coast` (Costa mediterránea): a la izquierda casas encaladas / acantilado bajo con buganvilla; a la derecha un murete de piedra bajo con el mar turquesa detrás y un cabo lejano. Mediodía soleado.
2. `mountain` (Montaña alpina): bosque de pinos y paredes de roca a ambos lados; picos nevados en el punto de fuga. Luz de mañana clara.
3. `desert` (Cañón del desierto): paredes de arenisca, mesetas lejanas, tarde cálida. Tonos ocre y tostado apagados en la mitad inferior (el rojo es del carro del jugador).
4. `sunset` (Ciudad al atardecer): la misma avenida en hora dorada, con ventanas encendidas. Puede reutilizar la geometría de la ciudad con placa y fachadas nuevas.
5. `snow` (Pueblo nevado): casas de madera, montículos de nieve, luz suave. La nieve en sombra azulada; el cielo no puede ser blanco puro.

## 4. Regla de movimiento (la más importante)

**La placa de fondo es una imagen fija: todo lo que se vea de ella no se mueve.** Por eso solo puede mostrar lo que en la realidad casi no se mueve al conducir: cielo, montañas y mar lejanos, y lo que está más allá de unas 20 unidades. Todo lo cercano a la carretera (casas, rocas, arbustos, orilla, agua cercana, vallas) tiene que dibujarlo el motor: paredes, suelo, sprites o el plano de agua.

- En la ciudad funciona porque las paredes miden 18–20 unidades y tapan todo lo cercano.
- Si un lado tiene pared baja o no tiene pared, la placa queda al descubierto. En la costa esto dejó casas y rocas congeladas (ya corregido). Usa las opciones del tema:
  - `sky: true` muestra cielo estático sobre la línea de tejados.
  - `sea: {...}` dibuja agua en movimiento por debajo del paseo.
  - Si necesitas otro tipo de lado abierto (ladera, bosque, dunas), añade una capa del motor equivalente.
- Genera las placas con los laterales cercanos simples, ya que el motor los va a tapar.
- Comprueba cada mapa con una prueba como `coast near scenery moves with the road` en `tests/city/maps.test.cjs`: renderiza el shader en dos distancias y verifica que lo cercano cambia y lo lejano no.

## 5. Reglas de legibilidad (obligatorias en todos los mapas)

- **Franja superior (25 %)**: ahí van el HUD y la tarjeta blanca de la palabra. Nada de zonas blancas o muy claras detrás; usa cielo con color o valores medios.
- **Zona del horizonte**: ahí aparecen los portales con etiquetas blancas y borde cian. Evita blancos y cianes intensos en esa franja.
- **Carretera oscura** (pizarra, parecida a `#394450`): los coches de tráfico son amarillo, azul, blanco y verde y deben leerse bien.
- **El carro del jugador es rojo y debe ser el acento dominante**: nada de rojos/naranjas saturados en la mitad inferior.
- Sin coches, personas, texto, carteles, logos, marcas viales, semáforos ni UI en ningún asset.

## 6. Plantillas de prompts de imagen

Pasa siempre `background_city_v3.png` (o el asset equivalente del mapa de ciudad) como imagen de referencia de **cámara, encuadre, perspectiva y calidad**, no de paleta ni arquitectura.

### 6.1 Placa de fondo (opaca, 1024 × 1536)

```text
Use case: stylized-concept. Asset type: environment background plate for an existing premium 2.5D mobile driving game. Portrait 1024 x 1536, opaque.
Input image: the city plate is the master reference for CAMERA HEIGHT, FRAMING, ONE-POINT PERSPECTIVE, RENDER QUALITY and polish. Do NOT copy its architecture or palette.
Scene: {THEME DESCRIPTION}. A straight three-lane road recedes to a single vanishing point; the environment frames both sides and continues into layered depth.
Geometry (critical): perfectly centered one-point perspective, no tilt, no curve. Vanishing point at about pixel (508, 677). Both road edges are straight rays from the vanishing point: left edge toward (104, 1536), right edge toward (912, 1536); at y1000 the road spans x356..x660, at y1300 x215..x801. Environment (sidewalk, verge, wall, cliff, trees) begins immediately outside those rays. No extra shoulders or medians.
Road: continuous plain dark slate asphalt similar to #394450, fine low-contrast grain, no markings, no curb paint, no large shadows across it. The bottom quarter is calm and low-detail.
Light: {LIGHTING}. Depth from layered occlusion, only slight haze at the tiny vanishing point, no horizontal fog band, no bloom, no glare.
Readability: upper quarter of the image must not be white or very bright (a white UI card sits there); avoid bright cyan/white at the horizon; no saturated red or orange in the lower half.
NO cars or vehicles, NO people, NO animals, NO text, NO signs, NO billboards, NO logos, NO traffic lights, NO lane markings, NO UI, NO watermark.
```

### 6.2 Atlas de paredes laterales (opaco, 1024 × 1536)

```text
Use case: stylized-concept. Asset type: texture atlas for side walls of a 2.5D driving game, 1024 x 1536, opaque.
Two separate FLAT, perfectly FRONTAL orthographic elevations side by side, each exactly 512 px wide: left half = variant A, right half = variant B, same style and scale. No perspective, no vanishing lines, no sky, no ground plane: the bottom edge is the base at street level, the top edge is the top of the wall/facade.
The left and right edges of EACH half must tile seamlessly with themselves (the module repeats horizontally). Uniform lighting, no cast shadows from outside objects, no strong vignetting.
Content: {WALL DESCRIPTION, e.g. "sunlit cream stucco Mediterranean townhouses with teal shutters and bougainvillea" / "weathered granite cliff face with scattered pine roots" / "layered sandstone canyon wall"}. Match the rendering quality of the reference city facades.
NO text, NO signs, NO logos, NO people, NO vehicles, NO watermark.
```

### 6.3 Objeto de borde (RGBA transparente, 1024 × 1536)

```text
Use case: stylized-concept. Production game sprite, ONE isolated roadside object for a forward-driving mobile game. Genuinely transparent alpha background; no checkerboard painted into the image. Portrait 1024 x 1536.
Object: {PROP, e.g. "palm tree in a white stone planter" / "young pine tree with a rock at its base" / "tall saguaro cactus" / "snowy fir tree"}. Its base sits at the bottom center with a small transparent margin; the object fills about 95% of the height. Seen from slightly above and behind, like the reference tree-in-planter sprite, straight verticals.
Same premium polished render style and top-left sunlight as the reference. No ground patch beyond the base, no cast shadow, no text, no people, no vehicles.
```

## 7. Integración de cada mapa

1. Genera los tres assets y guárdalos en `assets/game/maps/<tema>/` como PNG (`backdrop.png`, `walls.png`, `roadside.png`). Hay una prueba que exige PNG: si cambias el formato, actualiza esa prueba.
2. **Mide** en la placa generada el punto de fuga real y la pendiente de los bordes de la carretera (por ejemplo con un script de Python/PIL, o comparando los bordillos del asfalto). Registra esos valores medidos en `maps.ts`, no los pedidos.
3. Verifica la transparencia del sprite leyendo el canal alfa (márgenes transparentes > 40 %, sin fondo pintado) y su caja opaca, igual que hacen las pruebas de los coches.
4. Ajusta los materiales del suelo y las paredes por lado hasta que la acera/arcén proyectado se una sin costura con la placa.

## 8. Verificación antes de darlo por terminado

- `node node_modules/typescript/bin/tsc --noEmit` y `node node_modules/eslint/bin/eslint.js src` sin errores (pnpm puede no estar en el PATH).
- Pruebas: `node node_modules/typescript/bin/tsc -p tsconfig.geometry.json && node --test tests/city/*.test.cjs`. Añade pruebas que validen cada tema (assets existentes, punto de fuga dentro de la imagen, pendiente > 0, paredes coherentes) y que cada nivel resuelva un tema. Ojo: 3 pruebas de `journey.test.cjs` ya fallaban antes de este trabajo por la importación del catálogo de 3000 palabras. No son regresiones tuyas; no las ocultes.
- Revisión visual en la versión web (`node node_modules/expo/bin/cli start --web`) a 320×568, 390×844 y 430×932, **para cada mapa**, con capturas de: tráfico en movimiento, una pregunta con los tres portales, y el carro en el carril derecho. Comprueba:
  - los bordillos de la placa coinciden con los bordes de la carretera;
  - las paredes no tienen costuras visibles;
  - los objetos de borde no flotan;
  - los portales, la tarjeta de palabra y el HUD se leen bien;
  - el tráfico se distingue;
  - no hay errores en la consola.
- El mapa de ciudad debe verse idéntico al actual (compara capturas de antes y después).
- Documenta cada mapa en `docs/city/maps/<tema>.md`: prompts finales usados, valores medidos y capturas, siguiendo el estilo de `docs/city/background-generation-prompt.md`.
- Trabaja en una rama nueva y haz un commit por mapa. Antes de seguir con el siguiente mapa, entrégame las capturas del primero.
