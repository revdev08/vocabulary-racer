# Desafío de evasión

> Vidas, puntuación, nitro y longitud de tramo actualizados en [vidas, puntos y nitro](scoring-and-lives.md).

El estado previo quedó guardado en el commit `52ac49d`. Se revisó la grabación `Grabación 2026-09-22 151016.mp4` (32,4 segundos): el jugador ya había llegado al antiguo Ritmo 5 y racha 11–13. Los cinco encuentros por tramo, los intervalos casi uniformes y los cruces entre extremos con mucha espera permitían anticipar las maniobras con calma.

## Cambios

| Aspecto | Antes | Ahora |
| --- | --- | --- |
| Velocidad inicial / máxima | 1,2 / 2,0 | 1,8 / 3,3 unidades del mundo por segundo |
| Progresión | Cinco niveles | Seis niveles: 1,8 → 2,1 → 2,4 → 2,7 → 3,0 → 3,3 |
| Encuentros por tramo | 4, después 5 | 6 → 7 → 8 |
| Separación mínima entre filas | 1,05 s | 0,60 s en ráfagas avanzadas |
| Cambios entre extremos | Al menos 1,8 s | Al menos 1,08 s, con dos gestos y ruta validada |
| Carriles libres | Cuatro secuencias reflejadas | Variantes reproducibles dentro de cada patrón |
| Maniobras inevitables entre filas | Al menos 2–3 | Al menos 4 → 5 → 6 |

El primer tramo permite aprender el control, pero dura aproximadamente 8,12–8,47 segundos y exige más maniobras. Desde el segundo hay pares de intervalos cortos y un intervalo de recuperación; desde el tercero también se mezclan cruces entre extremos. Los siguientes obstáculos permanecen visibles desde lejos: no aparecen encima del jugador ni cambian de carril para interceptarlo.

Se reemplazó la espera fija de 0,34 segundos después de cada fila por el tiempo que realmente necesita el objeto para despejar la parte trasera del carro, más 0,04 s de margen y 0,26 s de reacción. El generador y la ruta de comprobación comparten ese cálculo. Cada transición sigue comprobándose con las colisiones barridas del motor, contra todas las filas, y con una separación de 0,18 s entre gestos dobles. Los candidatos imposibles se descartan; la reserva usa 1,3 s entre filas.

Se conservan las cajas de colisión, el control lateral, las tres vidas y la protección de 1,4 segundos. La pregunta sigue ofreciendo cuatro segundos sin obstáculos ni monedas, independientemente del nivel. Se conserva la corrección del destello de respuesta, el HUD, el estilo y los PNG. Las monedas siguen siendo cuatro por tramo, en dos parejas y carriles distintos.

## Comparación reproducible

La prueba usa 24 semillas × 3 carriles iniciales en cada nivel. Un conductor automático sigue la ruta validada; se añade por separado un retraso a sus órdenes. Esto comprueba tolerancia temporal del motor, **no predice el porcentaje de errores de personas**.

| Escenarios del nivel máximo | Antes | Ahora |
| --- | ---: | ---: |
| Ruta prevista: partidas con algún choque | 0 / 72 | 0 / 72 |
| Órdenes con 150 ms adicionales: partidas con algún choque | 0 / 72 | 72 / 72 |
| Órdenes con 250 ms adicionales: partidas con algún choque | 72 / 72 | 72 / 72 |

El nivel inicial conserva 0/72 choques con 150 ms adicionales. Al avanzar se reduce ese margen; no se fuerza un fallo ni se elimina la ruta correcta. Los datos anteriores están en [challenge-before.json](qa/challenge-before.json), asociados al commit de respaldo. Los actuales están en [challenge-runs.json](qa/challenge-runs.json).

```sh
npm run typecheck
npm run check:layout
node scripts/record-gameplay.cjs
node scripts/record-challenge.cjs
npx expo export --platform all --output-dir dist
```

## Verificación y límites

- 65 pruebas aprobadas: rutas, colisiones, retrasos, variación de carriles e intervalos, maniobras dobles, monedas alcanzables, preguntas, pausa, reinicio y cierre de confirmación. Las secuencias se simulan también a pasos de 30/60/120 Hz.
- Al menos 20 variantes de ruta en 100 semillas del nivel avanzado, dos cambios rápidos por bloque y un intervalo de recuperación o cruce doble. Incluso la ruta más sencilla exige múltiples maniobras.
- Las siluetas conservan al menos 24 píxeles de ancho 0,9 segundos antes del primer contacto posible, incluso a velocidad máxima en 320 × 568. El margen anterior de 1,5 s se ha reducido deliberadamente para aumentar la exigencia; no se han agrandado las cajas de colisión.
- Las cinco rutas de recompensa completan diez preguntas con 77 encuentros, 40 monedas, 1000 puntos y cero choques. Permanecer en el centro pierde la partida.
- Exportaciones web y Hermes iOS/Android correctas. En navegador a 390 × 844 se revisaron evasión inicial, cuatro monedas, dos choques al omitir maniobras, pregunta con los tres carriles despejados, acierto Casa/House, 100 puntos y paso a Ritmo 2 con ráfagas. No se observaron errores en la consola consultada.

El límite pasa de 10 a 16 obstáculos y mantiene cuatro monedas; el render utiliza slots estables y no se añade estado de React por fotograma. No se han medido FPS, memoria ni rendimiento nativo con ese límite. Falta comprobar en el iPhone con Expo Go la fluidez, la comodidad de los cambios dobles y si el nuevo nivel máximo ofrece el reto deseado en una sesión continua.
