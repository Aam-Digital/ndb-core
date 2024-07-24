# Exports

The list views like `/child`, `/school`, `/note` ,... have a button to export data.
Clicking this button will create a downloadable `.csv` file.
The format of this file can be adjusted through the configuration for the list view.

## Config Format

The configuration of the export format is part of the configuration of the [EntityListComponent](../../interfaces/EntityListConfig.html).

E.g.

```json
  "view:child": {
    "component": "ChildrenList",
    "config": {
        "exportConfig": [
          { "label": "Child", "query": ".name" },
          {
            "query": ":getRelated(ChildSchoolRelation, childId)",
            "subQueries": [
              { "label": "School Name", "query": ".schoolId:toEntities(School).name" },
              { "label": "From", "query": ".start" },
              { "label": "To", "query": ".end" }
            ]

          }
        ],
      "title": "Children List",
      "columns": [...],
      "columnGroups": {...},
      "filters": [...]
    }
  },
```

## Configuring a Export

The structure of the exports is according to the [ExportColumnConfig](../../interfaces/ExportColumnConfig.html).

The `label` property is optional and provides a title for this column.
If nothing is provided the query (without dots) is used (e.g. for `"query": ".name"` the label will be `name`).

The `query` has to be a valid [JSON-Query](https://github.com/auditassistant/json-query#queries).
The query will be run on each entity of the list page that is visited (e.g. on each child).
For further information about the query-syntax read the [Reports Guide](reports.md) which uses the same query language.

The `subQueries` is optional and expects an array of `ExportColumnConfigs`.
The queries of the `subQueries` will be run for each result of the parent query.
In the example above, this would mean that for each `ChildSchoolRelation` the name of the school, the from- and the to-date will be exported.
If `subQueries` is defined, each object of the parent query will lead to one row in the report.
In the example above this would mean if there are `n` children and each of them has `m` child-school-relations then the final report will have `n*m` rows and the columns `Child`, `School Name`, `From`, `To` (`Child` from the first query and the others from the sub-queries).
In case `subQueries` is defined, the result of the parent query will not be visible in the export.
If the results of the parent query is wanted in the report, a simple sub-query can be added that returns all values of the parent query (`query: "[*]"`).

## Example Output

Using the config from above with the following data:

```typescript
const child1 = {
  _id: "Child:1",
  name: "Peter",
};
const child2 = {
  _id: "Child:2",
  name: "Anna",
};
const relation1 = {
  _id: "ChildSchoolRelation:1",
  schoolId: "1",
  childId: "1",
  start: "01/01/2020",
  end: "01/01/2021",
};
const relation2 = {
  _id: "ChildSchoolRelation:2",
  schoolId: "1",
  childId: "1",
  start: "01/01/2021",
};
const relation3 = {
  _id: "ChildSchoolRelation:3",
  schoolId: "1",
  childId: "1",
  start: "01/01/2021",
};
const school = {
  _id: "School:1",
  name: "High School",
};
```

Would create a `.csv` file according to the following table:

| Child | School Name | From       | To         |
| ----- | ----------- | ---------- | ---------- |
| Peter | High School | 01/01/2020 | 01/01/2021 |
| Peter | High School | 01/01/2021 |            |
| Anna  | High School | 01/01/2021 |            |
