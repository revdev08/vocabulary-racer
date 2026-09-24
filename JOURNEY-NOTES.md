# Travel-ticket journey

The home route now renders `JourneyScreen`: header, virtualized SectionList, and a compact selected-level panel in separate layout space. Tickets, row timeline segments, unit headers and panel are reusable components. The user's `background-home.jpg` is decorative only. All learning text, stars, statuses, numbering and interactions remain native components.

## Catalog and progression

The first local page contains two units with four genuine levels each. Scrolling near the end loads the next unit, with an explicit continuation button as a fallback. The user asked to retain the 12 existing levels and add vocabulary later: no synthetic playable levels or repeated vocabulary were added. Level numbering now continues from 01 through 12 across unit boundaries. `buildJourneyUnits` groups the real catalog in fours; appended levels automatically create additional units without changing existing IDs or keys.

Large jumps anchor a two-unit window near the destination instead of measuring all previous tickets. An earlier-units control remains available. The screen still virtualizes rows and accepts variable ticket heights. Selection is resolved against the catalog, so paging never changes the selected ticket. IDs, vocabulary, question generation, driving, local storage and spaced repetition remain unchanged.

`currentLevelId` follows saved completion; `selectedLevelId` only changes the inspected ticket. Completed levels can be repeated. Locked levels explain their prerequisite. Scrolling never selects a level. No global energy or artificial currency counter was added.

The same existing progress records now retain best score and earned stars. Finished runs earn 1/2/3 stars at 80/90/100% correct first attempts. Failed runs earn no stars. Repeats preserve previous maxima and existing run-ID deduplication prevents duplicate saves. Legacy completed records migrate to one guaranteed star: old records did not prove the best first-answer count came from a finished run, so higher stars are not fabricated. Historical per-level scores remain unknown (zero) until replayed.

The selected ticket shows 10 words, 3 lives and the 8-correct goal. The guide explains the unchanged requirement to finish with 8 first-attempt answers and the limit of 3 extra review questions. The vocabulary action is beside the level number. Its modal retains its content during fade-out, preventing a flash of the guide when closing the word list. No driving engine changes or dependency upgrades.

## Assets and adaptation

The existing red-car illustration and decorative background are reused. Paper grain, layered borders, notches, stamps, landscapes and the dimensional green CTA are code-built vectors. The small airplane symbol was replaced with a road symbol. The background has reduced opacity to keep text prominent. Selection uses an outlined ticket and does not change its height.

After user feedback on small lettering, ticket titles use 20–22 pt, statuses 13 pt, details/actions 14 pt and the selected title 22–24 pt. Unit headings use 28 pt. Enlarged system text can wrap naturally; optional ticket artwork hides before text shrinks. At 320 px the car uses a smaller proportional illustration. The bottom panel occupies separate layout space, and fewer rows are shown on short screens instead of shrinking all typography. Theme colors/assets are in `src/components/journey/theme.ts`.

## Verification

- TypeScript and Expo lint.
- Automated tests for local unit pages, genuine vocabulary references, unlocks, star thresholds, repeat maxima, storage migration/reload, and duplicate saves.
- Browser review at 320×640, 390×844 and 430×932: available/locked tickets, selected prerequisite, disabled play, vocabulary modal, automatic load of unit 3, level 12, and return to current level. Final enlarged typography rechecked at 320×640 and 390×844. No browser console errors or warnings in the final reviewed screen.
- Development-only `/?journeyStress=1`: 1,000 unique synthetic tickets, long labels, disabled race initiation and no saved synthetic progress. Jump to 981 verified after anchoring near the destination. No guessed fixed-height `getItemLayout` is used.
- 113 automated tests passed (15 legacy, 98 city), including appended-catalog numbering/identity, partial units and cursor bounds. TypeScript and lint passed. Web/iOS/Android exports checked; exports are bundle checks, not native device runs.

Physical iOS/Android performance and persistence across an actual app process restart have not been measured. Browser viewport checks and mocked AsyncStorage reload tests do not substitute for those device checks.
