# Review checklist: what our reviews catch most often

These come from the most repeated review comments on merged ndb-core PRs (about 570
PRs, September 2025 to September 2026). The PR numbers show where a pattern came
from and are only examples. When this list goes stale, re-mine the recent review
comments (`gh api` on `pulls/<n>/comments`) and update it.

The conventions in `AGENTS.md` are the baseline for every PR. The list below is what
reviewers keep finding on top of that.

1. **Signals.** A new getter/setter, an `ngOnInit`-derived field, or a manual
   `.subscribe()` that could be a `computed` or a writable signal. This is the single
   most repeated comment (#3950, #3954, #3970, #3991, #4040, #4061, #4077). The reverse
   bug also happens: an `input()` signal forwarded as the function itself instead of
   called for its value (#4235). Also consider the use of `resource()`.
2. **Null vs undefined vs empty.** A clear, reset or anonymize path must treat
   array-shaped and single-value fields the same way, and the diff should make clear
   which "empty" it means (#4319).
3. **Template method calls.** An `@if` or `{{ }}` binding that calls a function reruns
   on every change-detection cycle. It should read a signal or computed instead
   (#4235, #4111).
4. **Cache key completeness.** List everything the cached function reads and check that
   the cache key covers all of it, not just the obvious argument (#4227).
5. **Orphaned DI mocks.** Removing an injected dependency from a service should also
   remove its mock provider and import from that service's spec (#4319).
6. **Cancel-race assumptions.** A `Promise.race` or timeout guard must match how the
   raced call really settles on cancel (resolve or reject). Check the library's
   behavior, do not assume it is symmetric (#4163).
7. **Subscription teardown.** A raw `.subscribe()` that starts async work needs
   `takeUntilDestroyed` or a signal-based `resource()` (#4160).
8. **Do not discard the specific error.** Mapping an error to a friendlier message can
   drop detail (for example an HTTP status) that another branch reads (#4160).
9. **Sentry groups by stack, not message.** Flattening an error message does not flatten
   the Sentry grouping unless the stack trace is normalized too (#4311).
   Check the [logging/README](src/app/core/logging/README.md) for details.
10. **i18n wrapping breaks tokens.** An icon tag, or a literal config keyword such as
    the value of `aria-live`, inside an `i18n`-marked block can be broken or silenced
    by a translation (#4225).
11. **Permission and sync cleanup on repeat paths.** A purge triggered by a permission
    or sync change must also fire on the ongoing-sync path, not only on the first
    sync (#4328).
12. **Scoped-but-generic helper names.** A function named broadly but written for one
    migration invites misuse elsewhere. Scope the name or generalize the function,
    deliberately (#4238, #4227).
13. **Regression without a regression test.** A bugfix PR should carry a test that would
    have caught the bug. If it does not, ask for one (#4116).
14. **Clean Code.** Any unnecessary complexity must be removed.
    Check pre-existing code and other files for similar code that could be reused or generalized also.
15. **Bidi attributes (`dir`, `lang`, `<bdi>`).** Checked in Chromium on an RTL page: an
    empty `dir="auto"` input or textarea resolves to LTR, so the caret starts on the left
    until the first RTL letter is typed; a value without a strong letter (number, phone
    number) stays LTR and left-aligned next to a right-aligned label; a negative
    `type="number"` input shows `-5` as `5-` without `dir="ltr"`; `dir="auto"` on a
    multi-paragraph block takes the direction of the whole block from its first letter.
    `lang` describes the text on the page, so setting it before the translations are
    confirmed labels English text with another language (#4504, #4540).
16. **A test that cannot fail for the reason in its name.** A "when the fetch fails" test
    that never makes the fetch fail, or a case that repeats a row of the `it.each` above
    it (#4504). Check that the test goes red when the guarded code is removed. The runner
    is not isolated, so also check that it does not depend on global state another spec may
    set, such as a locale registered by an earlier test.
17. **Stacked PRs.** A PR whose base is another feature branch can only merge after that
    one. Check what users see between the two merges (#4504 mirrors the assistant button,
    #4540 moves its panel) and that the diff is still right after the base is retargeted.
