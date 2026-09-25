# Pueblo nevado

Mapa `snow`, rama `codex/map-snow`. Completa los seis temas del ciclo: costa, ciudad, montaña, desierto, atardecer y nieve. No modifica la simulación, las reglas, los coches, el HUD ni los portales.

## Cómo jugar

En Expo Go, recarga y vuelve al inicio: **Probar nieve →** abre `/race?map=snow` sin desbloquear mundos. Es una partida normal del primer nivel y guarda sus resultados; solo cambia el escenario. Este acceso y el parámetro de mapa son de desarrollo.

En el recorrido, nieve corresponde a la unidad 6, niveles 21–24, empezando por `es-en-u03-r002` («Cuerpo y salud · 2»), y a las siguientes vueltas del ciclo. El modo repaso conserva ciudad.

## Assets

Generados con **imagegen integrado**, modo generación con referencias locales de ciudad para cámara y calidad. [Prompts completos](snow-prompts.json). Se copiaron los PNG originales generados al proyecto, conservando su alfa.

| Asset en `assets/game/maps/snow/` | Contenido | Comprobación |
| --- | --- | --- |
| `backdrop.png` | Valle, pueblo lejano y cielo azul de invierno | 1024 × 1536, opaco |
| `walls.png` | Izquierda: fachadas de madera con balcones; derecha: bosque nevado | 1024 × 1536, 8,84 % transparente; mitad inferior continua |
| `roadside.png` | Un abeto joven nevado | 1024 × 1536, 66,21 % transparente; caja visible (192,37)–(861,1465) |

El alfa de tejados, chimeneas y copas activa el cielo del shader existente. No se añaden capas a pantalla completa, partículas, dependencias ni cambios en los shaders. Las casas y los árboles cercanos se proyectan y avanzan; la placa solo aporta el paisaje distante.

## Registro medido y materiales

`node scripts/measure-snow.cjs` reproduce [las mediciones](snow-measurements.json). Detecta los dos bordes nieve/asfalto en 17 filas entre y800 e y1200 y ajusta dos rectas. La nieve tiene un contorno suave, con desviaciones de hasta 6,22 píxeles en la fuente; no se han usado las coordenadas solicitadas al generador como si fueran medidas reales.

| Parámetro | Valor |
| --- | --- |
| Punto de fuga medido | (512,606567; 737,527167) px |
| Punto de fuga normalizado | (0,500592351; 0,480160916) |
| Pendientes izquierda / derecha | −0,813823529 / +0,810098039 |
| Pendiente media | 0,811960784 |
| Residuo máximo izquierdo / derecho | 4,31 / 6,22 px |
| Escala mínima / bordillo | 1,22 / ±1,54 carriles |
| Atmósfera / bruma de carretera | 0,018 / 0,08 |
| Casas izquierda | Distancia 2,75; altura 5,4; módulo 1,8; mitad 0 del atlas |
| Bosque derecha | Distancia 2,75; altura 7,5; módulo 2,5; mitad 1 del atlas |
| Repetición | 90 unidades, múltiplo de módulos reflejados, ruido y separación de abetos |
| Arcén | Nieve pisada RGB (0,52; 0,60; 0,70), sin juntas, grano 0,12 |
| Borde de nieve | Franja continua azul grisácea RGB (0,62; 0,69; 0,78) |
| Abetos | Altura 1,5; separación 2,5; 12 por lado; anclaje 1465/1536 |
| Asfalto | Pizarra oscuro RGB (0,223; 0,267; 0,316) |

Las mitades 512 × 1536 del atlas mantienen proporción 1:3 en ambos lados. Se reflejan módulos alternos para unir sus contornos. La nieve cercana usa valores medios y fríos para diferenciar el tráfico blanco y los portales; el rojo del jugador sigue destacando.

## Movimiento y capturas

Render de los shaders reales en distancias 3 y 3,55, con el umbral existente `staticShare < 0.05`. Las tres máscaras finales se inspeccionaron: sin bloques rojos.

| Tamaño | Bloques cercanos | Inmóviles | staticShare | Evidencia |
| --- | ---: | ---: | ---: | --- |
| 320 × 568 | 172 | 0 | 0 | [A](previews/snow-320x568-a.png), [B](previews/snow-320x568-b.png), [máscara](previews/snow-320x568-static.png) |
| 390 × 844 | 365 | 0 | 0 | [A](previews/snow-390x844-a.png), [B](previews/snow-390x844-b.png), [máscara](previews/snow-390x844-static.png) |
| 430 × 932 | 434 | 0 | 0 | [A](previews/snow-430x932-a.png), [B](previews/snow-430x932-b.png), [máscara](previews/snow-430x932-static.png) |

Capturas web de `/map-preview?map=snow&pose=traffic|question|right&clean=1`:

| Tamaño | Tráfico | Pregunta | Carril derecho |
| --- | --- | --- | --- |
| 320 × 568 | [Ver](previews/snow-320-traffic.png) | [Ver](previews/snow-320-question.png) | [Ver](previews/snow-320-right.png) |
| 390 × 844 | [Ver](previews/snow-390-traffic.png) | [Ver](previews/snow-390-question.png) | [Ver](previews/snow-390-right.png) |
| 430 × 932 | [Ver](previews/snow-430-traffic.png) | [Ver](previews/snow-430-question.png) | [Ver](previews/snow-430-right.png) |

## Verificaciones y límites

- TypeScript de aplicación y geometría, y ESLint `src scripts`: correctos.
- Suite `tests/city`: 133 pruebas, 130 correctas y los tres fallos previos de `journey.test.cjs` (numeración, ampliación de catálogo y paginación). No se ocultaron.
- Pruebas nuevas: alfa real, siluetas irregulares, continuidad inferior, anclaje del abeto, perspectiva, proporción de módulos y repetición sin salto.
- Diez renders de los otros cinco mapas (dos por mapa a 390 × 844) permanecen idénticos byte a byte. [Hashes antes/después](snow-regression.json).
- Exportación web, iOS y Android correcta en `.qa/snow-export`. Esto comprueba bundles, no ejecución nativa.
- Acceso del inicio probado con cero niveles completados, deslizamientos izquierda/centro, respuesta correcta y pausa funcional; sin errores de consola. [Inicio](previews/snow-home-access.png) y [partida real](previews/snow-live.png).

En 320 px el HUD existente abrevia la etiqueta de monedas; los contadores y las respuestas siguen visibles. No se cambió la interfaz en esta entrega.

Pendiente en dispositivo: vídeo de Expo Go en iPhone, legibilidad con distintos brillos, comportamiento prolongado, memoria, temperatura y FPS medidos. No se afirma rendimiento nativo medido. Todos los mapas previstos están implementados; falta la revisión del usuario en móvil.
