# Quiz Math — Improvement Tasks

A real, current backlog for the project (previously this file described a
generic, fictional framework roadmap unrelated to what's actually in this
repo — see git history if curious). Checked items are genuinely done.

## Done

- [x] Local, no-login kid profiles (`ProfileStore`) with per-profile best
      scores and sprint times
- [x] 20 exercise types across addition/subtraction/multiplication/division,
      including visual-aid exercises (fractions, number line, operation
      sense) rendered via a generic `Question.visual` field
- [x] "Weak facts" adaptive practice: per-fact wrong/correct tracking
      (`WeakFactsStore`) biasing question generation toward facts a kid
      struggles with
- [x] Category-based exercise picker in Training mode (Calcul / Sens des
      nombres / Rapidité / Logique), replacing a flat 17+ item dropdown
- [x] Table selection only shown for the 4 exercises that actually use it
- [x] `QuizViewModel` split from a single 890-line file into focused pieces
      (template, timers, score persistence, JSON loader, table-grid
      computation)
- [x] Removed the unused generic demo framework (fake login/dashboard/admin,
      `AppStore`, `FormViewModel` + its two demo forms) that shipped with the
      original starter template
- [x] Consistent `localStorage` persistence: all stores (`ProfileStore`,
      `WeakFactsStore`, `QuizScoreStore`) go through one shared
      `src/store/LocalStorage.ts` helper
- [x] Fixed `npm run lint` (was pointing at a legacy `.eslintrc.cjs`
      incompatible with ESLint 9's flat-config mode)
- [x] Docs aligned with the app that actually exists in this repo, instead of
      the generic framework starter's original documentation

## Open

### Architecture / code quality

- [ ] Type-safe template bindings — `data-bind` attributes are plain strings
      with zero compile-time checking; a typo silently fails at runtime.
      Biggest real gap in the internal view-model layer.
- [ ] Auto-dispose Knockout subscriptions on `BaseViewModel.destroy()` — a
      `registerSubscription()` helper would close a real memory-leak risk for
      ViewModels that `.subscribe()` manually in their constructor (e.g.
      `QuizViewModel`)
- [ ] Real test coverage for view models — only `AppViewModel` has a test
      today; `tests/knockout-test-utils.ts` exists but is barely used
- [ ] Wire `npm run lint` and `tsc --noEmit` into CI (`.github/workflows/ci.yml`
      currently only runs `npm test`)
- [ ] Typed route params (e.g. infer `{ operation: string }` from
      `/quiz/:operation` instead of an untyped `context.params`)

### Features (quiz content)

- [ ] Progress dashboard per profile — accuracy trends over time by
      operation/table (today only a single best-score label is kept)
- [ ] Achievements & streak counter (perfect sprint, N-day streak, table
      mastered)
- [ ] PWA offline support (manifest + service worker)
- [ ] Geometry exercises (lines, angles, polygons, tiling) and a clock-face
      UI for telling time — needs real shape/clock rendering, not just the
      simple SVG/HTML visuals already built for fractions/number-line/arrays

### Housekeeping

- [ ] Decide on a license (no `LICENSE` file currently exists despite one
      being referenced historically) and add it, or drop the reference for
      good
