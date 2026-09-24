# Español → inglés

`espanol-ingles.xlsx` is the user-supplied editorial source, moved here from assets without modifying its contents. The app bundles generated TypeScript; it does not open Excel at runtime.

## Import

Run `python scripts/import-vocabulary.py` from the project root with Python and openpyxl installed. No JavaScript or mobile dependency is required.

- `Palabras`: A = source group ID, C = correct English, D = Spanish prompt, E/F = English distractors. B is descriptive metadata.
- `Niveles`: A = group ID, B = displayed group name, C = editorial objective.
- 3,870 source rows become 3,847 unique English/Spanish pairs. Exact pair duplicates share review identity; their source rows and alternate distractors are retained in the generated data.
- The 23 source groups become journey units, with 395 races of at most 10 core questions. The last race in a group may contain fewer than 10. Targets remain `ceil(questionCount * 0.8)` and require finishing.
- The original 12 introductory races and their stable IDs remain before the imported units. Matching pairs reuse original word IDs, preserving spaced repetition. Total app vocabulary: 3,862 pairs (15 introductory pairs are absent from the workbook); total races: 407.

`race-manifest.json` keeps race membership stable on subsequent imports. Added words create new races. Removing or changing existing source pairs fails the importer and requires an explicit content/progress migration instead of silently changing the meaning of completed races.

## Editorial findings

`import-report.json` lists 23 duplicate rows and 481 rows with identical English and Spanish spelling. Some are legitimate cognates (animal, actor); others look untranslated (awkward, backwards, based). These entries are preserved exactly as supplied and are **not** certified as correct translations. The original source hash is recorded in the report. The importer validates completeness, referenced groups, and distinct answer options; it cannot validate semantic correctness or ambiguity of every translation/distractor.

## Spaced repetition verified

- During a race, mistakes can return after three intervening answers, subject to the maximum of three extra review questions and remaining lives. Late mistakes may need the next session.
- After saving a run, an uncorrected mistake is due immediately. A mistake recovered in that run is due in 10 minutes.
- Successful due reviews progress through intervals of 1, 3, 7 and 14 days; subsequent success stays at 14 days. A new error resets this progression.
- Practising early does not push the scheduled review into the future. Vehicle collisions do not penalize vocabulary memory.
- The journey shows pending reviews. Review mode takes up to 10 overdue words; ordinary races prioritize overdue core words and can include one due word from another level.
- Dates are local persisted timestamps. The app does not send reminders or run reviews while closed: due words are offered when the user returns. Unfinished abandoned races are not saved.

Tests use controlled timestamps for minute/day intervals; they do not require waiting real days. Physical-device process-restart and performance checks remain separate from these automated checks.
