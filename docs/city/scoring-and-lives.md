# Vidas, puntos y nitro

Sustituye las reglas de vidas, puntuación, nitro y longitud de tramo de [desafío de evasión](challenge-update.md) y [primera partida local](local-gameplay.md). El resto de sus valores (velocidades, ráfagas, rutas validadas, colisiones barridas, cuatro segundos de pregunta) sigue vigente.

Motivo: con las reglas anteriores, un jugador que aún no dominaba el control podía perder las tres vidas chocando antes de ver la primera palabra. Además, monedas, racha y nitro no tenían efecto en la partida.

## Cambios

| Aspecto | Antes | Ahora |
| --- | --- | --- |
| Vidas | Se pierden por error de vocabulario o por choque | Solo por error de vocabulario |
| Choque | −1 vida | −3 monedas (o las que tengas) y sus puntos; sin bonificación de tramo limpio |
| Encuentros por tramo | 6 → 7 → 8 | 3 → 4 → 5 → 6 |
| Duración de tramo | ≈ 8,1–10,5 s | ≈ 5 s el primero, ≈ 5,5–7,5 s después |
| Acierto | 100 | 100 × multiplicador de racha: x1,5 con 3 seguidos, x2 con 5, x3 con 10 |
| Respuesta rápida | — | +50 si aciertas manteniendo pulsado antes del portal |
| Moneda | Solo contador | +10 puntos |
| Tramo sin choques | — | +50 al llegar a la pregunta |
| Nitro (cada 3 aciertos seguidos) | 2 s, solo visual | Desde la confirmación hasta el final del tramo siguiente: sin choques e imán de monedas |

Los choques siguen contando, con la protección de 1,4 s, el temblor y las chispas. La velocidad no cambia con el nitro ni con un choque: las rutas se validan con la velocidad del tramo. El imán captura las monedas a menos de 1,4 unidades por delante y las dirige al morro del carro: cierran la distancia lateral en proporción al tiempo que falta para el contacto, así que llegan justo al alcanzarlo. Una moneda capturada sigue hasta el carro aunque el nitro termine y nunca vuelve hacia su carril. Brilla en azul mientras vuela. (La primera versión arrastraba las monedas a velocidad fija desde 2,2 unidades: seguían los cambios de carril del carro y podían quedar paradas entre carriles.)

La puntuación siempre equivale a: puntos de respuestas + bonificaciones + 10 × monedas actuales. Por eso perder monedas descuenta sus puntos y nunca deja la puntuación en negativo.

## Interfaz

- La placa de racha muestra el multiplicador activo (x1,5, x2, x3).
- Al acertar, la etiqueta de puntos muestra el desglose: «Racha x2», «Rápida +50».
- Al empezar la pregunta tras un tramo limpio aparece «+50 Conducción limpia».
- Al chocar, el contador de monedas tiembla en rojo y las monedas salen despedidas del carro.
- El resumen muestra mejor racha, tramos limpios y respuestas rápidas.

## Verificación

- 115 pruebas de `tests/city`. Nuevas: tramo limpio; multiplicador y respuesta rápida; nitro con invulnerabilidad e imán. La prueba de choques se reescribió: no quita vidas y descuenta monedas con sus puntos. Las 3 pruebas del recorrido (`journey.test.cjs`) ya fallaban antes de este cambio por la importación del catálogo de 3.000 palabras.
- Medición de tramos avanzados (ronda 8, 100 semillas): media de 3 cambios rápidos por tramo, 97 % con dos o más.
