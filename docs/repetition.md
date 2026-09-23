# Niveles y repetición del MVP urbano

## Carreras finitas

El catálogo inicial contiene 120 entradas propias (palabras y algunas expresiones útiles), distribuidas en 12 niveles temáticos de 10. Las bandas Inicial, Cotidiano y En expansión son una organización editorial; no certifican niveles CEFR. Ver `src/game/data/vocabulary.ts`.

Una carrera de nivel presenta sus 10 palabras diferentes y permite hasta 3 preguntas adicionales de repaso: máximo 13 respuestas. Termina antes si se pierden las tres vidas. Mantiene tráfico → pregunta → confirmación, con el mismo movimiento del mapa urbano.

Completar la carrera con al menos 8/10 aciertos en la primera presentación de sus palabras desbloquea el siguiente nivel. Los aciertos de preguntas adicionales dan puntos, pero no cuentan dos veces para el desbloqueo. Choques y monedas no alteran el estado de memoria. Un nivel superado no se vuelve a bloquear por fallar en otro intento.

## Presentación de niveles

El inicio agrupa el catálogo en tres etapas de cuatro niveles: Primeros kilómetros (1–4), Vida cotidiana (5–8) y Nuevos horizontes (9–12). Cada etapa muestra una carretera con puntos de control numerados, estados de completado/disponible/bloqueado y el mejor intento de los niveles superados. Un panel inferior permite consultar palabras y jugar el nivel seleccionado. Explorar etapas futuras no cambia los desbloqueos ni el progreso guardado.

El mapa es vectorial y adaptable al ancho del teléfono. No requiere imágenes nuevas ni depende de la carpeta de referencia. La agrupación visual se define en `src/components/learning/LevelRoadmap.tsx`; al ampliar el catálogo hay que incorporar sus etapas a esta definición.

## Dos escalas de repetición

- Dentro de una carrera: una traducción equivocada vuelve después de tres preguntas intermedias, si quedan vidas y presupuesto. Nunca sustituye una de las diez palabras del nivel. Los errores cercanos al final se trasladan a la siguiente sesión; no se añaden preguntas de relleno ni se prolonga indefinidamente la partida.
- Entre carreras: las palabras falladas y no recuperadas quedan vencidas inmediatamente; si se recuperan en la misma carrera, vuelven a los 10 minutos. Un acierto sin errores avanza por intervalos de 1, 3, 7 y 14 días. Practicar antes de la fecha no adelanta una etapa ya consolidada.
- Cada nivel prioriza sus palabras vencidas y mezcla el orden de las demás. Puede incorporar una palabra vencida de otros grupos; las otras dos plazas adicionales se reservan para fallos recientes. La cola da prioridad a los errores de la carrera cuando ya les toca volver.
- «Repasar ahora» selecciona hasta diez palabras vencidas, empezando por las más antiguas, más hasta tres repeticiones. No introduce palabras que no se hayan registrado antes ni desbloquea niveles. Una sesión con una sola palabra termina después de esa respuesta: si falla, sigue pendiente, sin repetirla inmediatamente.

Este es un planificador sencillo basado en etapas, no SM-2 ni FSRS. Sus parámetros son explícitos y se pueden ajustar después de medir retención real. Reconocer una traducción entre tres opciones no equivale a dominar la palabra o poder usarla espontáneamente.

## Persistencia y voz

AsyncStorage conserva resultados de niveles, mejor puntuación, fechas de repaso, etapa y fallos por ID estable. Se migran los registros anteriores sin borrar récords. El guardado de cada carrera es serial e idempotente y actualiza niveles y memoria en una sola escritura. Se guarda al terminar por meta o por vidas. Salir desde la pausa descarta el intento, como indica el botón. Todavía no hay sincronización entre dispositivos.

Expo Speech pronuncia **la respuesta correcta en inglés** después de cada elección, tanto acertada como fallada. No pronuncia el distractor ni los choques. Una respuesta genera una sola locución. La pausa y el paso a segundo plano detienen la voz; desde pausa o resultados se puede escuchar la última respuesta. La preferencia de audio se conserva localmente. En iPhone el modo silencio puede impedir la salida de voz; las voces disponibles dependen del dispositivo/navegador. No se ha validado acústicamente en teléfonos físicos.

## Escalar hacia 3000

La [lista de EF](https://www.ef.com/wwes/recursos-aprender-ingles/vocabulario-ingles/3000-palabras/) es una referencia de frecuencia ordenada alfabéticamente, sin traducciones ni clasificación de dificultad. **No se han importado 3000 traducciones ni se promete un porcentaje de comprensión por completar este MVP.** El catálogo inicial es editorial y contiene también expresiones prácticas que no son entradas individuales de esa lista.

Para ampliar, incorporar lotes revisados de 10 entradas por nivel (objetivo aproximado: 300 niveles). Cada entrada necesita ID estable, significado español inequívoco, respuesta inglesa y dos distractores incompatibles con ese significado. Mantener orden e IDs de los niveles publicados y añadir nuevos al final para preservar el progreso. Los homógrafos y sentidos nuevos deben tener IDs distintos; no cambiar la traducción de un ID ya estudiado para representar otro sentido. No asignar CEFR automáticamente a partir de la posición en la lista.

Antes de cargar el catálogo completo: revisar sentidos y distractores con una persona bilingüe, añadir ejemplos y parte de la oración, ampliar la navegación entre etapas para no presentar 300 puntos de control a la vez, y preparar contenido versionado descargable. Posteriormente, sincronizar intentos por usuario en Supabase; autenticación y RevenueCat no forman parte de esta entrega.

## Validación

`pnpm test`: física existente, los doce niveles completos, repetición a tres preguntas, límites, desbloqueo, errores tardíos, migración, escritura concurrente/idempotente y selección de voz correcta para aciertos y errores. `pnpm typecheck` y `pnpm lint`. La exportación multiplataforma comprueba bundles, no sustituye pruebas de audio ni rendimiento en dispositivos reales.
