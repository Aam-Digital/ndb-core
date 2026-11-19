# Placeholders

`fillPlaceholders()` ([fill-placeholders.ts](fill-placeholders.ts)) fills `{...}` placeholders in a text with values of records, in the browser.

The syntax is the one of the Template Export feature (which is rendered by Carbone on the server).
Here only plain paths are supported:

| Placeholder       | Value                                              |
| ----------------- | -------------------------------------------------- |
| `{d.name}`        | the field `name` of the record                     |
| `{d._id}`         | the ID of the record, e.g. `Child:123`             |
| `{d.school.name}` | a field of a record linked in the field `school`   |
| `{c.user.name}`   | a field of the record linked to the logged-in user |

- Carbone formatters (`{d.date:formatD(L)}`) are not supported.
- Values are written as they are stored: a dropdown value or a linked record without a further key as its ID, a date-only value as `YYYY-MM-DD`, a date with time in ISO format, a list joined by commas. A translatable text is written in the active language.
- A field of a linked record (`{d.school.name}`) can only be read through a field that links a single record, not a list of records.
- An empty field gives an empty value.

## Used by

- [External Links](../../features/external-links/README.md)
