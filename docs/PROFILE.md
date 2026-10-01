# Perfil y requisitos de publicación

La pantalla de niveles enlaza a `/profile`; gestionar suscripción y restaurar compras están en el perfil y usan el proveedor de RevenueCat existente. El onboarding también permite abrir el perfil sin suscripción. No se ha creado una cuenta de usuario ni un segundo sistema de progreso.

URLs públicas integradas en la app (no requieren configurar EAS):

- Soporte: https://dashwordsupport.netlify.app/
- Privacidad: https://dashwordprivacy.netlify.app/
- Términos: https://dashwordterms.netlify.app/

Se pueden reemplazar mediante `EXPO_PUBLIC_SUPPORT_URL`, `EXPO_PUBLIC_PRIVACY_URL` y `EXPO_PUBLIC_TERMS_URL`. Usar las mismas URLs en el paywall de RevenueCat y en App Store Connect; cambiar el código no modifica esos servicios externos.

Revisar el paywall publicado en dispositivo: precio localizado, duración, prueba sólo para usuarios elegibles, renovación automática, privacidad, términos y restauración. La pantalla de perfil no sustituye las condiciones necesarias antes de comprar.

Fuentes: https://developer.apple.com/app-store/subscriptions/ y https://developer.apple.com/app-store/review/guidelines/ .

Validación: TypeScript y lint; navegación web desde niveles al perfil, carga del progreso existente. La gestión y restauración de la tienda requieren pruebas nativas.
