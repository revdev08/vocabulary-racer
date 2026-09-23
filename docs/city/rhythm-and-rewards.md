# Ritmo, monedas y recompensa: registro de la etapa previa

Este documento conserva el historial anterior al commit `52ac49d`. Los valores, límites y resultados vigentes están en [desafío de evasión](challenge-update.md): seis a ocho encuentros, ráfagas, velocidad de 1,8 a 3,3 y 65 pruebas. El registro `qa/rhythm-runs.json` se ha regenerado para esa versión actual y ahora contiene 77 encuentros en cada ruta completa de diez preguntas.

Implementado sobre el motor y la escena existentes. Sin nuevas dependencias, sin cambios de versiones y sin editar los PNG aprobados. El adjunto recibido contenía el texto de la solicitud; no había una grabación accesible. La revisión visual se hizo sobre el prototipo en el navegador.

## Sistemas reutilizados

| Sistema | Ubicación |
| --- | --- |
| Fases, vidas, puntos, racha y cruces | `src/game/gameplay/engine.ts` |
| Apariciones, patrones y rutas | `src/game/gameplay/patterns.ts`, llamado por el mismo motor |
| Velocidad normal y cambio de carril | `src/game/config/driving.ts` |
| Tiempos, límites, colisiones y recompensas | `src/game/config/gameplay.ts` |
| Cámara y proyección común | `src/game/geometry/perspective.ts` y `entities.ts` |
| Colisiones entre posiciones sucesivas | `src/game/gameplay/collision.ts`, compartido por motor y validador |
| Vocabulario local | `src/game/data/vocabulary.ts` |
| Bucle, pausa y ciclo de vida | `src/game/motion/useDrivingSimulation.ts` |

## Ritmo y seguridad

Los encuentros se programan por su hora de llegada al jugador. La posición inicial del tráfico tiene en cuenta su velocidad propia, por lo que un sedán y una barrera de una misma fila llegan juntos aunque empiecen a distancias distintas. Ningún objeto cambia de carril después de generarse.

La biblioteca incluye barridos de un extremo al otro, retornos al centro, cambios de ida y vuelta y cruces entre extremos. Los patrones se reflejan a izquierda o derecha y no se repiten consecutivamente. Desde el primer tramo hay cuatro encuentros: una apertura con dos salidas y tres filas con un único carril libre, que va cambiando. Se mezclan sedanes y barreras. El siguiente tramo cambia su primer carril ocupado.

La velocidad aumenta en cada nuevo tramo, desde 1,2 hasta 2,0 unidades por segundo, y los encuentros reducen gradualmente su separación de 1,35 a 1,05 segundos. Desde el tercer tramo se añaden un quinto encuentro y patrones que cruzan entre extremos, con 1,8 segundos de margen para dos gestos. Esta progresión depende de los tramos completados, sin exigir una racha de conducción perfecta ni reiniciarse por un choque.

La comparación de cien semillas por nivel encontró que la versión anterior permitía resolver cada tramo inicial con una sola maniobra. Ahora incluso la secuencia de carriles libres más sencilla requiere al menos dos cambios entre encuentros desde el inicio, y al menos tres desde el tercer tramo. No se cuenta el movimiento inicial para alcanzar la primera salida. Es una medida de exigencia del patrón, no una afirmación de diversión comprobada con jugadores.

El validador busca rutas por los tres carriles y simula cada transición con la velocidad del tramo, la misma respuesta lateral y las mismas cajas de colisión del juego. Incluye reacción, salida del contacto anterior y dos gestos cuando son necesarios. Comprueba también los obstáculos siguientes, no solo el carril libre de la fila actual. Si un candidato no tiene ruta, se vuelve a generar; existe una construcción de reserva que alterna los carriles con mayor separación entre encuentros.

La carretera siempre avanza. Se desacelera suavemente después del último encuentro, se conserva la ventana de lectura y se recupera la velocidad durante la confirmación. Se eliminaron las esperas fijas de 8,5 segundos. Durante la pregunta y su corrección no hay obstáculos ni monedas: los tres portales son alcanzables y ninguna ruta señala la respuesta.

## Valores iniciales

| Parámetro | Valor |
| --- | --- |
| Velocidad por tramo | 1,2 → 1,4 → 1,6 → 1,8 → 2,0 unidades del mundo por segundo |
| Velocidad de lectura | 0,18 unidades del mundo por segundo |
| Encuentros iniciales | 4 en aproximadamente 6,92–7,22 s; 5 desde el tercer tramo |
| Primer encuentro | 2,1 s en los dos primeros tramos; 2,0 s después |
| Separación por tramo | 1,35 → 1,25 → 1,15 → 1,05 s, más hasta 0,10 s de variación |
| Margen para cambio doble | 1,8 s; la fila se retrasa si lo exige la ruta |
| Reacción / separación de gestos | 0,30 / 0,18 s |
| Espera tras contacto anterior antes de preparar maniobra | 0,34 s |
| Desaceleración final | 0,50 s |
| Lectura | 4 s, independiente de la racha |
| Confirmación | 1,15 s para acierto; 1,75 s para error, con el mundo en marcha |
| Protección tras choque | 1,40 s |
| Monedas | Dos parejas en carriles distintos: 4 por tramo, con 0,30 s entre monedas de una pareja |
| Recompensa por acierto | 100 puntos |
| Nitro visual | 2 s cada 3 aciertos consecutivos |
| Repaso de errores | Tras otras 3 preguntas |

Los tramos posteriores de cinco encuentros pueden durar más que los iniciales para conservar los márgenes de reacción, especialmente con cambios dobles. No se fuerza una densidad que haga imposible la ruta. Las unidades no representan metros ni km/h.

## Monedas y aprendizaje

Las monedas se dibujan con Skia: círculos, borde y estrella, sin emojis ni assets descargados. Comparten proyección, orden de profundidad y capas delante/detrás del jugador con el tráfico. Las líneas de recompensa siguen una ruta validada; el patrón de desvío busca otra ruta segura que requiere una maniobra adicional. No hay monedas en las preguntas. Cada moneda se retira al primer contacto y produce un destello pequeño.

La interfaz separa **Puntos**, **Monedas** y **Racha N**. No muestra multiplicadores ficticios. El resumen añade las monedas recogidas y mantiene errores de vocabulario separados de choques.

Después de un acierto se ilumina el portal atravesado, aparecen partículas y puntos junto al carro, pulsa brevemente la racha y se muestra la pareja española/inglesa. Un error muestra la traducción y programa su repaso después de tres preguntas intermedias. La racha depende solo del vocabulario; los choques no la reinician.

Se inspeccionaron los archivos de audio, las dependencias y el código: no había sonido ni voz implementados. Esta entrega es silenciosa; no añade un sistema de audio nuevo. El botón de audio de la pregunta continúa deshabilitado y desaparece entre preguntas.

La confirmación actual usa una tarjeta con check/cruz dibujados y traducción explícita; el último error se explica antes del resumen. Consulta [fluidez y confirmaciones](fluency-and-answer-feedback.md) para las animaciones, optimizaciones y límites de la medición.

## Cámara e interfaz

El tamaño del jugador se obtiene de los límites opacos medidos del PNG, que ocupa el 90 % de un carril. Esto supone aproximadamente un 23,5 % más que el tamaño anterior basado en el 78 % del lienzo; en pantallas cortas también se eliminó la restricción de los antiguos portales estáticos. Se conservan proporciones, anclaje al suelo, horizonte y límites de carril. Se ajustaron el tráfico cercano y las cajas de colisión conjuntamente.

La gran tarjeta «Esquiva» se reemplazó por «Recoge y esquiva · Ritmo N», que indica los cinco niveles de velocidad. La palabra entra con una transición de 0,18 s y queda completamente legible al pausar. La barra solo aparece durante las preguntas y está etiquetada como tiempo de respuesta. La pausa conserva visible la pareja de vocabulario cuando hay una confirmación.

El nitro es una estela azul con brillo y líneas discretas en la zona inferior. No cambia la velocidad. Se consulta la preferencia de movimiento reducido y sus cambios en tiempo real: se suprimen estelas, líneas, desplazamiento de puntos, pulso de racha, entrada de tarjeta y partículas móviles. Se conservan los mensajes y las confirmaciones estáticas. La conducción necesaria para jugar permanece activa.

## Límites de recursos

Hay como máximo 10 obstáculos, 4 monedas y 8 efectos transitorios. Las posiciones usan valores compartidos y slots de render estables. React recibe cambios de contadores, fase o entrada, no un `setState` por fotograma. Los efectos caducan con el reloj de simulación; la pausa los congela y el reinicio elimina los de la partida anterior. Al desmontar se desactiva el bucle y se retiran listeners de aplicación y accesibilidad. No hay recursos de audio que liberar.

## Pruebas y registro reproducible

```sh
npm run typecheck
npm run check:layout
node scripts/record-gameplay.cjs
npx expo export --platform all --output-dir dist
```

- 59 pruebas aprobadas: perspectiva, cámara, patrones, rutas, monedas, selección, colisiones, pausa, reinicio, repaso y recompensas.
- Rutas probadas con 225 combinaciones de semilla/nivel/posición, incluidas posiciones intermedias. Otras 300 combinaciones recogen las cuatro monedas sin chocar. Mil combinaciones de semilla/tramo comprueban el uso de los tres carriles y la variación entre filas y tramos. Se comprueban también la progresión y su límite, filas imposibles, cambios dobles, tamaños visibles antes del encuentro y colisiones al quedarse inmóvil en cualquier carril.
- La prueba de dificultad explora todas las secuencias posibles de carriles libres en mil tramos y exige un mínimo de dos o tres maniobras, sin contar la apertura. Se simulan las nuevas secuencias a 30/60/120 Hz sin choques siguiendo la ruta validada; también se fuerza la construcción de reserva y se comprueba que conserva rutas cambiantes y alcanzables.
- Diez partidas deterministas registradas en [`qa/rhythm-runs.json`](qa/rhythm-runs.json), con cinco semillas y dos estrategias. Incluyen velocidades, separación de encuentros, carriles ocupados, mínimo de cambios de carril exigidos, obstáculos afrontados y evitados, monedas, aciertos, errores, choques, nitros y máximo intervalo sin actividad próxima.
- Cada una de las cinco rutas de recompensa completa diez preguntas con 48 encuentros, 40 monedas, 10 aciertos, 0 choques y 3 recompensas de nitro. La estrategia de quedarse en el centro pierde por choques y respuestas incorrectas; no es una solución universal.
- Máximo intervalo registrado sin un obstáculo o moneda aproximándose dentro de 1,8 segundos: aproximadamente 0,79 s. Las preguntas y confirmaciones cuentan como actividad. Es una métrica del motor simulado, no una medición perceptual ni de rendimiento.
- Navegador, ajuste de velocidad: pareja de dos monedas recogida, tres carriles ocupados en el tramo, cruce de House, 100 puntos y ascenso visible de Ritmo 1 a Ritmo 2. El siguiente tramo cambia su distribución. Sin errores en la consola consultada.
- Navegador, ajuste de evasión: filas dobles visibles desde la primera ronda, cambio hacia la primera pareja y regreso al centro. Permanecer allí sin completar la siguiente maniobra produjo un choque; el tramo terminó con cuatro monedas y dos vidas. La pregunta volvió con la carretera despejada. No aparecieron errores en la consola consultada. Esto comprueba interacción y renderizado; no sustituye una sesión de juego continua con personas.
- Navegador, etapa previa de recompensas: recogida de monedas, dos cambios consecutivos entre extremos, tres aciertos, 300 puntos, racha 3 y nitro. Un choque redujo las vidas de tres a dos conservando la racha. Se inspeccionaron los portales, puntos, partículas y contadores en la escena.
- Diseño revisado a 320 × 568 y 390 × 844. La tarjeta queda legible al pausar y los puntos aparecen debajo del carro sin cubrir las opciones. Las pruebas de geometría incluyen márgenes seguros y densidades distintas.
- Dos capturas de la escena pausada fueron idénticas, incluidos los efectos. El resumen estrecho mostró 100 puntos, 20 monedas, 1 acierto, 1 error y 2 choques; el botón de reinicio restauró tres vidas y puso puntos, monedas y racha a cero. No se registraron errores web en la consulta del navegador.
- TypeScript correcto y bundles de web, Android e iOS exportados satisfactoriamente con las versiones existentes.

## Límites de la verificación

No se dispuso de la grabación mencionada. Tampoco se probó en teléfono físico o simulador nativo. La exportación de Hermes comprueba el empaquetado, no la instalación ni el comportamiento en Android/iOS.

Falta comprobar tacto y comodidad de los márgenes con personas, segundo plano y notificaciones reales, preferencia de movimiento reducido en el sistema del dispositivo, audio si se incorpora en una entrega posterior y consumo de memoria/batería. No se han medido FPS ni rendimiento de renderizado.
