# Vocab Racer — primera carrera

Prototipo móvil Expo / React Native, español → inglés. Tres carriles, diez palabras, carretera costera, tres obstáculos, tres vidas, combos, pausa y resultados. Nombre provisional.

## Ejecutar

Requiere Node 22.13+ y pnpm. Desde esta carpeta:

```sh
pnpm install
pnpm start
```

Escanea el QR con una versión de Expo Go compatible con SDK 57. El teléfono y el equipo deben poder comunicarse por la red local. `pnpm web` abre la vista previa web. Las flechas del teclado también funcionan. La validación web no sustituye probar un dispositivo iOS y Android.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm exec expo export --platform all
```

## Alcance real

- 10 encuentros por carrera, 6.8 segundos para elegir y 1.8 de corrección.
- Deslizamiento y botones; tres carriles; obstáculo fijado al aparecer.
- Acertar suma 100 puntos, multiplicador +0.25 cada cinco aciertos hasta x2; meta +300.
- Error o choque: una vida por encuentro; distingue vocabulario de conducción.
- Pausa manual, al ocultar la pestaña y al pasar la app a segundo plano.
- Récord, carreras terminadas y lista de palabras para practicar en AsyncStorage local. Guardado al terminar; salir de una carrera descarta ese intento.
- No incluye aún repetición espaciada, 100 palabras, niveles, monedas, skins, audio, SQLite, cuentas ni compras. No se presenta la lista de práctica como vocabulario aprendido.

## Organización

- `src/game/engine.ts`: reglas puras, independientes de Expo, reloj inyectado, aleatoriedad inyectable.
- `src/game/storage.ts`: repositorio local versionado; evita guardar dos veces el mismo resultado.
- `src/app/`: rutas Expo Router, inicio y carrera con sus resultados.
- `src/components/Scene.tsx`: escenario 2.5D, paisaje raster y geometría SVG; carro con Animated. Solo el escenario lleva la animación continua. Las reglas avanzan en intervalos de 50 ms, con límite de delta para evitar saltos.
- `tests/`: reglas, puntuación, vida única, finalización y carriles.

## Evolución

1. Probar legibilidad, ritmo y controles en teléfonos reales. El arte es de prototipo; perfilado de rendimiento pendiente en dispositivos.
2. Añadir cola de refuerzo y programación entre sesiones, con eventos de respuesta e IDs estables en SQLite.
3. Ampliar contenido revisado, escenarios y personalización.
4. Clerk + Supabase: vincular invitado, sincronizar eventos e implementar RLS.
5. RevenueCat: derechos de acceso, restauración y pruebas en development builds.

## Arte

`assets/coast.png`: imagen original generada con la herramienta integrada ImageGen. Prompt y dirección en `docs/art-direction.md`. Vehículo, asfalto y obstáculos están dibujados en SVG editable; texto/UI son nativos. La imagen conceptual anterior es una referencia, no un render del prototipo.
