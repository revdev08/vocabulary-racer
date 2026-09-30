# Perfil y requisitos de publicación

La pantalla de niveles enlaza a `/profile`; gestionar suscripción y restaurar compras están en el perfil y usan el proveedor de RevenueCat existente. El onboarding también permite abrir el perfil sin suscripción. No se ha creado una cuenta de usuario ni un segundo sistema de progreso.

Antes de publicar, configurar URLs HTTPS públicas en el entorno de EAS y reconstruir:

- `EXPO_PUBLIC_PRIVACY_URL`: política de privacidad de Dashword.
- `EXPO_PUBLIC_TERMS_URL`: términos de uso aplicables. Si se decide usar el EULA estándar de Apple para iOS, su URL es https://www.apple.com/legal/internet-services/itunes/dev/stdeula/ . No se ha elegido automáticamente por el titular.

Mientras falten estas URLs, los controles muestran que están pendientes y no abren enlaces inventados. Esto NO completa los requisitos de publicación. Usar las mismas URLs en el paywall de RevenueCat y en App Store Connect.

Revisar el paywall publicado en dispositivo: precio localizado, duración, prueba sólo para usuarios elegibles, renovación automática, privacidad, términos y restauración. La pantalla de perfil no sustituye las condiciones necesarias antes de comprar.

Fuentes: https://developer.apple.com/app-store/subscriptions/ y https://developer.apple.com/app-store/review/guidelines/ .

Validación: TypeScript y lint; navegación web desde niveles al perfil, carga del progreso existente. La gestión y restauración de la tienda requieren pruebas nativas.
