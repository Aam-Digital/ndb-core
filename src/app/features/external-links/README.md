# External Links

Admins can add links to external sites (e.g. a CRM or an accounting tool) to the "three dots" actions menu of a record.
The link opens in a new tab and carries values of the record in its web address, so the other site can open the matching entry.

## Configuration

Each link is an `ExternalLinkConfig:*` record:

```json
{
  "_id": "ExternalLinkConfig:donor-crm",
  "title": "Open in Donor CRM",
  "entity": "Child",
  "url": "https://crm.example.org/contact?ref={d._id}&name={d.name}",
  "condition": { "status": "enrolled" }
}
```

- `entity`: the entity type whose records offer the link.
- `condition` (optional): a filter (same format as `displayCondition` of a field) that a record has to match.
- `url`: has to start with `http://` or `https://`. Values are URL-encoded when inserted.

Admins manage these records under Admin > External Links,
or in the "External Links" section of the admin screen of a record type (both open the same form).

### Placeholders

The `url` uses the placeholder syntax of the Template Export feature, filled in the browser by `fillPlaceholders()`.
For the supported syntax and how values are written, see the [placeholders README](../../utils/placeholders/README.md).
An empty field gives an empty value. To hide the link in that case, add a condition.

### When a link is shown

A link is offered for a record if all of these hold:

- the record is of the configured type and matches the condition,
- the user may read the record and the `ExternalLinkConfig` record (so permission rules for `ExternalLinkConfig` can limit a link to some roles),
- the `url` is a web address and every placeholder is supported and refers to an existing field (also the field of a linked record or of the user's record).

A link that is not shown because of its `url` or `condition` is a mistake in the configuration; it is not logged.

With more than two links for a record, they are collapsed into an "External Links" submenu.

The web addresses are built when the menu is built (so that a click opens the tab right away, which browsers would block as a popup after waiting for data).
The menu is built again each time it is opened, so changed values of linked records or changed link definitions are picked up without reloading the page.
Links are only offered in the menu of a single record, not for a selection of several records.

## Key files

- `external-link-config.ts` — the `ExternalLinkConfig` entity
- `external-links.service.ts` — loads the link definitions (cached until one changes) and turns them into menu actions
- `external-links.module.ts` — registers the admin views, the admin overview entry, the section in the entity type admin and the actions factory
- `edit-external-link-condition/` — form field opening the condition editor for the selected record type
- `src/app/utils/placeholders/fill-placeholders.ts` — the placeholder resolver
