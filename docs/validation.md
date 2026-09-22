# Validación de la primera versión

Fecha: 2026-09-21.

- `expo lint`: correcto, sin errores ni advertencias.
- `tsc --noEmit`: correcto.
- Pruebas del motor: 6/6 correctas.
- `expo export --platform all`: bundles web, iOS y Android generados correctamente. No constituye una compilación nativa firmada ni una prueba en teléfono.
- Navegador: inicio renderizado, carretera inspeccionada visualmente, inicio de carrera, botón izquierdo, acierto de Hello (+100), choques con pérdida individual de vida, pantalla final tras tres choques, mensaje de guardado local, reinicio y modal de pausa verificados.
- El guardado usa AsyncStorage y conserva el récord y la lista de práctica. Las pruebas del navegador dejan resultados locales de prueba en ese navegador.
- Se fijó ESLint a la rama 9 porque el plugin de React de la configuración Expo instalada no funciona con ESLint 10. Revisar esa compatibilidad al actualizar herramientas.

Pendiente: instalación y pruebas físicas iOS/Android; gestos táctiles, hápticos y comportamiento en segundo plano en ambos sistemas; perfilado de FPS; prueba de recompensas/guardado frente a fallos de almacenamiento. No hay cuentas ni compras en esta entrega.

## Escenario y movimiento — 2026-09-22

- TypeScript y Expo lint correctos.
- 9/9 pruebas: seis del juego y tres de proyección. Verifican contacto del encuentro con el carro, límites de pantalla y separación de las opciones para anchos de 320, 375, 390 y 520 píxeles.
- Exportación web, iOS y Android correcta con ambos PNG incluidos.
- Transparencia real de ambos sprites verificada en su canal alfa; no se entregaron las variantes con damero.
- Inspección visual en navegador: casas detalladas junto a la carretera, opciones proyectadas y nuevo carro renderizados correctamente.
- Rendimiento en teléfonos físicos todavía no medido.


## Visual revision — 2026-09-22

- Verified supplied sports car, neutral-blue signs, readable single-line choices, segmented lives, steering, and road-aligned dashes in browser at 375 × 812 and default 520-wide game frame.
- House alpha checked: RGBA 0–255; new sprite is oriented and projected along the left sidewalk.
- 10 unit tests passed, including a new check that both endpoints of each dash remain on its lane divider across viewport aspect ratios.
- TypeScript, lint and platform export checked for this revision. Native device visual/performance verification remains outstanding.
