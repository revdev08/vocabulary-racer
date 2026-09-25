# Mapas: qué falta desde assets

Resultado del pase visual por código. Copia lo que hay debajo de la línea y dáselo a tu agente. Da por hecho todo lo de `maps-agent-prompt.md` y `maps-remaining-prompt.md`.

---

Ya existe un pase visual hecho por código sobre los 6 mapas. **No lo deshagas.** Todo está en `src/game/config/maps.ts`, `src/game/geometry/sceneryShader.ts`, `src/game/geometry/roadShader.ts` y `src/game/geometry/weather.ts`:

- `atmosphere`: perspectiva atmosférica. Paredes y arcenes se funden con `colors.fog` con la distancia.
- `light`: rampa de luz en las paredes, de base en sombra a cima al sol.
- `roadEdge`: arena, grava o aguanieve que invaden el borde del asfalto con forma irregular.
- `rows`: recorte de filas del atlas. En la nieve, el chalet de 6 plantas queda en 3 (se conservan 0–0,345 y 0,715–1).
- Material del suelo: ondas en la arena y brillos en la nieve.
- `weather: 'snow'`: nevada en el mapa de nieve.
- Proporciones y alturas: costa con módulo 1,5 (antes las casas salían aplastadas a la mitad), montaña con el acantilado a 6 (antes 12), desierto a 7 con módulo 2,35 (antes 14) y chalets de 5,67 con módulo 3.

**Regla nueva: los muros con cielo deben quedar por encima de la cámara.** La cámara está a unas 3,8 unidades de carril en móviles alargados. Si el punto más bajo de la cresta (el hueco más profundo entre tejados o árboles) queda por debajo, la línea de tejados cae bajo el horizonte y aparecen cortes con la imagen fija. Pasó con los chalets a 3,4 de alto; ahora miden 5,67, con módulo 3. La prueba `every sky wall keeps its lowest crest above the camera` lo mide leyendo el alfa del atlas. Diseña los atlas nuevos con los huecos de la cresta en el 20 % superior como mucho.

Lo que el código ya **no** puede arreglar es lo que falta en los propios dibujos. Tu tarea es generar estos assets. Mantén las reglas de siempre: medir el punto de fuga, proporción alto ≈ 3 × módulo, regla de movimiento y un commit por mapa.

## 1. Más variedad en los atlas de paredes (prioridad alta)

El problema más visible ahora es la **repetición**: con módulos estrechos, el mismo dibujo se repite cada pocos metros.

| Mapa | Qué generar |
|---|---|
| Costa | 3 fachadas de casa distintas (crema, ocre y rosa pálido; distinto número de ventanas, una con balcón corrido), todas de 3 plantas, frontales y enlazables. El murete sigue siendo una textura aparte. |
| Montaña | 2 paneles de roca diferentes (uno con repisa y matorral, otro con grieta y un pino), con cresta irregular transparente arriba. |
| Desierto | Rehacer la arenisca: los estratos actuales son tan regulares que parecen tablones. Estratos de grosor variable, bandas de color apagadas (crema, ocre, óxido suave), erosión, y 2 paneles distintos con cresta transparente. |
| Nieve | 2 chalets de 3 plantas **dibujados así** (el recorte funciona, pero un dibujo nativo queda mejor), con tejados y chimeneas distintos y la cresta transparente. |

**Cambio de motor necesario** (hazlo tú junto con el primer atlas): hoy el atlas tiene 2 columnas y cada lado usa una columna o alterna ambas. Generaliza a `atlasColumns` (N columnas) y una lista de columnas por lado que se recorra en orden fijo, sin aleatoriedad (debe seguir enlazando con `texturePeriod`). Actualiza `sceneryShader.ts`, las pruebas de periodos y `render-map-motion`.

## 2. Objetos de borde variados (prioridad alta)

Hoy cada mapa repite un único sprite (pino, cactus, palmera…). Genera **2–3 variantes por mapa** con la misma cámara y el mismo anclaje en la base:
- costa: palmera y maceta con buganvilla;
- montaña: pino y roca con matorral;
- desierto: saguaro, cactus bajo y roca;
- nieve: abeto nevado y montículo con farol;
- ciudad y atardecer: árbol en jardinera y farola.

Cambio de motor: que `RoadsideTrees` use varios rectángulos de sprite dentro del mismo `Atlas` (una sola llamada de dibujo) y los alterne por índice de posición.

## 3. Atardecer: que se vea el atardecer (prioridad media)

Con edificios de 18–20 de alto, el cielo naranja es solo una rendija. Genera un segundo atlas de **edificios medios (6–8 plantas)** para el lado derecho, con la misma luz dorada. Así se abre el cielo sin deformar ventanas. Si hace falta, edita la placa para que el sol quede visible pero sin deslumbrar el horizonte, porque ahí aparecen los portales.

## 4. Compresión (prioridad media)

Los mapas suman unos 40 MB de PNG dentro de la app. Convierte placas y atlas a un tamaño y formato razonables sin pérdida visible, por ejemplo WebP con calidad alta. Antes, actualiza las pruebas que exigen PNG o tamaños exactos, y comprueba que Skia en web, iOS y Android decodifica el formato.

## Verificación

Por cada cambio:
- `render-map-motion` con `staticShare < 0.05`;
- capturas antes y después de cada mapa;
- suite completa (`tests/city`) en verde, salvo las 3 de `journey` ya conocidas;
- probar la nevada en una partida real (`/race?map=snow`). La vista previa `/map-preview` fuerza «reducir movimiento» y la oculta.
