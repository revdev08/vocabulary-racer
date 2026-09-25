# Prompt: mapas restantes (montaña, desierto, atardecer, nieve)

Copia todo lo que hay debajo de la línea y dáselo a tu agente. Da por hecho que ya existe la costa y la infraestructura de temas.

---

Continúa con los mapas del juego Vocab Racer. Ya existen el registro de temas (`src/game/config/maps.ts`), la ciudad y la costa. Tu tarea: añadir **montaña, desierto, atardecer y nieve**, en ese orden y **de uno en uno**. Sigue siendo obligatorio todo lo de `docs/city/maps-agent-prompt.md`: lee sobre todo la sección 4, «Regla de movimiento», y usa las plantillas de imagen de la sección 6. Este documento añade lo aprendido con la costa y el diseño concreto de cada mapa.

No cambies la jugabilidad, el motor, el HUD, los portales, los coches ni la costa y la ciudad (deben verse igual que ahora).

## 1. Lo que salió mal en la costa (no lo repitas)

1. **Paisaje cercano congelado.** La placa de fondo es una imagen fija. Las casas de la izquierda asomaban por encima de la pared baja (4,8 unidades) y las rocas de la derecha quedaban al descubierto tras el murete (0,38). Todo eso se veía quieto mientras la carretera avanzaba. Las capturas estáticas no lo detectaron; se vio en un video del teléfono. Se corrigió con dos opciones del tema:
   - `sky: true`: cielo estático sobre la línea de tejados. Es la placa reflejada desde el lado contrario.
   - `sea`: plano de agua en movimiento bajo el paseo.

   Consulta `docs/city/maps/coast.md`, sección «Corrección», y el shader en `src/game/geometry/sceneryShader.ts`.
2. **Atlas deformado.** Cada mitad del atlas (512 × 1536) se estira sobre `moduleLength × height` unidades. En la costa, 3 × 4,8 aplasta el dibujo verticalmente casi a la mitad. Regla: **`height ≈ 3 × moduleLength`** para no deformar. Si el diseño necesita otra proporción, genera el dibujo ya con esa proporción y explica en el doc la deformación intencionada.
3. **Medir, no confiar en el prompt.** El punto de fuga y la pendiente de la placa se miden en la imagen generada. Esto se hizo bien en la costa (`scripts/measure-coast.cjs`); repítelo en cada mapa.

## 2. Herramientas y pruebas que ya existen

- `node node_modules/typescript/bin/tsc -p tsconfig.geometry.json`, y después `node scripts/render-map-motion.cjs <mapa> <carpeta> [ancho alto]`. Renderiza los shaders reales del juego en dos momentos y guarda:
  - `<mapa>-<w>x<h>-a.png` y `-b.png`: los dos fotogramas;
  - `-static.png`: en rojo, los bloques cercanos con textura que **no** se movieron.

  Además imprime `staticShare`. Referencia: ciudad ≈ 0,02, costa corregida ≈ 0,03, costa con el fallo ≈ 0,25.
- La prueba `every registered map keeps its near scenery moving` (`tests/city/maps.test.cjs`) exige `staticShare < 0.05` a 390×844 y 320×568 para **todos** los mapas registrados. Tus mapas deben pasarla sin tocar el umbral.
- La prueba `all catalog levels resolve their unit map` comprueba hoy que montaña/desierto/atardecer/nieve caen a ciudad. Actualízala a medida que registres cada mapa.
- `/map-preview?map=<mapa>&pose=traffic|question|right&clean=1` (solo en desarrollo) sirve para las capturas.
- 3 pruebas de `journey.test.cjs` ya fallaban antes (catálogo de 3000 palabras). No son tuyas: no las ocultes ni las cuentes como regresión.

## 3. Extensión del motor necesaria (hazla con el primer mapa)

**Siluetas irregulares con alfa en el atlas de paredes.** Hoy la pared se corta en línea recta a `height` y el atlas es opaco. Montaña y nieve necesitan copas de árboles, crestas de roca y tejados con chimeneas contra el cielo. Cambio propuesto en `SCENERY_SURFACES_SKSL`: si el texel del atlas tiene alfa < 0,5, trata ese píxel como «sobre la línea de tejados». Así cae en la rama de cielo (`sky`) o, si el lado no tiene `sky`, se ve la placa. Genera esos atlas como PNG RGBA con la parte superior transparente. La ciudad y la costa (atlas opacos) no deben cambiar: compruébalo con sus capturas y con `render-map-motion`.

Si un lado necesita terreno abierto a lo lejos (campo nevado, dunas), generaliza `sea` a un plano abierto con material (agua, nieve, arena) en vez de duplicar código. Con los diseños de abajo no hace falta.

**Cuidado con `sky: true` en ambos lados:** el cielo se toma de la placa reflejada, así que por encima de la altura de las paredes la placa solo puede tener cielo o paisaje lejano **en los dos lados**. Genera las placas con los bordes laterales cercanos bajos (bordes del cañón, bosque, casas).

## 4. Diseño de cada mapa

Proporciones con `height ≈ 3 × moduleLength`. Pared a 2,75 carriles salvo que se indique otra cosa. Mide y ajusta todo tras generar.

### 4.1 `mountain`: Montaña alpina (hazlo primero; estrena la extensión de alfa)
- **Placa:** valle alpino recto hacia picos nevados en el punto de fuga, cielo azul de mañana. Laterales cercanos simples (roca y bosque bajos), porque el motor los tapará.
- **Izquierda:** pared de roca granítica con musgo y algún pino pequeño enraizado. Altura ≈ 12, módulo 4. Cresta irregular con alfa arriba, `sky: true`.
- **Derecha:** linde de bosque de pinos denso (troncos y ramas vistos de frente). Altura ≈ 7,5, módulo 2,5, copas irregulares con alfa, `sky: true`.
- **Suelo:** arcén de grava gris parda, sin juntas; bordillo de piedra.
- **Objeto de borde:** pino joven con una roca en la base.
- **Legibilidad:** la nieve de los picos queda lejos, alrededor del punto de fuga, pero no debe ser blanco puro detrás de los portales. Aplica un ligero tono azulado por la bruma.

### 4.2 `desert`: Cañón del desierto
- **Placa:** cañón recto con mesetas lejanas y cielo azul intenso de tarde. Los bordes del cañón en la placa quedan **bajos** (el motor pone paredes más altas).
- **Ambos lados:** paredes de arenisca con estratos horizontales, dos variantes alternas (`atlasVariant: -1`). Altura ≈ 14, módulo ≈ 4,7, `heightVariation` 2, borde superior irregular con alfa, `sky: true` en ambos.
- **Suelo:** arena compactada, sin juntas; bordillo de arenisca.
- **Objeto de borde:** saguaro o montículo de rocas.
- **Legibilidad:** ocres y tostados **apagados** en la mitad inferior, con sombra. Nada de rojos o naranjas saturados: el coche del jugador es rojo. Asfalto oscuro, como mucho un poco más cálido.

### 4.3 `sunset`: Ciudad al atardecer
- **Geometría idéntica a la ciudad:** paredes 18/20, módulo 6, `atlasVariant: -1`. El riesgo de congelación es mínimo.
- **Placa:** edita `background_city_v3.png` (misma cámara y encuadre) en hora dorada. El sol queda tapado por las torres, sin deslumbramiento en el horizonte ni cielo blanco detrás de la tarjeta.
- **Atlas:** edita `facades_city.png` con la misma distribución, para que enlace igual, con luz cálida y algunas ventanas encendidas.
- **Objeto de borde:** reutiliza `tree_planter.png` con un tinte cálido. Añade `roadside.tint` usando el buffer de color del `Atlas` (hoy es blanco más opacidad), sin coste extra.
- **Suelo y bruma:** pavimento y bruma algo más cálidos. El asfalto sigue oscuro.
- **Legibilidad:** el cielo naranja no puede saturar la mitad inferior; comprueba el contraste de la tarjeta y de los portales.

### 4.4 `snow`: Pueblo nevado
- **Placa:** pueblo alpino al fondo, cielo azul de invierno (nunca blanco), nieve en sombra azulada.
- **Izquierda:** casas de madera con balcones y tejados nevados. Altura ≈ 5,4, módulo 1,8, tejados y chimeneas con alfa, `sky: true`.
- **Derecha:** bosque de abetos nevados, altura ≈ 7,5, módulo 2,5, copas con alfa, `sky: true`.
- **Suelo:** nieve pisada azul grisácea, sin juntas; bordillo en forma de montículo de nieve.
- **Objeto de borde:** abeto nevado.
- **Legibilidad:** este es el mapa con más riesgo, porque el blanco compite con la tarjeta y los portales. Mantén la nieve cercana en valores medios y fríos.

## 5. Entrega por cada mapa (antes de pasar al siguiente)

1. Assets en `assets/game/maps/<mapa>/` (`backdrop.png`, `walls.png`, `roadside.png`), prompts finales guardados, punto de fuga y pendiente **medidos**, transparencia del sprite y del atlas verificada leyendo el canal alfa.
2. Tema registrado en `mapThemes` y asignado en `journeyMapCycle`, con las pruebas actualizadas.
3. `render-map-motion` a 320×568, 390×844 y 430×932. Guarda los PNG en `docs/city/maps/previews/` y revisa las máscaras `-static.png`: fuera de la calzada no puede quedar nada rojo que esté cerca de la carretera.
4. Capturas de `/map-preview` (tráfico, pregunta, carril derecho) en los tres tamaños.
5. `tsc --noEmit`, `eslint src scripts` y la suite `tests/city`: todo verde salvo las 3 de `journey` ya conocidas. Ciudad y costa sin cambios.
6. `docs/city/maps/<mapa>.md` con prompts, valores medidos, tabla de parámetros y enlaces a capturas, como `coast.md`.
7. **Un commit por mapa.** Después, para y entrégame:
   - las capturas y las máscaras de movimiento;
   - una lista de lo que no has podido comprobar (por ejemplo, el rendimiento en un teléfono real).

   Yo lo grabaré en el móvil antes de que sigas con el siguiente mapa.
