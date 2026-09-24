# Tráfico en movimiento

El tráfico avanza a velocidades distintas y algunos carros cambian a un carril vecino. Se mantienen los cuatro sprites, los tiempos de llegada de los obstáculos y la progresión de dificultad.

Los parámetros están en `src/game/config/trafficMotion.ts`: aviso de direccional de 0,65 s, cambio suave de 0,78 s, y al menos 0,65 s entre el final de la maniobra y el primer contacto posible con el jugador. Se permiten hasta dos cambios por tramo inicial y tres a partir de la cuarta ronda. Los avisos y maniobras no se superponen; entre ellos quedan 0,25 s.

`obstacleLateralAt` es la posición lateral continua que comparten el planificador y las colisiones. El motor guarda esa misma posición para proyectar el sprite y su sombra; las luces direccionales se colocan sobre los faros de cada modelo. El sprite conserva sus proporciones y no gira como una imagen plana.

Antes de aceptar un cambio se comprueba la trayectoria completa contra los otros carros y barreras, y se busca una ruta alcanzable con los tiempos de reacción y controles reales del jugador. Una maniobra que no cumple se descarta. La ruta de monedas se vuelve a validar con esos movimientos. Se conservan las preguntas sin tráfico ni maniobras pendientes.

Todo utiliza el reloj de simulación existente, en el hilo de animación, sin temporizadores independientes ni actualizaciones de React por fotograma. Pausa, segundo plano, fin de partida y reinicio afectan también al tráfico y a sus direccionales.

Pruebas: movimiento y colisiones a 30/60/120 Hz, cientos de planes y rutas de monedas, márgenes de reacción, cruces entre vehículos y barreras, posición visual durante el cambio, señales, pausa y retorno de segundo plano. El rendimiento y la sensación de control en un iPhone físico con Expo Go deben comprobarse en dispositivo.

Validación del 24 de septiembre de 2026: 124 pruebas aprobadas (15 generales y 109 de ciudad), TypeScript y lint sin errores, y exportaciones de producción web/iOS/Android completadas. En la vista web se comprobó el cambio lateral del SUV blanco, la integración con la carretera y el menú de pausa; la consola no registró errores. Las exportaciones nativas no sustituyen la prueba de ejecución en dispositivo.
