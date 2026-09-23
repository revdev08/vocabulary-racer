# Integración del mapa urbano

La ruta `/race` utiliza el motor y el mapa importados. `basegame` no participa en ejecución, instalación, pruebas ni exportación y puede borrarse.

## Estructura

- `src/game/config`, `geometry`, `motion`, `gameplay`, `world`, `ui`, `controls`, `data`: sistema trasladado.
- `assets/game`: todos los PNG del miniproyecto, incluidos carro frontal y giros, tráfico, barreras, asfalto, árboles, fachadas y fondos.
- `tests/city`: pruebas originales adaptadas a las rutas del proyecto y comprobaciones de independencia.
- `docs/city`: documentación y referencias visuales del miniproyecto.
- `src/legacy/CoastalRaceScreen.tsx`, componentes y assets costeros anteriores: conservados para una futura ruta, sin estar conectados a `/race`.

## Comportamiento conservado

Empieza con un tramo de tráfico, como la referencia. Alterna tráfico → pregunta con tres opciones → confirmación → tráfico. Las preguntas reducen la velocidad; las colisiones se calculan con la posición real, los tramos aumentan el ritmo y las monedas no se confunden con los puntos por vocabulario. Giros con los tres sprites originales, nitro visual y animaciones de respuesta. La partida ahora acaba al perder tres vidas o completar el nivel: diez palabras y hasta tres repasos adicionales. Consulta [niveles y repetición](repetition.md).

El motor original de patrones, física, geometría y recompensas se trasladó sin ajustes de balance. Se mantuvo su repetición después de tres preguntas intermedias. El adaptador `gameplay/progress.ts` carga repasos locales vencidos y guarda los resultados mediante nuestro almacenamiento; los choques no penalizan el aprendizaje. Los puntos se reflejan en el inicio al regresar. Salir durante una partida la descarta.

## Adaptaciones de aplicación

Expo Router usa `RaceEntry.tsx` para nativo y `RaceEntry.web.tsx` para cargar CanvasKit antes de Skia en navegador. `pnpm install` prepara `public/canvaskit.wasm`; no se necesita un CDN ni la carpeta de referencia. Se añadieron teclado, salida al inicio y estado de guardado. El control de gestos conserva los callbacks de PanResponder; una excepción puntual de lint documenta que se ejecutan durante el gesto, no al registrar el responder.

`pnpm test` ejecuta las pruebas anteriores y las urbanas. `pnpm typecheck`, `pnpm lint` y `pnpm exec expo export --platform all` validan integración. La exportación de bundles no sustituye pruebas en teléfonos físicos.
