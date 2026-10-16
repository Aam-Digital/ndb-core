---
name: feature-use-cases
description: Write the use cases for a new feature, in plain language with concrete examples, so the team can agree on what the feature should do before anyone builds it. Use when someone says "I want use cases for this feature", "write the use cases for issue 1234", "describe the planned scope", "what should this feature do", or "help me spec this out". For new features and behavior changes only, not for bugs.
argument-hint: <issue-url, issue-number or short feature description> (optional)
---

# Use cases for a feature

Turns a feature idea into the **Use Cases** section of its issue (the section in
`.github/ISSUE_TEMPLATE/feature_request.md`) so that product people, admins and developers
can read it and agree on it before the work starts. It lists the situations the feature has
to handle, each with a concrete example, plus the open decisions and the known limits.

A full example is the comment on
[issue #3330](https://github.com/Aam-Digital/ndb-core/issues/3330#issuecomment-6053014194).
The output should look like it.

This is for **new features and behavior changes**. If the issue is a bug, say that this
skill does not fit and stop: a bug needs steps to reproduce and the expected result.

## Steps

1. **Get the request.** The input is an issue (URL or number) or a short description,
   given as the argument or in the request itself. If there is neither, ask which feature
   it is for. For an issue, read it with its comments, because scope often changes there:

   ```
   gh issue view <n> --repo Aam-Digital/ndb-core --json number,title,body,labels,comments
   ```

2. **Find out what already works.** Read the code and the specs around the feature before
   writing a single use case. For every situation you are about to list, know whether
   today's app already handles it, so you can mark it correctly. Never guess: a wrong
   "works already" misleads everyone who relies on the text. Something you cannot verify
   goes under **Open Questions**.
3. **Use the real words of the app.** For the example setup, look up the labels the admin
   or user actually sees (templates, `$localize` texts, the admin screens) so that someone
   can follow the setup in the running app. Use invented but ordinary example records
   (names, cities, statuses) and keep them the same through the whole text.
4. **Write the section** in the format below and check it against the list at the end.
5. **Show the draft in a fenced markdown block** so it can be copied, and ask whether to
   change anything. Lead a discussion with the developer about intended behavior.
6. The user pastes it into the issue description or posts it as a comment.
   Post it to GitHub yourself only if the user explicitly asks for that.

## Format

```markdown
### Example setup

- <The smallest setup that shows the feature, in the labels of the app, e.g. the admin
  steps and the example records.>

### Use cases

1. **<The situation in a few words> (works already | new)**
   <Concrete example with the example records, then the result. When behavior changes,
   add "Before: ..." for the old behavior.>

2. ...

### Known limitations

- <What the feature does not cover, in terms a user would notice.>

### Open Questions & Decisions to confirm

- <A real open choice, with the alternative named, so people can say yes or no.>
```

Rules for the use cases:

- One observable situation per use case, with the result the user sees.
- Start with the simple case, then several records, different values, missing values,
  changes made later, existing vs newly created records, and every place where the user
  sees the effect (a dialog, an icon, a list).
- Say clearly what is new, what works already, and finish with **what stays as it is**
  when the feature touches existing behavior.
- Usually 5 to 8 use cases. If there are more, group the small ones as sub-bullets.
  Try to limit the number of cases and combine similar or related edge cases into one.
- Leave out implementation: no class, function or file names, no tasks. The plan comes
  afterwards, see `/plan-implementation`.
- Plain language and short sentences, written for an admin or project lead. Say "the
  user" and "the admin", not "the component" or "the service".
- The repository is public: invented records only, no real people, projects or instances.

## Before you show it

- Every "works already" and every "Before" was checked in the code, not assumed.
- The setup uses labels that exist in the app and can be followed step by step.
- The same example records are used throughout and each use case has a clear result.
- Each open choice names the alternative.
- **Known limitations** are specific and honest, not generic.
- Nothing in the text is a task or a code detail.
