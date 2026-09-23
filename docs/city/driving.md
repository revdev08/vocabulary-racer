# Primera versión de conducción

Este documento registra la entrega inicial de conducción. La evolución posterior conserva los controles y añade [ciudad por capas en movimiento](city-motion.md) y una [partida completa de tráfico y vocabulario](local-gameplay.md), con el horizonte fijo. Las menciones siguientes al fondo completamente estático y a 15 pruebas corresponden a esa primera entrega.

La escena aprobada ahora tiene avance de carretera y cambios entre tres carriles. Los tres PNG aprobados permanecen idénticos. No se añadieron tráfico, colisiones, preguntas funcionales, navegación ni reproducción de audio.

## Uso

`npm start` abre Expo. `npm run web` permite probarla en navegador.

- Desliza horizontalmente sobre la zona de carretera, debajo de la tarjeta. En escritorio, arrastra con el ratón.
- Cada gesto cambia un carril. Un gesto largo no atraviesa dos carriles.
- Puedes encadenar gestos o invertir el destino antes de terminar la transición.
- El botón superior alterna pausa y reanudación. La pausa congela también una transición lateral en curso e ignora nuevos gestos.
- La app detiene la simulación al ir a segundo plano. Conserva una pausa manual al volver.

## Encuadre autorizado

El usuario eligió ajustar proporcionalmente el carro y la carretera para ver los tres carriles completos, en lugar de añadir seguimiento lateral de cámara. Los carriles ocupan el 92% del ancho a la altura del contacto del carro; el sprite ocupa como máximo el 78% de un carril y conserva su proporción. La altura del carro no cambia al conducir.

Los portales de muestra mantienen sus textos y aspecto neutral. Se recolocaron con la misma proyección para adaptarse al encuadre. Las aceras de la imagen aprobada quedan fuera de las tres vías jugables, como márgenes de la avenida. El fondo y el horizonte permanecen fijos durante el avance.

## Coordenadas y renderizado

`WorldPosition` contiene `lateral` y `distance`:

- Una unidad lateral equivale al ancho de un carril; los centros son −1, 0 y 1.
- La distancia aumenta al alejarse del jugador. La profundidad 1 coincide con el plano de recorte inferior.
- `projectWorld()` y `project()` centralizan la proyección. `unproject()` y el fragmento `GROUND_PROJECTION_SKSL`, en el mismo módulo, definen su inversa para el asfalto.
- El carro, los dos separadores, los bordes y los portales usan esta proyección. Futuros objetos deberán recibir una posición del mundo y pasar por `projectWorld()`.

La carretera tiene una reserva fija de 64 segmentos, de 0,86 unidades, con marcas de 0,40 unidades. Al avanzar, sus distancias disminuyen, los polígonos proyectados crecen y se recortan al pasar por el jugador. El reciclaje conserva la fase de la secuencia y el extremo distante se desvanece. La textura usa la misma distancia recorrida, con una fase periódica para mantener la precisión del shader.

No se desplaza verticalmente la imagen de ciudad. El carro y su sombra reciben exclusivamente una traslación X calculada a partir de la posición lateral; no hay rotación, inclinación ni deformación del sprite.

## Tiempo, pausa y dependencias

Se añadieron las versiones seleccionadas por `npx expo install`: Reanimated 4.5.1 y Worklets 0.10.1. Expo 57.0.24, React Native 0.86.3, React 19.2.3 y Skia 2.6.2 se conservaron.

`useFrameCallback` actualiza valores compartidos. En nativo, la animación y los caminos Skia se calculan mediante worklets en el hilo de interfaz; en web se utiliza el mecanismo compatible de Reanimated. No hay `setState` por fotograma: React solo recibe eventos de entrada, pausa o distribución.

El avance es velocidad × segundos transcurridos. El cambio lateral usa una respuesta exponencial analítica de 65 ms, sin sobrepasar el carril, que alcanza aproximadamente el 95% del recorrido en 195 ms. Ambos parámetros se ajustan en `config/driving.ts`.

La pausa y `AppState` desactivan el callback y borran la referencia de tiempo. En Android se manejan también foco/desenfoque; en web, visibilidad y foco de la ventana. Al reanudar, el primer frame establece una nueva referencia sin avanzar. Un intervalo inesperado superior a 250 ms se descarta como protección adicional. No se recupera el tiempo pasado en segundo plano.

Referencias consultadas: [Reanimated en Expo 57](https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/), [useFrameCallback](https://docs.swmansion.com/react-native-reanimated/docs/advanced/useFrameCallback/), [animaciones con Skia](https://shopify.github.io/react-native-skia/docs/animations/animations/).

## Archivos principales

- `src/game/config/driving.ts`: velocidad, transición, gestos y segmentos.
- `src/game/motion/simulation.ts`: reloj y funciones deterministas de simulación.
- `src/game/motion/useDrivingSimulation.ts`: valores animados, pausa y ciclo de vida.
- `src/game/controls/DrivingControls.tsx`: deslizamientos y acciones de accesibilidad.
- `src/game/geometry/perspective.ts`: coordenadas del mundo y encuadre compartido.
- `src/game/world/Road.tsx`: segmentos y textura animados.
- `src/game/world/PlayerCar.tsx`: sprite y sombra con traslación lateral.
- `GameScreen.tsx`, `GameWorld.tsx`, `GameHud.tsx`, `GameIcon.tsx`, `AnswerPortals.tsx` y `config/visual.ts`: conexión con la escena existente y encuadre.
- `tests/driving.test.cjs`, `tsconfig.geometry.json`, `package.json`, `package-lock.json`: pruebas y dependencias.

## Resultado de las pruebas

- `npm run typecheck`: aprobado.
- `npm run check:layout`: 15 pruebas aprobadas. Incluyen entrada consecutiva, inversión de destino, extremos, gestos ambiguos, equivalencia a 30/60/120 Hz, pausa a mitad de transición, intervalos largos, proyección/inversa, límites del sprite, continuidad y reciclaje de segmentos, horizonte y cinco tamaños de pantalla con áreas seguras.
- Expo Doctor: 21/21 comprobaciones aprobadas.
- Exportación web y bundles Hermes de Android e iOS: aprobados.
- Navegador real: secuencias derecha → centro → izquierda, bloqueo en ambos extremos, reanudación y dirección inversa comprobadas mediante gestos. El carro completo permanece dentro de sus carriles.
- Pausa: dos capturas completas separadas en el tiempo fueron idénticas; un gesto durante la pausa conservó el mismo carril.
- Revisión visual: la carretera cambia mientras la ciudad mantiene su encuadre. No se detectaron errores de ejecución en la versión final.

La protección contra saltos al volver está comprobada con el mismo reloj puro utilizado por el bucle. **Falta una prueba de ciclo de vida y gestos en un teléfono físico o simulador nativo.** La exportación no sustituye esa prueba ni mide FPS sostenidos en un dispositivo.

Las capturas de `docs/previews/` documentan la composición estática anterior. Para revisar el movimiento y el nuevo encuadre, abre la aplicación.
