# Español → inglés

`espanol-ingles.xlsx` is the editorial source, originally supplied by the user and subsequently reviewed for translation errors. The app bundles generated TypeScript; it does not open Excel at runtime.

## Import

Run `python scripts/import-vocabulary.py` from the project root with Python and openpyxl installed. No JavaScript or mobile dependency is required.

- `Palabras`: A = source group ID, C = correct English, D = Spanish prompt, E/F = English distractors. B is descriptive metadata.
- Hidden columns G/H hold the permanent word ID and saved-progress ID. Keep them when sorting or editing rows. New rows can leave these blank; the importer assigns and saves them. Never reuse another word's IDs for a new meaning.
- `Niveles`: A = group ID, B = displayed group name, C = editorial objective.
- 3,870 source rows become 3,847 unique English/Spanish pairs. Exact pair duplicates share review identity; their source rows and alternate distractors are retained in the generated data.
- The 23 source groups become journey units, with 395 races of at most 10 core questions. The last race in a group may contain fewer than 10. Targets remain `ceil(questionCount * 0.8)` and require finishing.
- The original 12 introductory races and their stable IDs remain before the imported units. Previously matched pairs retain their original word IDs through column H, even after correcting their text. Total app vocabulary: 3,862 lexical entries; total races: 407.

`race-manifest.json` keeps race membership stable on subsequent imports. Added words create new races. Correcting text preserves existing IDs, positions and membership. Removing or moving an existing word to another group fails the importer and requires an explicit migration. Rows sharing an ID must be corrected together; conflicting translations fail instead of silently overwriting each other.

## Editorial findings

On 2026-09-24 all 3,870 source rows were reviewed. The revision corrects 1,111 Spanish translations, removes dictionary sense numbers from 102 English cells (answers and distractors), and replaces five synonymous distractors that would also have been valid answers. Whole expressions are translated by meaning, rather than translating only their first word. Polysemous words use a common meaning, alternatives, or a short clarifying context.

`translation-review.json` records every changed cell, its previous and corrected text, permanent IDs, source hashes, and 97 reviewed identical spellings (legitimate cognates, loanwords and shared forms such as `animal`, `actor`, `no`). `import-report.json` still reports the 23 duplicate rows and flags any new, unreviewed identical spellings. No warnings means those spelling checks passed; it is not an automatic guarantee of semantic correctness.

Sense checks included [Oxford's accustomed sense of used](https://www.oxfordlearnersdictionaries.com/definition/english/used1) and [its second-hand sense](https://www.oxfordlearnersdictionaries.com/definition/english/used2). The translations are editorial choices, not an exhaustive dictionary of every possible meaning. Future wording changes belong in the workbook, followed by an import.

Validation: `python tests/content/test_import_vocabulary.py` exercises corrections, row sorting, conflicting duplicate edits, new rows and idempotence using temporary workbooks. `pnpm test` checks the generated vocabulary, reviewed translations, known synonymous distractors, and fingerprints of every pre-review runtime word ID/index and race membership. The source workbook has no formulas to recalculate.

## Spaced repetition verified

- During a race, mistakes can return after three intervening answers, subject to the maximum of three extra review questions and remaining lives. Late mistakes may need the next session.
- After saving a run, an uncorrected mistake is due immediately. A mistake recovered in that run is due in 10 minutes.
- Successful due reviews progress through intervals of 1, 3, 7 and 14 days; subsequent success stays at 14 days. A new error resets this progression.
- Practising early does not push the scheduled review into the future. Vehicle collisions do not penalize vocabulary memory.
- The journey shows pending reviews. Review mode takes up to 10 overdue words; ordinary races prioritize overdue core words and can include one due word from another level.
- Dates are local persisted timestamps. The app does not send reminders or run reviews while closed: due words are offered when the user returns. Unfinished abandoned races are not saved.

Tests use controlled timestamps for minute/day intervals; they do not require waiting real days. Physical-device process-restart and performance checks remain separate from these automated checks.
