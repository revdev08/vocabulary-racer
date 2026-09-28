# Ruta temática de Dashword

La ruta actual organiza las 3.847 entradas del Excel en **24 categorías y 72 subtemas**. Hay **416 carreras temáticas** de 5 a 10 preguntas base, además de las 12 carreras introductorias existentes: 428 en total. No hay una categoría de reserva «Vocabulario general».

Cada palabra tiene una asignación explícita. Los homógrafos se clasifican por el significado enseñado: `can` como lata pertenece a objetos; como capacidad, a auxiliares. `tear` como lágrima pertenece al cuerpo; como rasgar, a manipulación.

## Fuentes editoriales y generación

- `espanol-ingles.xlsx`: fuente de traducciones, distractores e identidades. Se conserva intacta en esta revisión.
- `topic-lexicon.tsv`: categoría, subtema y lista explícita de palabras inglesas, separados por `|`. No hay clasificación por prefijo ni una categoría automática de reserva.
- `topic-senses.json`: excepciones por ID de palabra para significados diferentes con la misma grafía.
- `thematic-race-manifest.json`: IDs y pertenencia estable de las carreras nuevas. Las futuras palabras se añaden sin mover las preguntas de carreras publicadas. Cambiar la pertenencia requiere una migración explícita.
- `category-report.json`: cobertura y distribución verificables por subtema.

`python scripts/import-vocabulary.py` importa el Excel y reconstruye la ruta temática. Para modificar únicamente la taxonomía, ejecutar `python scripts/build-topic-catalog.py`. Cualquier palabra nueva sin categoría detiene la generación y obliga a clasificarla.

Los títulos de los boletos nombran el tema completo, por ejemplo «Familia y parentesco · Parte 1». El número de parte distingue las carreras del mismo tema; no representa la cantidad de palabras. No se utilizan tres palabras de muestra como título. La cabecera muestra el subtema y la categoría. Una sección contiene como máximo cuatro carreras y nunca mezcla subtemas. Los subtemas extensos continúan en etapas identificadas. La paginación, el nivel actual y los números globales utilizan el mismo catálogo.

## Excel para revisar categorías

`python scripts/export-thematic-workbook.py` genera `espanol-ingles-categorizado.xlsx`, una copia de revisión. Se exporta aparte para no sobrescribir el archivo original abierto en Excel.

En esa copia, B/I indican categoría, J subtema y K ID del subtema. C–H conservan exactamente traducciones, distractores e identidades. A y Niveles conservan la clasificación anterior como referencia; las hojas Temas y Carreras temáticas muestran la nueva ruta. Es una exportación, no una segunda fuente que se importe automáticamente.

## Progreso y compatibilidad

Los 3.862 IDs y posiciones del vocabulario del juego permanecen iguales. Los repasos, fechas, errores, récord global, número de partidas y las 12 carreras introductorias conservan su identidad.

Una carrera reagrupada tiene preguntas diferentes y recibe un ID nuevo. Los registros de las 395 carreras importadas anteriores permanecen en el mismo almacenamiento, con sus mejores estrellas y puntuaciones, visibles en Guía de viaje → Tu recorrido anterior. No se inventan resultados ni se transfieren estrellas a grupos que el usuario todavía no ha jugado. Sus enlaces antiguos siguen creando la carrera original. Las nuevas lecciones comienzan con sus propios resultados después de la introducción.

El manifiesto original y `historicalLevels` se conservan para verificar y consultar exactamente qué preguntas correspondían a cada resultado anterior. No se duplica la base de progreso ni se modifica el planificador de repetición espaciada.
