# Shared Claude skills

Skills are ready-made instructions for Claude Code. Each one does a recurring job the same
way for everyone on the team. They are used from Claude Code (terminal, desktop app or IDE)
opened in this repository.

| Skill                 | Use it to                                                                 | Call it with                 |
| --------------------- | ------------------------------------------------------------------------- | ---------------------------- |
| `feature-use-cases`   | Write the "Planned scope: use cases" comment for a new feature            | `/feature-use-cases <issue>` |
| `review-pull-request` | Review a pull request before merge                                        | `/review-pull-request <PR>`  |
| `design-prototype`    | Build a clickable prototype of a feature in the Aam Digital design system | `/design-prototype <issue>`  |

## Two ways to use a skill

1. **By name:** type `/` and the skill name, optionally followed by an issue or PR number
   or URL, e.g. `/review-pull-request 4526`.
2. **In your own words:** just ask, e.g. "can you do a code review of PR 4526" or "I want
   use cases for issue 4493". Claude picks the matching skill. If it does not, use the name.

Without a number or link, Claude uses the current branch's PR (review) or asks you which
feature or screen you mean (the other two).

## One-time setup

- Open Claude Code in this repository and **trust the folder** when asked.
- `gh` (GitHub CLI) is installed and logged in (`gh auth login`). Needed to read issues and PRs.
- For `design-prototype`: Claude Code with the Artifact tool (log in with your Claude
  account), and view access to the **Aam Digital** design system. If it is missing from the
  list, ask a maintainer to share it with you.

## feature-use-cases

1. Open Claude Code in the repo and write `/feature-use-cases 1234`, or describe the
   feature in your own words.
2. Claude reads the issue and its comments and checks the code for what already works.
3. It shows the draft comment in a code block: planned scope, example setup, numbered use
   cases, decisions to confirm, known limitations.
4. Tell it what to change ("merge use cases 2 and 3", "add the case where no value is set").
5. Copy the final text into the issue yourself. The skill never posts anything.

Only for new features and behavior changes. For a bug, describe the steps to reproduce
instead.

## review-pull-request

1. Try the PR in its deployment first if you can, a manual test finds what a code review
   does not.
2. Write `/review-pull-request 1234`, or ask "can you do a code review of PR 1234".
3. Claude reads the PR, the linked issue and the whole diff, and checks the list of
   problems our reviews catch most often.
4. You get a short report: **Linked issue**, **Should fix**, **Edge cases to verify**.
5. Fix the findings, or paste the ones you agree with into the PR as review comments
   yourself. The skill never posts anything.

Also useful for a self-review before you ask someone else to look at your PR.

## design-prototype

1. Write `/design-prototype 1234`, or describe the screen or feature ("a prototype for
   showing the pending values in the update dialog").
2. Claude reads the issue and the existing screen, picks the **Aam Digital** design system
   and builds the prototype with made-up example data.
3. You get a link to a private page, plus the assumptions it made and open questions.
4. Open it, click through it, then ask for changes ("remove the hint text", "also show the
   case with no value"). Claude lists what changed at the top.
5. When the team can see it, post the link or a screenshot on the issue yourself.

## Tips

- Name the issue or PR number. The more concrete the request, the better the result.
- Skills write drafts. Read them before you use them, and check anything that sounds sure
  about how the app behaves.
- The skills live in `.claude/skills/<name>/SKILL.md`. To improve one, change that file in a
  pull request.
