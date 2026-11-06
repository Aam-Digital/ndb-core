# Feature Module: Hierarchy

Shows the records of a list indented below their parent records, e.g. actions and their sub-actions
of a project plan (issue #2634). The parent is a field of the record type that links to
**one** other record of the **same** type ("hierarchy field").

The feature plugs into the entities table through the generic extension points of its data sources
(see [entities-table README](../../core/common-components/entities-table/README.md)), core has no hierarchy code.

## Behaviour

- Every level is indented and sorted on its own (by the sorted column, with the same rules as a flat list).
  The list has no pages.
- Lines connect each record to its parent and its siblings, like a tree of files and folders.
  Each top-level record starts a block: its row has a very light background (grey 50)
  and, except for the first, a separator line (2px, grey 400) and a little extra space above it,
  and the titles of records with sub-records are in medium weight (500).
- Rows with sub-records can be collapsed; a collapsed row shows its number of direct sub-records after its title, e.g. "Village meetings (3)".
  Collapsed rows are not remembered: the list opens fully expanded, and a change of the filters
  or the search text expands everything again. A new or moved record expands its parents.
- Filters and the "Filter" search apply on every level. Parents of a match that do not match themselves
  (filtered out, or archived while archived records are hidden) are shown greyed as context rows.
  Context rows cannot be selected and are not downloaded; "select all" also leaves out
  records hidden under a collapsed row.
- A missing parent (deleted, not permitted, not loaded) or a loop of parents puts the record at the top level.
- Without a valid hierarchy field the data source works exactly like the in-memory data source (flat, with pages).

## Configuration

**List** (`EntityList`): the hierarchy data source with the fields users can choose from, the first one is the default.
Admins set this in the admin UI of the list view ("Hierarchy displayed by").

```json
"dataSource": { "name": "hierarchy", "config": { "hierarchyFields": ["parentAction", "dependsOn"] } }
```

The user chooses the field (or "None (flat list)") in the "Hierarchy" dropdown above the list.
The choice is kept in the URL param `_hierarchy` (with the `_` prefix of URL state other than filters, see `UrlStateService`),
the default field is not written to the URL.

**Related-entities section** on the details page of a record of the same type (JSON config only):
the relation `property` is the hierarchy field, and the section shows the whole branch below the page's record.
The "+" button fills in only that property.

```json
{ "component": "RelatedEntities", "config": { "entityType": "Action", "property": "parentAction", "dataSource": "hierarchy" } }
```

Invalid fields (not a single link to the same type) are ignored without an error, as this is a problem of the instance config.

## Key files

| File                                         | Purpose                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `hierarchy-tree.ts`                          | pure functions: resolve parents (loops, missing parents), context rows, sort, flatten     |
| `hierarchy-fields.ts`                        | which fields can define a hierarchy                                                       |
| `hierarchy-data-source.ts`                   | `HierarchyDataSource` ("hierarchy"): tree order, row options, collapse state, URL param   |
| `hierarchy-tree-cell/`                       | row options prefix: indentation, connector lines, expand/collapse button, context icon    |
| `hierarchy-child-count/`                     | row options suffix of a collapsed row: the number of its sub-records                      |
| `_hierarchy-rows.scss`                       | global styles of the rows (context, top-level and parent rows), included in `styles.scss` |
| `hierarchy-select/`                          | toolbar control: the "Hierarchy" dropdown                                                 |
| `hierarchy-expand-all/`                      | toolbar control: "Collapse all" / "Expand all"                                            |
| `admin-hierarchy-fields/`                    | admin setting "Hierarchy displayed by" (`ADMIN_ENTITY_LIST_SETTINGS`)                     |
| `demo-data/demo-action-generator.service.ts` | the sample plan for the "Action" type of demo mode "All Features"                         |

## How it works

- `HierarchyDataSource` computes the tree (`view`) from signals: all loaded records (for the parents),
  the filtered records (the matches), the field, the collapsed rows and the sort (`effectiveSort` and `sortValueFns`,
  set by the table). The row options are computed from it.
- The table's pipeline calls `_orderData()` of the data source, which returns the records in tree order
  instead of sorting a flat list. A change of the tree re-runs the pipeline.
- In a section, `getFilterPredicate()` replaces the condition linking records to the page's record
  (which only covers direct sub-records) by "is in the branch below the page's record".
- The prefix and suffix configs are cached per record id, so rows do not reload their components when the tree changes.
- Rows get global CSS classes from their row options (context rows, top-level rows, rows with sub-records),
  styled in `_hierarchy-rows.scss`, as rows belong to the table component.
- The tree cell stretches over the full height of its row (see the entities-table README),
  with a slot per level whose lines are drawn by CSS from `ancestorsContinue` and `isLastChild` of its row,
  so that the lines of the rows meet. The lines are decorative (`aria-hidden`).

## Limitations

- Records of one type only; only single-select link fields to the same type.
- All records are loaded and rendered at once (also in online-only sessions), meant for up to a few hundred records.
