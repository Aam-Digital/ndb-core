---
name: test-pr-preview
description: Functionally test an ndb-core pull request on its preview deployment (https://pr-<number>.aam-digital.net) against the linked issue and the manual-test steps in the PR description, and report what works, what does not and what could not be tested. Use when someone says "test this PR", "check the preview", "do the functional test", "try it on the deployment", or before approving a PR that changes what users see. Works with a PR URL or number, or with the PR of the current branch.
argument-hint: <pr-url-or-number> (optional, defaults to the PR of the current branch)
---

# Test a pull request on its preview deployment

Checks that the change works in the running app, which a code review cannot show. Run it
before `review-pull-request` when you can, the two complement each other. The result is a
short terminal report.

## Steps

1. **Find the PR, the issue and the preview.** Use the PR from the argument or the request,
   or the PR of the current branch. The preview URL is in the "Deployed to ..." comment of
   `github-actions` on the PR (`https://pr-<number>.aam-digital.net/`). Read the PR
   description (manual test steps, "What to check"), the linked issue with its comments and
   the diff. If the author wrote test steps, follow them first.
2. **Write the test list before opening the app.** One line per behavior: "do X, expect Y",
   for every point of the issue and every changed screen. Add the edge cases the diff
   invites (empty value, another language, small screen, no permission).
3. **Open the preview and mind its limits.**
   - It runs with a mock session: data lives in memory and is wiped on every reload, and
     the setup wizard opens on each load. Pick the use case `[All Features]` with demo data
     to reach most screens, and navigate through the menu instead of reloading.
   - The language comes from the `locale` key in `localStorage`. `ChooseUseCaseComponent`
     switches back to English when no use case exists for that locale, so a non-English
     test needs a workaround in the test browser only: intercept the JS chunk that contains
     `switchLanguageIfNoUseCaseInCurrentLocale` (chunk names change per build, match on that
     string) and make `availableUseCases` return all use cases and skip the `switchLocale`
     call. Never change the PR's code for this.
   - Preview builds have no published translations, so a non-English locale shows English
     text in the translated layout.
4. **Drive the app and measure.** Use a browser tool (Playwright, Chrome DevTools MCP).
   Prefer measurements (computed style, bounding boxes, attributes on `<html>`) to reading a
   screenshot, and keep screenshots as evidence. Use one persistent browser session so the
   in-memory data survives between steps, and block the service worker so a cached bundle is
   not served. If no browser tool is available, say so and hand over the test list as a
   manual checklist instead of reporting results.
5. **Report** in the format below and nothing else. Do not post anything to GitHub unless
   the user explicitly asks for that.

## Output format

```
## Works
- <test> — <what you saw>

## Does not work or looks wrong
- **<screen or action>** — <what happened> when <steps>. Expected: <what the issue or
  PR description promises>.

## Not tested
- <what> — <why: no data for it, host not reachable, needs a real account, ...>
```

Rules:

- Never write that something passed without having done the step. A step you could not run
  goes under **Not tested**.
- Say if the preview may not match the latest commit (compare the time of the "Deployed to"
  comment with the last push).
- Pre-existing problems you stumble on (check the same screen in LTR or on `master` first)
  are named as such and kept out of **Does not work**.
- Design questions (works as coded, but may not be what we want) go under **Does not work or
  looks wrong** with the question as the expectation, so the team can decide.
