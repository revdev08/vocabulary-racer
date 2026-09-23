# Fluidez y confirmación de respuestas

El usuario observó pequeños tirones en un iPhone con Expo Go. No se tuvo acceso a ese dispositivo. Se conservan los assets, las versiones instaladas, los patrones de obstáculos y sus velocidades.

## Trabajo reducido en el renderizado

- `GameWorld` está memoizado y recibe únicamente referencias estables de simulación. Los eventos de monedas, vidas, puntos y gestos actualizan la interfaz sin reconciliar de nuevo el árbol de Skia.
- Los 52 árboles reutilizan sus transformaciones y colores con los buffers de Skia 2.6.2. Ya no crean 52 objetos de transformación y 52 arrays de color por fotograma.
- Tráfico y monedas se proyectan y ordenan una vez por fotograma para las dos capas del jugador. Sus posiciones se aplican con una transformación del grupo; las imágenes conservan proporciones y las colisiones no cambian.
- El asfalto es un plano fijo con textura móvil. Se eliminó la reconstrucción de sus 64 cuadriláteros por fotograma; las marcas siguen siendo segmentos proyectados en perspectiva.
- Nitro, estructuras de portales y partículas evitan construir caminos cuando no son visibles.
- Las etiquetas de portales se desplazan y escalan mediante transformaciones, sin cambiar `left`, `top`, `width`, `height` o `fontSize` en cada fotograma. El texto conserva su tamaño legible calculado con la misma proyección.

## Respuesta visual

La nueva tarjeta ocupa el área de la pregunta, sin cubrir el carro. El acierto muestra check dibujado, aro, entrada con un rebote pequeño, traducción, puntos y racha. En el mundo aparecen partículas doradas y un aro verde junto al carro; los puntos tienen su propia aparición breve.

El error muestra una cruz dibujada, una oscilación corta del icono, la opción elegida tachada, la vida perdida y la traducción correcta. El efecto del carro es un aro de error, sin partículas de celebración.

La confirmación dura 1,15 segundos al acertar y 1,75 al fallar. Durante ese tiempo no hay obstáculos ni monedas y la carretera recupera suavemente la velocidad del siguiente tramo. La lectura previa sigue durando cuatro segundos. Al perder la última vida por vocabulario se muestra primero la corrección completa y después el resumen; un choque fatal sigue terminando la partida directamente.

Todos los efectos dependen del reloj de simulación: pausa y segundo plano los congelan. La preferencia de movimiento reducido mantiene símbolos y mensajes, desactiva desplazamientos, sacudidas y confeti móvil. No se añadió audio.

## Mediciones y límites

Se añadió una sonda opcional en la URL web `?profile=1`, ausente del juego normal y de la interfaz nativa. Usa semilla 2026, un segundo de calentamiento y una muestra de cuatro segundos. Registra intervalos del callback de fotograma y tiempo del motor; **no mide la finalización del trabajo de GPU**.

En el navegador integrado de Windows, a 390 × 844:

| Muestra | Fotogramas | Intervalo p95 | Máximo | Intervalos >25 ms |
| --- | ---: | ---: | ---: | ---: |
| Antes del ajuste | 240 | 16,8 ms | 16,9 ms | 0 |
| Después | 240 | 16,9 ms | 17,2 ms | 0 |

El motor registró p95 de 0,1 ms en ambas muestras. La sonda inicial compartía el descarte de intervalos superiores a 250 ms del reloj del juego; la versión final registra también esos intervalos si la escena está activa, sin trasladar el salto a la simulación. Por ello, la tabla es una referencia limitada de los intervalos registrados, no un benchmark controlado ni una prueba de ausencia de bloqueos largos.

Esto no demuestra una mejora perceptible: la muestra web no reprodujo los tirones del iPhone. No se ha medido rendimiento nativo, memoria, consumo, calentamiento ni sesiones largas. Queda pendiente comprobar el resultado en el iPhone con Expo Go y, para una comparación nativa de rendimiento, en una compilación de producción.

## Validación

- TypeScript y 59 pruebas: dificultad previa, rutas, selección única, colisiones, cuatro segundos de lectura, duraciones de confirmación, corrección antes del resumen, pausa, movimiento reducido, geometría y orden de profundidad.
- Cinco partidas deterministas de diez preguntas conservan 48 encuentros, 40 monedas, 1000 puntos y cero choques siguiendo rutas válidas.
- Navegador: acierto de Casa/House, tarjeta con +100 y racha 1, check completo, partículas, traducción y pausa. Dos capturas de la confirmación pausada fueron idénticas.
- Navegador: error Casa/Book con última vida, cruz completa, opción tachada, traducción Casa/House, pausa y paso posterior al resumen con errores y choques separados.
- Bundles web, Android e iOS exportados. La exportación no sustituye la prueba en un dispositivo.

Para repetir la sonda web, recarga la URL con `?profile=1`. La vista normal no contiene diagnósticos. Para revisar el juego en el iPhone, recarga el proyecto en Expo Go usando el servidor de desarrollo existente.

## Corrección del destello al cerrar la respuesta

En el video `IMG_2266.MP4` aportado por el usuario, la tarjeta termina de desvanecerse hacia 2,9617 s y reaparece en los fotogramas de 2,9783 y 2,9950 s, sin la cruz. Al empezar el siguiente tramo, `phaseTime` volvía a cero en el hilo de simulación mientras React todavía mostraba la tarjeta anterior. Eso reiniciaba su opacidad, entrada y dibujo del símbolo antes del desmontaje.

La tarjeta ahora conserva la identidad de su respuesta (partida, tipo y vencimiento) y calcula el avance con el reloj acumulado de simulación. Cuando termina esa respuesta permanece invisible, aunque React tarde en retirarla. El inicio de otro tramo, otra respuesta o una nueva partida no puede reactivarla. Se conservan la entrada, la oscilación del icono de error, el desvanecimiento, las duraciones y la pausa.

- TypeScript y 62 pruebas aprobadas. Las tres regresiones nuevas incluyen una tarjeta antigua retenida durante medio segundo después del cambio de fase, a pasos de 30/60/120 Hz, movimiento reducido, pausa, última vida y reinicio. Esto verifica la secuencia de animación, no el rendimiento del dispositivo.
- Navegador a 390 × 844: error Casa/Book, cruz completa y traducción, pausa y reanudación de la confirmación, retirada de la tarjeta al entrar en Ritmo 2. Sin errores de ejecución observados.
- Exportación web y bundles Hermes iOS/Android correctos. Falta confirmar visualmente la corrección en el iPhone con Expo Go; el video examinado corresponde al fallo anterior.
