# Dirección visual y procedencia

Paleta: tinta #173647, crema #fff8e9, naranja #ff8545, mar #087d84, gris #6c858c. Tipografía del sistema: display pesado y estrecho por espaciado, cuerpo legible, etiquetas en mayúsculas solo como señalización. Firma: el carro naranja recorta su silueta sobre una carretera costera. Composición vertical: cielo y pregunta arriba, decisiones en medio, carro y controles abajo. Vista web limitada a ancho móvil.

Se opta por formas y texto nativos con un paisaje raster propio. Esta primera prueba usa SVG en lugar de Skia: evita introducir el motor gráfico antes de validar la mecánica. Medir rendimiento en teléfonos antes de ampliar la escena. Los gráficos no dependen de las reglas de aprendizaje.

## Asset generado

Archivo: `assets/coast.png`. Generación mediante herramienta integrada ImageGen, sin CLI/API adicional. Prompt final:

> Use case: stylized-concept. Asset type: mobile driving game coastal background plate, production asset. Create a portrait 2:3 colorful stylized 3D cartoon Mediterranean coastal landscape for a vocabulary racing game. Bright turquoise ocean on right, layered warm sandy cliffs and scattered rounded green pine trees on left, distant hazy headland in center, soft white clouds and pale blue sky in upper half, a small sailboat on right sea. Elevated chase-camera landscape, horizon at 38 percent from top. Bottom half mostly calm turquoise water and sandy land, simple enough to be obscured by a road drawn separately. Friendly premium casual game art, rounded low-poly forms with soft shading, beautiful restrained detail, warm sunshine. NO road, NO car, NO vehicles, NO text, NO UI, NO logos, no frame. The game draws a trapezoid road from center horizon to full-width bottom over this background. Keep central horizon clear.
