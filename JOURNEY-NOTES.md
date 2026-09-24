# Travel-ticket journey

The home route now renders `JourneyScreen`: header, virtualized SectionList, and a compact selected-level panel in separate layout space. Tickets, row timeline segments, unit headers and panel are reusable components. The user's `background-home.jpg` is decorative only. All learning text, stars, statuses, numbering and interactions remain native components.

## Catalog and progression

The first local page contains two units with four genuine levels each. A local continuation control exposes the four existing levels of the third unit; saved progress there automatically loads that unit. IDs, vocabulary, question generation, driving, results navigation, local storage key and spaced repetition are reused. The local page interface exposes a cursor without network requests.

`currentLevelId` follows saved completion; `selectedLevelId` only changes the inspected ticket. Completed levels can be repeated. Locked levels explain their prerequisite. Scrolling never selects a level. No global energy or artificial currency counter was added.

The same existing progress records now retain best score and earned stars. Finished runs earn 1/2/3 stars at 80/90/100% correct first attempts. Failed runs earn no stars. Repeats preserve previous maxima and existing run-ID deduplication prevents duplicate saves. Legacy completed records migrate to one guaranteed star: old records did not prove the best first-answer count came from a finished run, so higher stars are not fabricated. Historical per-level scores remain unknown (zero) until replayed.

The panel describes 10 base questions, at most 3 additional review questions, 3 starting lives, and finishing with at least 8 correct first attempts. No driving engine changes or dependency upgrades.

## Assets and adaptation

See `assets/journey/README.md` for the separate generated red car and full imagegen prompt. Paper grain, stamp, airplane and pastel destination scenes are reusable vectors. Ticket notches are actual transparent cutouts, not circles painted over the background. Decorative artwork hides on narrow screens or enlarged text before reducing text sizes. Selection does not change row height. No continuous animations or animated automatic jumps are used.

## Verification

- TypeScript and Expo lint.
- Automated tests for local unit pages, genuine vocabulary references, unlocks, star thresholds, repeat maxima, storage migration/reload, and duplicate saves.
- Browser review at 390×844 and 320×640, all three states, selection, disabled prerequisite button, repeat availability and return-to-current control.
- Development-only `/?journeyStress=1`: generates 1,000 unique synthetic tickets, includes long labels, and disables race initiation. No synthetic progress is saved. A long-jump control exercises unmeasured rows with bounded progressive retries; no fixed-height `getItemLayout` is used.

Physical iOS/Android performance and persistence across an actual app process restart have not been measured. Browser viewport checks and mocked AsyncStorage reload tests do not substitute for those device checks.
