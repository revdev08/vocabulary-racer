# Acceso local de demostración

No requiere servidor, Netlify, variables de entorno ni compras.

Código: DASHWORD-REVIEW-2026
Válido hasta el 20 de noviembre de 2026 a las 23:59:59, hora de Colombia.
Caduca el 21 de noviembre a las 00:00 (UTC-05:00).

En la primera pantalla del onboarding, pulsa «Tengo un código de acceso», introduce
el código y pulsa «Activar acceso». Funciona en varios dispositivos. Se guarda la
activación con SecureStore; no se crea una suscripción ni se altera RevenueCat.
El juego mantiene su progresión normal. Perfil permite cerrar el acceso.

La fecha se comprueba al abrir, volver a primer plano, periódicamente y al iniciar
una carrera. Una carrera iniciada puede terminar. No hace falta Internet para
validar el código. La caducidad depende del reloj del dispositivo y el código es
extraíble del binario: esta solución NO ofrece revocación remota ni protección
contra manipulación del reloj.

Para cambiar código, fecha o revocar activaciones en un nuevo build, editar
src/subscriptions/demoPolicy.ts y cambiar también revision. No afecta a versiones
anteriores ya instaladas. Renovar instrucciones y código antes de futuras revisiones;
no enviar a Google una versión con credenciales vencidas.

Generar un nuevo build (incluye expo-secure-store) y comprobar en un dispositivo
antes de enviar instrucciones. No configurar EXPO_PUBLIC_DEMO_ACCESS_URL.

Pruebas: node --test tests/demo-access.test.mjs tests/subscriptions.test.mjs
Pendiente: validación visual y persistencia/caducidad en iOS y Android reales.
