<!-- Describe the change in a few sentences for the reviewer. -->

## Manual Testing Steps

<!-- For changes that are visible in the app: how a reviewer can try the change in the PR deployment, with the expected result of each step.
Needs a special config (fields, rules, features)? Add it to the all-features config in this PR and write "demo mode All Features" below instead of admin-UI setup steps. -->

**Setup** (if needed)

1. …

**Steps**

1. … → what you should see

---

- closes #GITHUB_ISSUE_NUMBER

## PR Checklist

_Before you request a manual PR review from someone, please go through all of this list:_

- [ ] manually tested (all) required functionality yourself and wrote clear steps for manual testing (including the config needed, in the all-features config)
- [ ] reviewed the "Files changed" section of the PR briefly
- [ ] added label **"Final Review"** to trigger UI regression testing (Argos visual review)
- [ ] triggered CodeRabbit AI review by commenting **"@coderabbitai review"** (e2e tests run automatically on every push)
- [ ] marked each code review comment as resolved (or commented on it with a question, if unsure)

--> then mark the PR "Ready for Review"

---
