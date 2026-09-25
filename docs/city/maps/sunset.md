# Ciudad al atardecer

Mapa `sunset`, rama `codex/map-sunset`. Mantiene la geometría de ciudad y cambia la iluminación, el cielo, algunas ventanas y los materiales del pavimento. Nieve queda pendiente de la revisión de esta entrega en el teléfono.

## Acceso directo

En Expo Go: vuelve al inicio y pulsa **Probar atardecer →**. Recarga el proyecto si no aparece. El acceso de desarrollo abre `/race?map=sunset` con una partida normal del primer nivel: no exige desbloquear la unidad 5. Guarda los resultados normales del nivel jugado; el parámetro solo cambia el escenario y se ignora en producción.

La vista de inspección está en `/map-preview?map=sunset&pose=traffic`. Permite animar el tráfico de prueba o entrar a una partida con «Jugar este mapa».

En el catálogo corresponde a la unidad 5 (niveles 17–20) y a sus siguientes apariciones en el ciclo existente. Primer nivel: `es-en-u02-r001`, «Casa y vida diaria · 1».

## Assets y procedencia

Se usó image_gen integrado en modo edición, con los originales de ciudad como referencia maestra de cámara, encuadre y arquitectura. [Prompts completos](sunset-prompts.json).

| Archivo | Cambio | Verificación |
| --- | --- | --- |
| `assets/game/maps/sunset/backdrop.png` | Edición de `background_city_v3.png`: hora dorada, sol oculto, cielo azul violáceo y melocotón moderado | 1024 × 1536; opaco |
| `assets/game/maps/sunset/walls.png` | Edición de `facades_city.png`: misma distribución, piedra cálida y algunas ventanas encendidas | 1024 × 1536; opaco |
| `assets/game/scenery/tree_planter.png` | Se reutiliza, sin editar ni duplicar el PNG | 51,415 % de píxeles totalmente transparentes; caja visible (53,12)–(974,1497) |

Para este mapa, la instrucción específica de reutilizar el árbol prevalece sobre la plantilla genérica de tres archivos por mapa. Los originales de ciudad permanecen intactos.

## Registro y parámetros

`node scripts/measure-sunset.cjs` reproduce [las mediciones](sunset-measurements.json). Se detectó el bordillo interior en 21 filas (y800–1300). Se redujo el umbral de detección de brillo porque el bordillo de la edición queda en sombra: el umbral diurno saltaba hasta la acera exterior en algunas filas. Se inspeccionaron los valores RGB alrededor del borde antes de ajustar la detección.

| Parámetro | Valor |
| --- | --- |
| Punto de fuga medido | (511,571391; 684,835641) px |
| Punto de fuga normalizado | (0,499581436; 0,445856537) |
| Pendiente izquierda / derecha | −0,462805195 / +0,456415584 |
| Pendiente media absoluta | 0,459610390 |
| Residuo máximo del ajuste | 3,28 px izquierda; 1,87 derecha |
| Escala mínima / borde de carretera | 1,22 / 1,54 carriles |
| Atmósfera radial / bruma de carretera | 0,025 / 0,10 |
| Paredes | ±2,75 carriles; 18/20 de altura; módulo 6; variantes alternas |
| Pavimento | Mismas baldosas y juntas que ciudad, tonos gris malva cálidos; grano 0,09 |
| Período del entorno | 12 unidades, igual que ciudad |
| Árboles | Geometría y cantidad idénticas a ciudad; tinte RGB (1; 0,88; 0,72) |
| Asfalto | Oscuro, RGB normalizado (0,230; 0,251; 0,292) |

El atlas conserva la distribución original. Cada mitad es 512 × 1536 y se proyecta en módulos de 6 × 18/20: la variante de 20 mantiene el mismo estiramiento vertical del 11,1 % que ya existe en ciudad.

`roadside.tint` se aplica al buffer de color que ya utiliza el `Atlas`. No añade texturas, capas ni pasadas de dibujo. La opacidad sigue dependiendo de la distancia. Los otros mapas usan RGB blanco por defecto. El shader de paredes y la simulación permanecen iguales.

## Movimiento y capturas

La placa lejana conserva su posición. Las fachadas, árboles y pavimento avanzan con la proyección compartida. El grano del pavimento evita que las zonas lisas de acera parezcan estáticas. Se mantuvo el umbral de prueba `staticShare < 0.05`.

| Tamaño | Bloques cercanos | Inmóviles | staticShare | Render real y máscara |
| --- | ---: | ---: | ---: | --- |
| 320 × 568 | 178 | 0 | 0 | [A](previews/sunset-320x568-a.png), [B](previews/sunset-320x568-b.png), [máscara](previews/sunset-320x568-static.png) |
| 390 × 844 | 394 | 0 | 0 | [A](previews/sunset-390x844-a.png), [B](previews/sunset-390x844-b.png), [máscara](previews/sunset-390x844-static.png) |
| 430 × 932 | 457 | 0 | 0 | [A](previews/sunset-430x932-a.png), [B](previews/sunset-430x932-b.png), [máscara](previews/sunset-430x932-static.png) |

Se inspeccionaron las tres máscaras finales: transparentes, sin bloques rojos. La comparación usa distancias 3 y 3,55; no es una medición de FPS.

| Tamaño | Tráfico | Pregunta | Carril derecho |
| --- | --- | --- | --- |
| 320 × 568 | [Ver](previews/sunset-320-traffic.png) | [Ver](previews/sunset-320-question.png) | [Ver](previews/sunset-320-right.png) |
| 390 × 844 | [Ver](previews/sunset-390-traffic.png) | [Ver](previews/sunset-390-question.png) | [Ver](previews/sunset-390-right.png) |
| 430 × 932 | [Ver](previews/sunset-430-traffic.png) | [Ver](previews/sunset-430-question.png) | [Ver](previews/sunset-430-right.png) |

## Comprobaciones y límites

- TypeScript de app y geometría, y ESLint `src scripts`: correctos.
- Suite `tests/city`: 131 pruebas; 128 pasan. Permanecen las tres previas de `journey.test.cjs` (numeración/claves, ampliación de catálogo y paginación), sin ocultarlas.
- Nuevas pruebas: geometría y cantidad de árboles idénticas a ciudad, aislamiento del tinte, registro de la placa, opacidad de imágenes y transparencia real del árbol compartido.
- Exportación web, iOS y Android: correcta (`.qa/sunset-export`); son bundles, no una ejecución nativa.
- Navegador a 390 × 844: el [botón del inicio](previews/sunset-home-access.png) abre la partida sin niveles completados. Se comprobaron deslizamientos a izquierda y derecha, reinicio y menú de pausa; no se registraron errores de consola. Capturas de partida real: [primera partida](previews/sunset-live-a.png) y [carril derecho tras reiniciar](previews/sunset-live-b.png).
- Ciudad, costa, montaña y desierto: los ocho renders antes/después a 390 × 844 (dos por mapa) son idénticos byte a byte. [Hashes](sunset-regression.json). La prueba común también revisa movimiento de todos los mapas a 320 × 568.

Pendiente: grabación en iPhone/Expo Go, legibilidad en diferentes brillos de pantalla, rendimiento prolongado, memoria, temperatura, FPS medidos y diferencias entre renderizado web, Metal y Android. No se afirma rendimiento nativo medido. No iniciar nieve hasta revisar este mapa.
