# Ciudad en movimiento

Registro de la etapa de ciudad móvil. La entrega actual añade una [partida local completa](local-gameplay.md) sobre estas mismas capas y assets.

La ciudad acompaña ahora el avance mediante planos y elementos independientes en perspectiva. Se conservan el PNG del fondo v3 como ciudad lejana, el carro rojo, HUD, textos, portales y controles.

## Capas

- **Lejana:** `CityBackdrop` mantiene el encuadre y horizonte fijos de v3.
- **Fachadas:** dos materiales nuevos —cristal azul y piedra clara— se proyectan sobre paredes laterales a ±2,75 anchos de carril. La textura frontal no contiene perspectiva; el shader la obtiene del mismo sistema de coordenadas del mundo. Los módulos cambian de altura y alternan material, con fases distintas a cada lado.
- **Aceras y bordillos:** parten de ±1,54, justo fuera de los tres carriles. Sus juntas, variaciones de baldosa y sombras se calculan en coordenadas del mundo; avanzan con el asfalto. El parámetro del borde también calibra el fondo lejano.
- **Árboles:** PNG transparente en una reserva de 26 por lado, dibujada con un único Atlas Skia. Se acercan y crecen respetando proporciones, sin invadir carriles. Las filas están desfasadas. Se dibujan primero los lejanos; el reciclaje sucede fuera de pantalla y los nuevos árboles aparecen en la distancia con opacidad cero.

Entre distancias 8 y 22, las capas próximas se mezclan progresivamente con la ciudad lejana. Esto evita una costura abrupta; no se añade una franja de niebla. El overlay radial original conserva el máximo del 4% y el asfalto su bruma máxima del 12%.

## Movimiento y calidad

Todas las capas reciben `simulation.distance`, el mismo valor compartido usado por la carretera. No hay temporizador independiente ni `setState` por fotograma. Pausa, segundo plano y protección contra intervalos largos se heredan del bucle existente.

`WorldPosition` admite ahora elevación opcional, medida en anchos de carril. `projectWorld`, `unprojectWall` y su equivalente SkSL permanecen juntos en `geometry/perspective.ts`. La elevación cero mantiene exactamente la proyección anterior.

Las texturas usan una fase periódica de 12 unidades para evitar pérdida de precisión. La textura de fachadas lleva filtrado cúbico y cuatro muestras adicionales en la región lejana para reducir parpadeo en ventanas pequeñas. Se utilizan opciones compatibles con Skia 2.6.2; no se modificaron dependencias. La memoria y número de sprites permanecen acotados durante sesiones largas.

## Assets y procedencia

Generados mediante ImageGen integrado a partir de la ciudad v3 como referencia de estilo. No se sobrescribe ningún asset aprobado:

- `assets/game/scenery/facades_city.png`: 1024 × 1536, atlas opaco con dos fachadas.
- `assets/game/scenery/tree_planter.png`: 1024 × 1536, árbol y jardinera con alfa.

[Prompts completos](city-motion-prompts.md).

## Archivos

- Nuevos: `config/scenery.ts`, `geometry/scenery.ts`, `world/ScenerySurfaces.tsx`, `world/RoadsideTrees.tsx`, `tests/scenery.test.cjs` y los dos assets anteriores.
- Integración: `config/assets.ts`, `config/visual.ts`, `geometry/perspective.ts`, `world/GameWorld.tsx`, `tsconfig.geometry.json`.
- Documentación: `README.md`, `docs/driving.md`, este archivo y el registro de prompts.

## Verificación

- TypeScript y 20 pruebas aprobadas: incluyen proyección/inversa de paredes, elevación, árboles fuera de los carriles, crecimiento, horizonte fijo, continuidad del reciclaje y tiempo compartido al pausar/reanudar.
- Exportación web y bundles Hermes Android/iOS correctos.
- Pausa en navegador: dos capturas completas separadas en el tiempo son idénticas. Reanudación comprobada sobre el mismo escenario.
- Revisión visual en el navegador: tamaños estrecho y alto, ciudad integrada con aceras y carretera, carro y zona de elección despejados.
- Se conserva el SHA-256 del carro (`B2E0AEF…`) y de la ciudad v3 (`E2F33C53…`).

No se ha medido rendimiento sostenido ni probado gestos/ciclo de vida en teléfono físico. La exportación nativa verifica el empaquetado, no sustituye esa prueba. No se añaden tráfico, colisiones ni preguntas funcionales.

Abrir con `npm start` o `npm run web`. El escenario continúa siendo la primera pantalla.

Referencias técnicas: [valores compartidos en Skia](https://shopify.github.io/react-native-skia/docs/animations/animations/) y [shaders de imagen](https://shopify.github.io/react-native-skia/docs/shaders/images/).
