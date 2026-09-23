# Animación del carro al cambiar de carril

La vista trasera original se mezcla con `car_player_red_left.png` o `car_player_red_right.png` mientras el carro se desplaza lateralmente. La orientación se calcula a partir del desplazamiento real, de modo que un gesto rechazado en el borde no provoca un giro falso. Los gestos consecutivos y los cambios de sentido no esperan a que termine una animación anterior.

## Implementación

- `src/game/config/playerAnimation.ts`: velocidad lateral que activa el giro, respuesta de entrada/retorno/inversión y puntos de apoyo de los tres sprites.
- `src/game/motion/playerTurn.ts`: actualización temporal de la pose, separada de las reglas de la partida.
- `src/game/motion/useDrivingSimulation.ts`: un valor compartido se actualiza en el bucle existente, con el tiempo realmente simulado. Se reinicia junto con la partida y se congela con la pausa, el segundo plano y el fin de partida. No añade actualizaciones de React por fotograma.
- `src/game/geometry/playerFrames.ts`: registro del centro y la base de ruedas; shader de mezcla de píxeles premultiplicados.
- `src/game/world/PlayerCar.tsx`: conserva la sombra separada y la proyección lateral existente. Dibuja la mezcla en una sola pasada del carro, sin rotación plana, deformación ni cambios de escala.
- `src/game/config/assets.ts` y `src/game/world/GameWorld.tsx`: cargan los dos PNG adicionales antes de habilitar la simulación.

El peso de giro alcanza aproximadamente el 98 % a los 100 ms en un cambio de un carril. Regresa a cero después de que el desplazamiento se estabiliza. La inversión tiene una respuesta más rápida para seguir un nuevo gesto. Con Reducir movimiento se mantiene el sprite original; los controles siguen funcionando.

Los PNG originales no se editaron. El registro desplaza el fotograma izquierdo 26 px a la izquierda y 5 px hacia arriba, y el derecho 13 px a la derecha y 9 px hacia arriba, en unidades de la imagen de 1254 px antes de aplicar la escala de pantalla. Así coinciden el centro de apoyo y la base de las ruedas.

## Comprobaciones

- TypeScript y 71 pruebas automatizadas correctas.
- Seis pruebas nuevas cubren ambos giros, retorno a recto, inversión rápida, límites, pausa/segundo plano, Reducir movimiento, coherencia temporal a 30/60/120 Hz y registro en cuatro tamaños de pantalla.
- El test de render compila el shader con el CanvasKit instalado, decodifica los tres PNG reales y compara los extremos con los sprites originales. Comprueba que la mezcla conserva la opacidad de la carrocería y la transparencia exterior.
- Revisión en Expo web de los dos giros, gestos consecutivos, límite izquierdo, pausa/reanudación y reinicio. Encuadre revisado a 320 × 568 y 430 × 932; consola sin errores ni advertencias durante esas comprobaciones.
- Exportación de web, iOS y Android correcta.

Pendiente: comprobar la sensación de movimiento, consumo de memoria y rendimiento en el iPhone físico con Expo Go. La exportación y los tests no constituyen una medición de FPS en dispositivo.

Para abrir el proyecto: `npm start` y conectar Expo Go, o `npm run web`. La previsualización estática utiliza la exportación de `dist`.
