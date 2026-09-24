# Journey artwork

- Background: `../background-home.jpg`, supplied by the user. Decorative background only; all controls and learning content are React Native components.
- `red-touring-car.png`: generated with the built-in imagegen tool on 2026-09-23, transparent RGBA. Shared illustration for available tickets, separate from the driving sprites.
- Paper grain, notched silhouette, perforation, road icon, landscape motifs, stars, stamps and green button shading: vector components in `src/components/journey/LevelTicket.tsx`. No per-level bitmap cards. The ticket UI reuses the existing images; no new bitmap artwork was generated for the legibility redesign.

Generation prompt:
> Create a single isolated illustration asset for a premium mobile vocabulary racing game's vintage travel ticket. A glossy red modern compact sports coupe viewed from front three-quarter angle, nose pointing toward the right, both front and left side visible. Rounded elegant body, black windshield, detailed silver wheel rims, cream warm sunlight, tasteful hand-painted polished 3D game illustration, not emoji, not flat icon. Entire car visible with tight framing, transparent alpha background, subtle contact shadow only. No road, no landscape, no text, no logos, no frame, no ticket. Landscape aspect ratio. Save the resulting asset for integration into a React Native ticket UI.

No required artwork remains missing. Optional additional destination illustrations can replace the current reusable vector landscapes.
