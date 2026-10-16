# Example: use cases comment for a feature

This is the comment written for issue #3330 (inheriting the shared value of several linked records). It shows the expected tone, level of detail and structure.

---

### Planned scope: use cases

A field that inherits its value from a multi-select reference field now takes the value that **all** linked records share, instead of staying empty as soon as more than one record is linked.

**Example setup**

- _Group_ has a multi-select field "Children" and a dropdown field "City".
- Admin: Group → field "City" → Default value "inherited" → select `field "Children" > Child` → Configure → source field "City".

**Use cases**

1. **One child (works already)**
   The group links Ravi (Mumbai). → City = Mumbai.

2. **Several children with the same city (new)**
   The group links Ravi (Mumbai) and Asha (Mumbai). → City = Mumbai. Before: the field stayed empty.

3. **Different cities → nothing is filled**
   The group links Ravi (Mumbai) and Meena (Delhi). → City stays empty, and anything the user typed is not overwritten. When Meena is removed from the group again, City becomes Mumbai.

4. **Children without a city are ignored**
   The group links Ravi (Mumbai) and Kiran (no city recorded). → City = Mumbai.

5. **Existing group, link icon next to the field**
   - The value equals the shared city: icon shows "in sync".
   - The user changed the city manually: icon shows "out of sync", and clicking it resets the field to the shared city.
   - The linked children have different cities: the icon shows that there is nothing to inherit.

6. **A child's city changes → the group is updated (new for groups with several children)**
   - The group links Ravi (Mumbai) and Asha (Delhi), City is empty. Asha is changed to Mumbai → the dialog "Update related records" suggests City = Mumbai for the group.
   - The group links Ravi (Mumbai) and Asha (Mumbai), City = Mumbai. Ravi is changed to Pune → no dialog: the children differ now, and the group keeps its value.
   - Before: groups that link their children via a multi-select field never got this dialog.

7. **Existing behavior stays**
   Fields that inherit from a single-value reference field, and groups with exactly one child, work as before.

**Decisions to confirm**

- Empty values are ignored (use case 4). The alternative would be to treat "no city" like a different value, so Ravi + Kiran would leave the field empty.
- If the linked records differ, the field is left alone rather than cleared.

**Known limitations**

- Only applies when records are saved through their form (not import, bulk edit or inline table edit).
- If a linked record can't be loaded (e.g. missing read permission), no shared value is inherited.
- Values of multi-select source fields are compared exactly, so `[a, b]` and `[b, a]` count as different.
- Moving a child to another group, with an unchanged city, does not trigger an update for either group.
