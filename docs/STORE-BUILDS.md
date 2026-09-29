# Dashword: builds y suscripción

## Decisión de producto

- Plan inicial: USD 3,99/mes, precio localizado por tienda.
- Prueba introductoria gratuita de 3 días para usuarios elegibles.
- El catálogo completo requiere prueba activa o suscripción activa; no se divide en unidades gratuitas y pagadas.
- Conservar progreso al vencer. La prueba comienza al confirmar la suscripción en la tienda, no al instalar.
- No ofrecer una nueva prueba por cada plan: Apple determina elegibilidad por grupo de suscripciones.
- RevenueCat está integrado con el paywall remoto de la oferta `default` y el entitlement `plus`. La compra real todavía requiere verificación en TestFlight; eas.json no activa cobros por sí solo.

## Identidad

iOS Bundle ID y Android package: `com.revolutionti.dashword`.
El nombre público es Dashword; el slug Expo existente es vocab-racer.
Otras apps pueden tener otro prefijo, como com.santta.preparatelicencia, en la misma cuenta.
Verificar disponibilidad del identificador con Apple antes de la primera subida.

## Configuración local preparada

- production: distribución de tienda; AAB Android y archivo iOS para dispositivos/TestFlight.
- EAS mantiene remotamente buildNumber/versionCode y los incrementa en production.
- preview: APK Android y distribución interna iOS (dispositivos registrados).
- submit.production: app iOS 6817377110 (Dashword); Android al canal interno como borrador.
- Sin IDs de proyecto/cuenta inventados ni claves privadas. `eas init` agregará el projectId real.
- No hay perfil developmentClient: requiere instalar expo-dev-client cuando preparemos depuración nativa.

## Primera subida iOS desde Windows

1. Apple Developer: Certificates, Identifiers & Profiles > Identifiers > + > App IDs > App. Registrar Dashword con Bundle ID explícito com.revolutionti.dashword.
2. App Store Connect > Apps > + > Nueva app. iOS, Dashword, idioma principal, Bundle ID anterior, SKU interno dashword-ios. No hace falta build para crear esta ficha.
3. En PowerShell:

```powershell
cd C:\Revolution\vocab-racer
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform ios --profile production
```

Usar la cuenta/organización Expo deseada. Permitir crear/vincular el proyecto correcto, iniciar sesión en Apple y elegir el equipo correcto. EAS puede gestionar certificado de distribución y provisioning profile. No revocar certificados usados por otras apps.

4. Al terminar el build:

```powershell
npx eas-cli@latest submit --platform ios --profile production
```

Seleccionar el build de Dashword recién generado y la ficha correspondiente. Completar autenticación/credenciales de envío solicitadas. El Apple ID numérico de App Store Connect es distinto del Bundle ID; se puede añadir después como submit.production.ios.ascAppId.

5. Esperar procesamiento en App Store Connect > Dashword > TestFlight. Responder con veracidad las preguntas de cumplimiento de exportación si aparecen. Probar con testers internos.
6. Para publicación, completar metadatos, privacidad, capturas y seleccionar el build en la versión. Enviar a revisión es un paso separado; EAS Submit no publica por sí solo.

El primer build sirve para TestFlight. La versión con compras requiere integrar RevenueCat y subir un build nuevo junto con la primera suscripción.

## Android

```powershell
npx eas-cli@latest build --platform android --profile production
```

Permitir generar o utilizar el keystore correcto para esta nueva app. Crear Dashword en Play Console y subir manualmente el primer AAB a pruebas internas. Para envíos siguientes configurar la cuenta de servicio Google Play en EAS y ejecutar:

```powershell
npx eas-cli@latest submit --platform android --profile production
```

Para instalar un APK directamente sin tienda:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

## Suscripción Apple, después de crear la ficha

Crear grupo Dashword Plus, producto dashword_plus_monthly, duración un mes, precio base USD 3,99. Agregar oferta introductoria de prueba gratis durante 3 días y territorios/fechas correspondientes. Conectar a RevenueCat entitlement plus y offering default.
El paywall muestra precio localizado, duración, renovación automática, restaurar compras, términos y privacidad. Mostrar prueba sólo cuando exista oferta y el usuario sea elegible.

## Referencias

- https://docs.expo.dev/build/introduction/
- https://docs.expo.dev/build-reference/app-versions/
- https://docs.expo.dev/submit/ios/
- https://docs.expo.dev/submit/android/
- https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/
- https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions/
