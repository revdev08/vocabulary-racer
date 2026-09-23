# Primera partida local

Registro histórico de la primera partida. La versión actual añade [patrones, monedas, repaso y recompensas](rhythm-and-rewards.md); sus valores sustituyen a los descritos aquí.

Entrega del 22 de septiembre de 2026. Conserva los assets y la dirección visual aprobados, la cámara fija y los tres carriles. No incorpora dependencias nuevas.

## Abrir y jugar

Desde la raíz, `npm run web` para navegador o `npm start` para un cliente Expo compatible. La primera pantalla es el juego. Desliza horizontalmente sobre la carretera; en escritorio, arrastra con el ratón. Cada gesto cambia un carril y se pueden encadenar gestos. Pausa/reanudación en la esquina superior derecha. El audio permanece deshabilitado.

Cada ronda alterna dos encuentros de tráfico con una pregunta. Esquiva el sedán amarillo y la barrera, lee la palabra española y conduce al carril de su traducción. La fila se evalúa al atravesarla, nunca al empezar un cambio de carril. Los tres portales son neutrales hasta ese momento.

- Tres vidas iniciales.
- Acierto: 100 puntos y racha +1; confirmación verde, símbolo y mensaje.
- Error: una vida menos y racha a cero; confirmación roja, cruz y traducción correcta.
- Choque: una vida menos; protección de 1,4 segundos y parpadeo suave. El mismo objeto solo puede causar un contacto. Un choque conserva la racha de vocabulario.
- Al llegar a cero vidas, la simulación se detiene. El resumen separa aciertos, errores de vocabulario y choques. «Volver a jugar» reinicia tiempo, posición, vidas, puntuación, racha, preguntas y protección.

## Parámetros para probar

En `src/game/config/gameplay.ts`:

| Parámetro | Valor inicial | Propósito |
| --- | --- | --- |
| `decisionSeconds` | 4 s | Tiempo entre opciones legibles y cruce |
| `decisionSpeed` | 0,14 | Velocidad de todo el mundo durante la lectura |
| `trafficSeconds` | 8,5 s | Duración mínima del tramo de obstáculos |
| `firstContactSeconds` / `secondContactSeconds` | 3,4 / 6,4 s | Separación de los encuentros |
| `trafficCarSpeed` | 0,25 | Avance propio del vehículo amarillo |
| `feedbackSeconds` | 1,3 s | Duración de la confirmación |
| `collisionProtectionSeconds` | 1,4 s | Protección posterior a un choque |

La velocidad normal sigue siendo 1,6 en `config/driving.ts`. Las distancias usan unidades del mundo, no metros ni km/h. Durante la lectura el mundo entero reduce su velocidad: permite mostrar opciones legibles desde el inicio durante cuatro segundos sin mover el horizonte ni dar a los portales una perspectiva diferente. Los portales se desvanecen durante 0,55 segundos tras el cruce; el mensaje permanece 1,3 segundos.

El banco `src/game/data/vocabulary.ts` contiene las diez parejas solicitadas, con identificador, palabra española, respuesta y dos distractores. Las preguntas recorren el banco y vuelven a empezar. Se barajan las opciones con Fisher–Yates y se evita repetir el carril correcto de la pregunta anterior. No hay backend, llamadas a IA ni almacenamiento remoto.

## Generación y proyección

Cada tramo genera exactamente dos objetos: un vehículo y una barrera, uno por fila y con tres segundos entre encuentros. Nunca hay tres carriles ocupados simultáneamente; siempre existe un carril completamente libre en el tramo. No se generan más objetos antes de la pregunta y esta espera a que los anteriores salgan. Durante la decisión no hay tráfico ni barreras.

`geometry/entities.ts` adapta la distancia longitudinal de los objetos a la misma cámara y `projectWorld` usados por carretera y carro. El tamaño depende de la profundidad; las proporciones de los PNG se conservan. Los objetos se ordenan por distancia y se separan en capas delante/detrás del jugador.

Se midieron los límites del contenido visible (alfa >32) para centrar y apoyar los assets en sus carriles. Las cajas de colisión son algo menores que su ancho visible, y no utilizan el lienzo transparente completo. La comprobación barre el recorrido entre posiciones sucesivas, incluyendo cambios laterales, para detectar contactos entre fotogramas. Cada contacto se marca como consumido.

Los archivos nuevos con los nombres solicitados son copias idénticas de los aprobados:

- `traffic/car_traffic_yellow.png` → `traffic/traffic_car_yellow.png`.
- `obstacles/barrier_road_orange.png` → `obstacles/obstacle_barrier.png`.

Los originales se conservan. La pantalla utiliza los nuevos nombres.

## Bucle y ciclo de vida

`gameplay/engine.ts` es un motor local separado de React. Integra el tiempo transcurrido en pasos de hasta 1/120 s. `useDrivingSimulation` lo ejecuta desde el mecanismo de animación existente; posiciones y carretera se transmiten mediante valores compartidos. React recibe eventos de fase, puntuación o vida, y cambios de controles, sin `setState` por fotograma.

La simulación no empieza hasta cargar todos los assets. La pausa manual y el segundo plano detienen también las preguntas, el movimiento lateral y la protección. El reloj se reinicia al volver y descarta intervalos de más de 250 ms. El identificador de partida evita que eventos retrasados de una partida anterior alteren el reinicio.

## Comprobaciones realizadas

- `npm run typecheck`: correcto.
- `npm run check:layout`: 33/33 pruebas. Las 13 de partida cubren vocabulario, distribución de opciones, generación segura en 200 semillas, lectura y evaluación única, posición real al cruce, correcciones, colisiones barridas, invulnerabilidad, proyección legible, derrota/reinicio, diez aciertos seguidos, equivalencia temporal a 30/60/120 Hz y pausa/segundo plano durante una pregunta.
- `npx expo export --platform all --output-dir dist`: web y bundles Hermes de Android/iOS generados correctamente.
- Navegador: dos cambios consecutivos de izquierda a derecha y cruce por «House» con 100 puntos, racha 1 y portal verde con símbolo; error posterior con pérdida de vida y racha a cero; final de partida con errores y choques separados; reinicio real a tres vidas y contadores a cero.
- Diseño revisado a 320 × 568 y 390 × 844. Los tres portales y el carro caben en la vista estrecha. Las pruebas de geometría incluyen márgenes seguros de dispositivos.
- Pausa: dos capturas completas separadas en el tiempo resultaron idénticas. No se observaron errores del bundle actual en el registro web consultado.

## Pendiente en dispositivo

No se ejecutó esta entrega en Android/iOS físico ni en simulador nativo. Exportar Hermes no equivale a compilar o instalar un APK/IPA. Quedan por probar gestos táctiles reales, panel de notificaciones, interrupciones y regreso a la app, áreas seguras reales y legibilidad con distintas densidades/tamaños de texto. También debe ajustarse la comodidad de los cuatro segundos de lectura con usuarios.

No se midieron FPS, memoria ni consumo. Los tests de frecuencia validan consistencia del motor, no rendimiento del renderizado.
