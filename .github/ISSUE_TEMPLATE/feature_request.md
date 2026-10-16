---
name: Feature request
about: Suggest a new functionality for the software
title: ""
labels: ""
type: "New Feature"
assignees: ""
---

_As a [type of user] I want to [...] in order to [achieve XY goal]._

## Objective / User Requirements

A short summary of the feature: Who would use this new feature? And what is the objective or use case in real life?

Elaborate on the use case and the goals the user wants to achieve. This is independent of the exact feature in the app and helps us to think of other designs that might serve that objective even better.

### Proposed Solutions & Alternatives

A clear and concise description of the proposed solution for our app, including possible alternatives considered.

### Additional context

Add any other context or screenshots about the feature request here.

---

## Use Cases

<!--
numbered use cases, updated during the discussion here

Claude skill to assist creating and discussing these: /feature-use-cases
-->

<!-- TEMPLATE / EXAMLE:

### Example setup

- Group has a multi-select field "Children" and a dropdown field "City".
- Admin: Group → field "City" → Default value "inherited" → select field "Children" > Child → Configure → source field "City".

### Use cases

1. **One child (works already)**
   The group links Ravi (Mumbai). → City = Mumbai.

2. **Several children with the same city (new)**
   The group links Ravi (Mumbai) and Asha (Mumbai). → City = Mumbai. Before: the field stayed empty.

...

### Known limitations
- Only applies when records are saved through their form (not import, bulk edit or inline table edit).
- If a linked record can't be loaded (e.g. missing read permission), no shared value is inherited.
- Values of multi-select source fields are compared exactly, so `[a, b]` and `[b, a]` count as different.
- Moving a child to another group, with an unchanged city, does not trigger an update for either group.

### Open Questions & Decisions

<!--
list both decisions that have been taken (with short rationale)
as well as open questions or decision still to make
-->

- Empty values are ignored (use case 4). The alternative would be to treat "no city" like a different value, so Ravi + Kiran would leave the field empty.
- If the linked records differ, the field is left alone rather than cleared.
-->

---

## Implementation Approach

<!--
high-level architectural decisions (and open questions).
Not a detailed plan citing exact steps.

Claude skill:
> Plan the high-level implementation of this Github issue.
Do not create a detailed step-by-step plan.
Highlight architectural decisions and show different alternatives:
- code to reuse, what new modules/classes are needed
- risks, challenges or open questions

Once the objective above is agreed, the detailed plan is posted as ONE comment on this issue
(Context / Decisions / Changes / Open questions), self-contained and edited in place when
decisions change. Claude skill to write it: /plan-implementation

-->
