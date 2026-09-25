# Desierto: cañón de arenisca

Segundo mapa de `maps-remaining-prompt.md`, después de montaña. Rama `codex/map-desert`. Atardecer y nieve quedan pendientes de la revisión de este mapa en el teléfono.

## Probar desde el inicio

En Expo Go, vuelve al inicio y pulsa **Probar desierto →**. Si no aparece, recarga el proyecto. Es un acceso de desarrollo a `/race?map=desert`: inicia una carrera normal del primer nivel usando el desierto, sin desbloquear el mundo 4. La partida guarda sus resultados normales; solo cambia el escenario. El acceso y el parámetro de mapa no se habilitan en producción.

[Captura del acceso en el inicio](previews/desert-home-access.png). Se comprobó el enlace con cero niveles completados en web, seguido de deslizamientos a derecha y centro (carriles 3 y 2) y pausa. [Carrera A](previews/desert-live-a.png), [carrera B](previews/desert-live-b.png). La consola no registró errores durante esta revisión. Esto no sustituye la comprobación táctil nativa en el iPhone.

También funciona `/map-preview?map=desert&pose=traffic`: «Animar tráfico de prueba» activa la inspección automática, y «Jugar este mapa» abre la carrera controlable.

En el catálogo se asigna a la unidad 4 (niveles 13–16) y a las unidades posteriores correspondientes al ciclo existente. El primero es `es-en-u01-r001`, «Personas y relaciones · 1». No se alteró el desbloqueo ni la jugabilidad.

## Assets y mediciones

Los tres PNG se generaron con la herramienta integrada image_gen, usando los assets de ciudad como referencia de cámara, perspectiva, iluminación y calidad. Los originales generados se conservaron; las copias del proyecto están en `assets/game/maps/desert/`. [Prompts finales completos](desert-prompts.json).

| Archivo | Contenido | Alfa verificado |
| --- | --- | --- |
| `backdrop.png` | Cielo azul, mesetas lejanas, carretera recta y laterales bajos | Opaco |
| `walls.png` | Dos alzados de arenisca estratificada, crestas irregulares | 8,885 % completamente transparente; mitad inferior sólida al umbral 0,5 |
| `roadside.png` | Saguaro aislado, sin suelo ni sombra proyectada | 76,395 % completamente transparente |

Los tres miden 1024 × 1536. Caja visible del cactus, con alfa >32: (244,43)–(781,1492); apoyo vertical 1492/1536. Las mitades del atlas tienen variación real en el borde superior (izquierda y19–223; derecha y77–246 en las muestras).

`node scripts/measure-desert.cjs` lee los PNG y reproduce [desert-measurements.json](desert-measurements.json). Se detectaron los bordes del asfalto en 17 filas, de y800 a y1200. Las coordenadas pedidas al generador no se usaron como medida.

| Registro | Valor |
| --- | --- |
| Punto de fuga medido | (513,277710; 742,714209) px |
| Coordenadas normalizadas | (0,501247764; 0,483537896) |
| Pendiente izquierda / derecha | −1,002254902 / +0,996666667 |
| Pendiente media absoluta | 0,999460784 |
| Residuo máximo del ajuste | 1,04 px |
| Ancho mínimo / borde de carretera | 1,22 / 1,54 carriles |
| Atmósfera radial / bruma de asfalto | 0,018 / 0,08 |

## Configuración y movimiento

| Elemento | Parámetros |
| --- | --- |
| Paredes | ±2,75 carriles, altura base 14, variación 2, módulo 4,7 |
| Variantes | `atlasVariant: -1` a ambos lados; alturas 14 y 16 alternas |
| Crestas | Alfa <0,5 deja ver el cielo con `sky: true` |
| Arena compactada | Sin juntas; grano 0,14 en coordenadas del mundo |
| Bordillo | Arenisca gris parda, con textura móvil |
| Período del entorno | 28,2 unidades: 3 pares de módulos, 12 separaciones de cactus |
| Cactus | Alto 1,65, lateral ±2,12, separación 2,35, desfase derecho 1,175, 12 por lado |
| Asfalto | Oscuro, RGB normalizado (0,238; 0,265; 0,299) |

Cada mitad del atlas es 512 × 1536 (1:3). El módulo base 4,7 × 14 difiere un 0,7 % de esa proporción; el módulo alto 4,7 × 16 estira intencionadamente un 13,5 % para la variación de altura de 2 unidades pedida en el diseño. No se cambia el sprite ni las proporciones del coche.

El mapa reutiliza el shader con transparencia y grano del trabajo de montaña. No se cambió el shader, la carretera ni el motor. Las paredes, arena y cactus avanzan en el sistema de coordenadas existente; la placa lejana y el horizonte permanecen fijos. Solo se decodifican las imágenes del tema activo.

## Prueba de movimiento

Render real de los shaders, distancias 3 y 3,55, conservando el umbral `staticShare < 0.05`. Se revisaron las tres máscaras: están transparentes, sin bloques rojos.

| Tamaño | Bloques cercanos | Inmóviles | staticShare | Evidencia |
| --- | ---: | ---: | ---: | --- |
| 320 × 568 | 175 | 0 | 0 | [A](previews/desert-320x568-a.png), [B](previews/desert-320x568-b.png), [máscara](previews/desert-320x568-static.png) |
| 390 × 844 | 388 | 0 | 0 | [A](previews/desert-390x844-a.png), [B](previews/desert-390x844-b.png), [máscara](previews/desert-390x844-static.png) |
| 430 × 932 | 456 | 0 | 0 | [A](previews/desert-430x932-a.png), [B](previews/desert-430x932-b.png), [máscara](previews/desert-430x932-static.png) |

## Capturas

| Tamaño | Tráfico | Pregunta | Carril derecho |
| --- | --- | --- | --- |
| 320 × 568 | [Ver](previews/desert-320-traffic.png) | [Ver](previews/desert-320-question.png) | [Ver](previews/desert-320-right.png) |
| 390 × 844 | [Ver](previews/desert-390-traffic.png) | [Ver](previews/desert-390-question.png) | [Ver](previews/desert-390-right.png) |
| 430 × 932 | [Ver](previews/desert-430-traffic.png) | [Ver](previews/desert-430-question.png) | [Ver](previews/desert-430-right.png) |

## Regresión y comprobaciones

Ciudad, costa y montaña se renderizaron antes/después a 390 × 844, dos fotogramas por mapa. Los seis PNG son idénticos byte a byte: [hashes](desert-regression.json). La prueba común sigue comprobando todos los mapas registrados también a 320 × 568.

- TypeScript de app y geometría: correcto.
- ESLint `src scripts`: correcto.
- Suite `tests/city`: 129 pruebas, 126 pasan. Las tres fallidas son las previas de `journey.test.cjs`: numeración/claves, extensión de catálogo y paginación; no se ocultaron.
- Pruebas nuevas: alfa real, crestas irregulares, apoyo del cactus, registro de placa, proporciones y continuidad del período del entorno.
- Exportación Expo de web, iOS y Android: correcta (`.qa/desert-export`). Se exportaron bundles; no se ejecutó una app nativa en este equipo.

Pendiente de dispositivo: grabación en iPhone/Expo Go, lectura durante una carrera prolongada, repetición visual de los módulos de roca, diferencias del shader en Metal/Android y medidas reales de FPS, memoria y temperatura. Las capturas web y la comparación entre dos instantes no certifican rendimiento nativo. Se detiene aquí la entrega antes de iniciar atardecer.
