---
name: review-pull-request
description: Review an ndb-core pull request before merge. Checks what the linked issue asks for, reads the whole diff for bugs, and runs the checklist of problems our reviews catch again and again. Use when someone says "review this PR", "can you do a code review", "check PR 1234", "look at my pull request", "is this ready to merge", or wants a self-review of their own PR before asking for a human review. Works with a PR URL or number, or with the PR of the current branch.
argument-hint: <pr-url-or-number> (optional, defaults to the PR of the current branch)
---

# Review a pull request

Reviews an `ndb-core` PR the way our team's reviews usually go: first against what
the linked issue asks for, then against the problems that came up most often in
past reviews (see [patterns.md](patterns.md)). The result is a short terminal report.

It complements the other checks and does not replace them: the project conventions in
`AGENTS.md` are the baseline, CodeRabbit and CI run automatically, and a manual test of
the running PR deployment finds what no code review does. Do the manual test first when
you can.

## Steps

1. **Resolve the target.** Take the PR number from the argument or from the request (a
   URL such as `https://github.com/Aam-Digital/ndb-core/pull/1234`, or a bare number). The
   repo is `Aam-Digital/ndb-core` unless the URL names another one. Without a number, use
   the PR of the current branch (`gh pr view --json number,url`), and if there is none,
   ask which PR to review.

2. **Fetch the PR.**

   ```
   gh pr view <num> --repo <owner>/<repo> --json number,title,body,url,author,baseRefName,headRefName,additions,deletions,files,state
   gh pr diff <num> --repo <owner>/<repo>
   ```

3. **Find and read the linked issue.** Look in the PR body for `closes #`, `fixes #`,
   `resolves #` (any case) or an issue number in the title, then:

   ```
   gh issue view <issue-num> --repo <owner>/<repo> --json number,title,body,labels,comments
   ```

   Summarize in 2-3 sentences what the issue really asks for (the reported bug or the
   requested behavior). Read the comments too, scope often changes there. If there is no
   linked issue, say so and do not invent one.

4. **Check coverage.** Compare the ask with what the diff changes and state one of:
   fully addressed / partially addressed (name the gap) / diff does not obviously match
   the issue / no linked issue.

5. **Read the diff.** Every hunk, plus the whole function around each hunk: a bug in an
   unchanged line of a touched function is in scope when the PR exposes it or fails to
   fix it. For each hunk ask what input, state or timing makes the line wrong. Typical
   findings are an inverted condition, an off-by-one, a missing `await`, a copy-paste
   with the wrong variable, a swallowed error, or a missing null/undefined guard.

6. **Run the checklist in [patterns.md](patterns.md)** against the changed files. Check
   each pattern on purpose, and do not skip one because it "looks irrelevant" before
   you have looked.

7. **Report** in the format below and nothing else. Do not post anything to GitHub
   unless the user explicitly asks for that.

## Output format

```
## Linked issue
#<n> — <title>
- <what it asks for, 1-3 bullets, plain language>
- Coverage: <fully / partially (name the gap) / no clear match / no linked issue found>

## Should fix
- **`<file>`, ~line <n>** — <what is wrong> when <the concrete input, state, or
  timing that triggers it>. Fix: <what to change>.

## Edge cases to verify
- **<the situation in plain terms>** — <why the diff does not rule it out>.
  Check: <what to test or look at>.
```

Rules for both sections:

- One bullet per finding. Never merge two findings into one bullet.
- Keep a bullet to 1-3 sentences. If it needs more, it is two findings.
- Lead with the location in bold (``**`file.ts`, ~line 243**``) so anyone can jump to
  the code, then the problem, then the fix.
- Plain words over jargon, so a teammate skimming gets the problem without opening the diff.
- Sub-bullets only when one finding has distinct parts (e.g. two call sites of the same
  bug), one level deep at most.
- Never write "consider improving X". Say what breaks and when.
- If nothing is left under **Should fix**, write exactly this one line:
  `- No blocking issues found — nothing needs to change before merge.`
- **Edge cases to verify** is written for someone deciding whether this is safe to ship,
  not for someone reading the code.

No praise, no restating the diff.
