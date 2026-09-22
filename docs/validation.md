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
