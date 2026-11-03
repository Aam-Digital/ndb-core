# Entities Table

`EntitiesTableComponent` (`app-entities-table`) shows records of one entity type as a table: sortable columns,
filters, paging, bulk selection and the "include archived records" toggle.
Each row is the record (entity) itself; clicking a row opens it according to the `clickMode`.
It is used by the entity list (`EntityListComponent`), the related-records sections on details pages
and several feature components.

## Key files

| File                                        | Purpose                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| `entities-table.component.ts`               | the table: columns, filter input, row click, row decorations                           |
| `entities-table-sort.store.ts`              | sort state, default sort and its URL params (`sortBy`, `sortOrder`)                    |
| `entities-table-selection.ts`               | bulk selection: checkbox, "select all", Shift-click ranges                             |
| `data-source/entities-table-data-source.ts` | abstract base of all data sources, with the extension points described below           |
| `data-source/in-memory-data-source.ts`      | loads all records and filters, sorts and pages them in memory; free-text search        |
| `data-source/paginated-data-source.ts`      | loads one page at a time from the database (online-only sessions)                      |
| `data-source/data-source-registry.ts`       | `DataSourceRegistry`: the data sources a config can name                               |
| `data-source/data-source-resolver.ts`       | `resolveDataSource()`: picks the data source for a list (config, session type, loader) |
| `free-text-filter/`                         | the "Filter" field, the toolbar control of the in-memory data source                   |
| `list-paginator/`                           | the paginator, remembering the page size per user                                      |

## Data sources

The table gets its records from a data source (a `MatTableDataSource`), passed in as `recordsDataSource`.
Hosts usually create it with `resolveDataSource(injector, dataSource, loaderMethod, entityType)`:

- an explicit `dataSource` of the list or section config wins (a name in the `DataSourceRegistry`);
- otherwise `"paginated"` in online-only sessions, `"in-memory"` for loaders that do not page
  and for small internal types with translated texts, or `environment.default_data_source`;
- `PaginatedDataSource`, which pages on the server, falls back to
  `InMemoryDataSource` outside of online-only sessions, because the local database cannot page.

The records a data source holds:

- `allRecords`: all loaded records (only filled by in-memory data sources);
- `filteredRecords`: the records passing the filters, across all pages (the input data of the table);
- `renderedRows`: the rows currently rendered: filtered, sorted and reduced to the current page.

The host sets `loadRecordConfig` to let the data source load and live-update the records itself,
or sets `allRecords` directly for records it loads on its own.
The table keeps the signals `dataFilter` (the filters), `effectiveSort` (the sorted column and direction)
and `sortValueFns` (how each column sorts) of the data source up to date.

## Extension points for feature modules

Feature modules can extend lists without feature-specific code in core:
they subclass a data source, override the hooks below and register it.
All hooks have defaults, so existing data sources do not need to set them.

| Hook                   | Default        | Purpose                                                                                |
| ---------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `config`               | `{}`           | options of the data source from the list or section config (see below)                 |
| `usesPagination`       | `true`         | signal; `false`: the table shows all rows and no paginator (may change at any time)    |
| `rowDecorations`       | empty map      | optional extras per row, by record id (see below)                                      |
| `toolbarControls`      | `[]`           | `DynamicComponentConfig`s that a host shows in the list's filter row, in this order    |
| `searchText`           | `""`           | free-text search; only data sources that apply it offer a toolbar control to enter it  |
| `getFilterPredicate()` | filter service | (`InMemoryDataSource` only) whether a record passes the filter, e.g. to reinterpret it |

A `RowDecoration` can have:

- `prefix`: a component (`DynamicComponentConfig`) shown before the content of the first data cell,
  i.e. the first displayed column that is neither the select column nor the "+" column
  (a column projected into the table by its host does not show it).
  The prefix is a flex item next to the cell's content, in a flex row filling the whole cell:
  with `align-self: stretch` it spans the full height of the row and may draw over the row divider (e.g. lines connecting rows);
- `suffix`: a component shown after the content of the first data cell, in the same flex row (e.g. a count next to a title);
- `cssClass`: an extra CSS class for the row;
- `selectable: false`: the row cannot be selected for bulk actions
  (disabled checkbox, skipped by "select all" and Shift-click ranges).

The selection never holds a record that is not selectable: one effect of the table removes it,
however it got there (Shift-click range, the host, or a decoration that changed since, e.g. a row the data source hides),
so a bulk action never applies to it.

Decorations are display state of one table, so they live in the data source rather than on the records.
They are looked up by `entity.getId()` rather than by record object,
because a live update replaces the record object and the row should keep its decoration
until the data source has computed new ones.
Keep the `prefix`, `suffix` and `toolbarControls` config objects stable (e.g. create them once in a `computed`):
`appDynamicComponent` reloads the component whenever it gets a new config object.

The entity list shows the `toolbarControls` in its filter row (on desktop and mobile);
sections on details pages do not.
A toolbar control receives the data source through its `config`, e.g. `{ component: "FreeTextFilter", config: { dataSource: this } }`,
and its component has to be registered in the `ComponentRegistry`.

Register the data source in the feature module, then configure lists to use it by name:

```typescript
export class MyFeatureModule {
  constructor() {
    inject(DataSourceRegistry).add("my-feature", MyFeatureDataSource);
  }
}
```

```json
{ "component": "EntityList", "config": { "entityType": "Child", "dataSource": "my-feature" } }
```

A data source that needs options gets them from the same entry, as `config` next to its `name`.
`resolveDataSource` sets them as the data source's `config` signal:

```json
"dataSource": { "name": "my-feature", "config": { "someOption": ["a", "b"] } }
```

This keeps options of feature data sources out of the inputs of the core list and section components.
To let admins set these options in the admin editor of a list view, a feature module provides a settings component
through `ADMIN_ENTITY_LIST_SETTINGS` (`src/app/core/admin/admin-entity-list/admin-entity-list-settings.ts`).

## State in the URL

The entity list keeps its filters, sort and column-group tab in the URL query params, so that reloading
or going back restores the view. All of this goes through `UrlStateService` (`src/app/utils/url-state/`).
Every query param counts as a filter value, except the keys that their owners register with
`registerNonFilterKeys()` before writing them: the sort store registers `sortBy` and `sortOrder`,
`TabStateMemoDirective` its tab key (`tabIndex` by default).
A new kind of URL state (e.g. of a feature data source) must register its keys the same way,
otherwise the filters treat it as a filter value and clear the default filters on reload.
