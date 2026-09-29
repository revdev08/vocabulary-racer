# Dashword icon

Created with the built-in imagegen tool. Sources are preserved alongside the exported assets.

- `dashword-icon.png`: 1024 × 1024 RGB PNG, opaque, square, for iOS and legacy Android.
- `dashword-adaptive-foreground.png`: transparent 1024 × 1024 PNG, padded for Android launcher masks, over background `#061C30`.
- `dashword-favicon.png`: 64 × 64 browser icon.
- `dashword-source.png` and `dashword-foreground-source.png`: original generated artwork.

Generation prompt: Premium mobile vocabulary racing app icon, no text, letters, numbers or logos. Large glossy red modern sports coupe viewed from the rear at a three-quarter angle, with one emerald flashcard bordered in cream and a golden correct-answer checkmark. Midnight navy and teal background, subtle perspective road and golden speed trails. Strong silhouettes, polished 3D game rendering, no emoji styling, no UI clutter. Full-bleed square artwork without rounded outer corners.

Adaptive foreground edit: Preserve the car and flashcard, remove all sky, road and trails, use genuine transparency with generous padding. The export adds padding to protect the composition from launcher cropping.

Configuration is in `app.json`. The old template assets are no longer referenced as launcher icons. A monochrome themed variant is not supplied in this delivery.

Rebuild and install to update native launcher icons; Metro reload does not replace an installed native icon.

Physical iPhone: `npx eas-cli@latest build --platform ios --profile development-device`

iOS simulator: `npx eas-cli@latest build --platform ios --profile development`

Android: `npx eas-cli@latest build --platform android --profile development`

Validation: PNG dimensions, RGB/alpha modes, Expo public config, TypeScript and lint. Native installation and device launcher appearance still require testing with a new build.
