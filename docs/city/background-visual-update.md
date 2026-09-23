# Fondo urbano: revisión visual

## Revisión actual: adaptación a los tres carriles

El cambio de encuadre de conducción había dejado aceras a ±3,5 unidades laterales, aunque la carretera jugable termina en ±1,5. Esto hacía que el asfalto pareciera una calzada estrecha superpuesta sobre una avenida demasiado ancha.

Se usa ahora `assets/game/backgrounds/background_city_v3.png` (1024 × 1536), una edición de v2 con cámara más elevada y una calle más estrecha. Conserva el estilo de edificios, vegetación, materiales y luz. Generado con `image_gen` integrado; [prompt completo](background-generation-prompt.md). Las versiones anteriores se conservan.

- Posición: punto de fuga observado del asset en X 49,6% / Y 44,1%, registrado con el centro y horizonte de la cámara del juego.
- Escala: ancho mínimo del 122%; cobertura adicional uniforme para cubrir por encima y por debajo del horizonte. En los tamaños revisados resulta aproximadamente un 141–142% del ancho. La escala vertical registra la pendiente observada de las aceras (0,47) con la proyección de la carretera.
- Unión con la carretera: aceras a ±1,54 unidades laterales, inmediatamente fuera de los tres carriles (±1,5); desaparecen los grandes espacios de asfalto laterales. Los edificios y las aceras enmarcan también la zona de portales y el primer plano.
- Atmósfera sin cambios: overlay radial máximo del 4%, radio del 22% del ancho; bruma del shader del asfalto máxima del 12%. No se añade una banda horizontal de niebla.
- El fondo permanece fijo. No se modifica la cámara del juego, el carro, HUD, portales, gestos, pausa ni simulación.

Medidas del fondo en la vista web, sin insets nativos:

| Pantalla | Origen X / Y | Tamaño del fondo | Horizonte |
| --- | --- | --- | --- |
| 320 × 568 | −65,3 / −51,0 | 454,3 × 619,0 | 222,0 |
| 390 × 844 | −78,0 / −107,2 | 550,3 × 951,2 | 312,3 |

Archivos de implementación: nuevo asset v3, `config/assets.ts`, `config/visual.ts` y `world/CityBackdrop.tsx`. Documentación: este archivo, `background-generation-prompt.md` y `README.md`.

Verificación de esta revisión: TypeScript sin errores, 15/15 pruebas existentes aprobadas, exportación web correcta y revisión visual real en navegador a 320 × 568 y 390 × 844. Se comprobó también el carro completo en el carril derecho. Los hashes del carro y textura de asfalto permanecen iguales. No se realizó una prueba nueva en dispositivo nativo. Las capturas antiguas de `docs/previews` pertenecen a la etapa estática y no muestran v3.

## Historial: fondo v2 de la etapa estática

Los valores y comprobaciones que siguen corresponden a la revisión anterior, previa al encuadre de conducción.

Se sustituyó el fondo por `assets/game/backgrounds/background_city_v2.png`, una imagen de 1024 × 1536 generada con la herramienta integrada de imagen. El fondo anterior se conserva. [Prompt y procedencia](background-generation-prompt.md).

## Posición y escala

- Punto de fuga medido en la imagen: 50% horizontal y 47,6% vertical. Se registra exactamente con `camera.centerX` y `camera.horizonY`.
- Ancho del fondo: 122% del ancho del lienzo, centrado; recorte lateral del 11% por lado.
- La escala vertical se calibra con la inclinación de las aceras y la cámara existente. Se ajusta únicamente la imagen ambiental; no se modifica la proyección de los carriles, portales ni carro.
- La imagen conserva fachadas en los laterales hasta la zona de elección, con una avenida despejada que continúa hacia el primer plano.

Ejemplos en puntos de pantalla, con las mismas áreas seguras de las capturas:

| Pantalla | Origen X / Y del fondo | Tamaño renderizado | Horizonte |
| --- | --- | --- | --- |
| 320 × 568 | −35,2 / −79,1 | 390,4 × 674,5 | 242,0 |
| 390 × 844 | −42,9 / −211,4 | 475,8 × 1100,1 | 312,3 |

La escala vertical es independiente de la horizontal para registrar las aceras de la imagen con el plano de la carretera en cada proporción de pantalla. Este ajuste no se aplica al asset del carro.

## Atmósfera y unión con la carretera

- Eliminada la banda horizontal de 58 puntos cuya opacidad máxima era 53,3% (`#88`).
- Eliminado el degradado azul inferior que llegaba a opacidad total.
- Atmósfera nueva: degradado radial localizado en el punto de fuga, radio del 22% del ancho y opacidad máxima del 4%.
- Bruma del shader del asfalto reducida del 72% al 12% máximo; decae más rápido hacia el primer plano.
- El asfalto conserva la iluminación del fondo a distancia y mezcla progresivamente la textura dibujada hasta el 48% de profundidad de pantalla. Los bordes se suavizan para evitar un triángulo opaco pegado encima de la avenida.
- Las aceras y fachadas del nuevo fondo sustituyen las antiguas bandas laterales y barandillas dibujadas. Los tres carriles, sus dos separadores internos y las líneas exteriores conservan la misma geometría.
- El primer plano mantiene tonos oscuros y poco contraste; el rojo del carro sigue siendo el acento dominante.

## Archivos

- Nuevo asset: `assets/game/backgrounds/background_city_v2.png`.
- Nuevo componente visual: `src/game/world/CityBackdrop.tsx`.
- Ajustados: `src/game/world/GameWorld.tsx`, `src/game/world/Road.tsx`, `src/game/config/visual.ts`, `src/game/config/assets.ts`.
- Capturas actualizadas: `docs/previews/narrow.png` y `docs/previews/tall.png`.
- Documentación actualizada: `README.md` y estos documentos de fondo.

## Comprobaciones

TypeScript y las seis pruebas existentes de composición pasan. Revisión visual real en navegador a 320 × 568 y 390 × 844, con áreas seguras simuladas; sin errores JavaScript y con fotogramas estáticos idénticos. Exportaciones web, Android e iOS correctas. La vista previa local abierta se recargó con el nuevo fondo.

Se verificaron por SHA-256, sin cambios: asset del carro, HUD, palabra y botón de audio, etiquetas de portales, iconos, cálculos de perspectiva, pantalla principal y archivos de dependencias. No se añadieron sistemas, lógica ni animaciones.

No se realizó una nueva prueba visual en dispositivo nativo. Las exportaciones Android/iOS verifican el empaquetado, no la apariencia en un teléfono físico.
