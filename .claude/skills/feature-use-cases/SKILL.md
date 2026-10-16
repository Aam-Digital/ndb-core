---
name: feature-use-cases
description: Write the "Planned scope: use cases" comment for a new feature on a GitHub issue, in plain language with concrete examples, so the team can agree on what the feature should do before anyone builds it. Use when someone says "I want use cases for this feature", "write the use cases for issue 1234", "describe the planned scope", or "what should this feature do for users". For new features and behavior changes only, not for bugs.
argument-hint: <issue-url, issue-number or short feature description>
---

# Use cases for a feature

Turns a feature idea into one issue comment that product people, admins and
developers can all read and agree on, before the work starts. The comment lists the
situations the feature has to handle, each with a concrete example, plus the open
decisions and the known limits. A finished example is in [example.md](example.md), and
the output should look like it.

This is for **new features and behavior changes**. If the issue is a bug, say that this
skill does not fit and stop: a bug needs steps to reproduce and the expected result.

## Steps

1. **Get the request.** The input is an issue (URL or number) or a short description.
   For an issue, read it with its comments, because scope often changes there:
   ```
   gh issue view <n> --repo Aam-Digital/ndb-core --json number,title,body,labels,comments
   ```
2. **Find out what already works.** Read the code and the specs around the feature before
   writing a single use case. For every situation you are about to list, know whether
   today's app already handles it, so you can mark it correctly. Never guess: a wrong
   "works already" misleads everyone who relies on the comment. Something you cannot
   verify goes under **Decisions to confirm**.
3. **Use the real words of the app.** For the example setup, look up the labels the admin
   or user actually sees (templates, `$localize` texts, the admin screens) so that someone
   can follow the setup in the running app. Use invented but ordinary example records
   (names, cities, statuses) and keep them the same through the whole comment.
4. **Write the comment** in the format below.
5. **Check it** against the list at the end, then show it.
6. **Show the draft in a fenced markdown block** so it can be copied, and ask whether to
   change anything. Post it to GitHub only if the user explicitly asks for that.

## Format

```markdown
### Planned scope: use cases

<One or two plain sentences: what is new for the user. Bold the key part.>

**Example setup**

- <The smallest setup that shows the feature, in the labels of the app, e.g. admin
  steps and the example records.>

**Use cases**

1. **<The situation in a few words> (works already | new)**
   <Concrete example with the example records, then the result. When behavior changes,
   add "Before: ..." for the old behavior.>

2. ...

**Decisions to confirm**

- <A real open choice, with the alternative named, so people can say yes or no.>

**Known limitations**

- <What the feature does not cover, in terms a user would notice.>
```

Rules for the use cases:

- One observable situation per use case, with the result the user sees.
- Start with the simple case, then several records, different values, missing values,
  changes made later, existing vs newly created records, and every place where the user
  sees the effect (a dialog, an icon, a list).
- Say clearly what is new, what works already, and finish with **what stays as it is**
  when the feature touches existing behavior.
- Usually 5 to 8 use cases. If there are more, group the small ones as sub-bullets.
- Leave out implementation: no class, function or file names, no tasks. Turning the agreed
  scope into tasks is the job of the implementation-planner agent, afterwards.
- Plain language and short sentences, written for an admin or project lead. Say "the
  user" and "the admin", not "the component" or "the service".

## Before you show it

- Every "works already" and every "Before" was checked in the code, not assumed.
- The setup uses labels that exist in the app and can be followed step by step.
- The same example records are used throughout and each use case has a clear result.
- Each open choice in **Decisions to confirm** names the alternative.
- **Known limitations** are specific and honest, not generic.
- Nothing in the text is a task or a code detail.
