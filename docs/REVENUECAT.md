# Compras de Dashword

Integración nativa: react-native-purchases y react-native-purchases-ui 10.10.2.
La app muestra el paywall publicado en RevenueCat para la oferta `default`.
Todos sus productos deben otorgar el entitlement `plus`; producto iOS inicial: `dashword_plus_monthly`.

## Configuración

- Clave pública iOS configurada en src/subscriptions/config.ts. Puede reemplazarse mediante EXPO_PUBLIC_REVENUECAT_IOS_KEY en EAS.
- Android requiere EXPO_PUBLIC_REVENUECAT_ANDROID_KEY, app de Google Play y producto asociado al mismo entitlement/offering. Sin esa clave no se permiten compras ni carreras en builds Android nativos.
- No usar claves secretas RevenueCat ni archivos Apple .p8 en variables EXPO_PUBLIC.
- Precios, prueba de 3 días, elegibilidad, textos, diseño, enlaces de privacidad y términos se configuran en Apple/RevenueCat. Verificar enlaces reales y estados elegible/no elegible en el paywall antes de enviar a revisión.
- No hay precio ni prueba ficticia calculados localmente. Los cambios publicados del paywall no requieren reconstruir la interfaz propia.

## Acceso

SubscriptionProvider configura una identidad anónima persistida por RevenueCat (sin login obligatorio), escucha CustomerInfo y vuelve a consultar al regresar a la app.
RaceAccessGate comprueba acceso antes de montar el juego, incluidas URLs directas y repasos. Cada nuevo nivel y repetición vuelve a comprobar. Una carrera autorizada puede terminar aunque cambie el acceso; la siguiente lo exige de nuevo.
La confirmación del paywall por sí sola no concede acceso: se consulta CustomerInfo.entitlements.active.plus.isActive.
Cancelar, compra pendiente, error o falta de entitlement no desbloquean. No se guarda un booleano premium en AsyncStorage ni se modifica progreso.
La caché de CustomerInfo la administra el SDK; no es una validación de servidor propia ni una protección contra modificar una app con contenido local.
Desde el inicio se ofrecen activar Plus/gestionar suscripción y restaurar compras. Para compartir compras iOS/Android habrá que vincular la misma identidad de usuario cuando se implemente login.

## Desarrollo y pruebas

Web y Expo Go en __DEV__ permiten jugar para desarrollo, indican ese modo y no realizan compras ni crean un entitlement simulado. Este bypass no existe en builds de producción. Web de producción no habilita el juego ni checkout web; esa plataforma no tiene facturación configurada.
La vista /map-preview está limitada a __DEV__. Los builds nativos de tienda no usan bypass.

1. Generar build nuevo iOS production (Expo Go no prueba compras reales).
2. Subir a TestFlight para Dashword 6817377110; verificar que se vea el paywall remoto publicado.
3. Usuario elegible: comprobar precio localizado y 3 días; completar compra sandbox y verificar plus activo en RevenueCat.
4. Usuario no elegible: comprobar que no prometa otra prueba.
5. Cancelar el paywall y el diálogo Apple: no debe iniciar carrera.
6. Restaurar con suscripción activa y sin ella; probar reinstalación con la misma cuenta Apple y política de restauración RevenueCat.
7. Probar renovación, expiración, reembolso y cancelación de renovación (conserva acceso durante período pagado).
8. Probar modo avión, errores al cargar offerings, regresar desde Ajustes y doble pulsación.
9. Probar iPhone/iPad, tamaños de texto y enlaces legales.

Validación local: tests/subscriptions.test.mjs prueba la decisión de acceso y carreras de solicitudes, sin compras ni conexiones a tiendas. No reemplaza TestFlight.
