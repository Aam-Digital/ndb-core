# Reports

The reporting module allows organizations to automatically create reports of aggregated data for a given timespan.
This can be used to track indicators and export anonymous data.

There are currently two systems available to generate reports, both using the same config documents (`ReportConfig:*`):

- SQL-based queries executed server-side using the SQS server
- (legacy) client-side generator using the aggregation & query syntax below

## SQL Reports

This feature requires the [aam-services backend](https://github.com/Aam-Digital/aam-services).
It is based on [structured-query-service (SQS)](https://neighbourhood.ie/products-and-services/structured-query-server)
(this creates a read-only copy of the data in the CouchDB and allows to run SQLite queries against it).
SQS enables the possibility to create SQL-based queries in reports.
The SQS image is not available as open source and needs a licence. It is pulled from a private container registry.

Follow the instructions on the _aam-services_ repository to set up and enable the API.

### Using AI agents to generate SQL Queries

LLMs like ChatGPT or Claude can generate report queries for you.
We have a [guide / context document for this](https://docs.google.com/document/d/13yxJkqqoA9tBTbld65Y1FYA51l0W057m4D1wvoCILeQ/edit?usp=sharing).

## Configuration

The reports can be defined as `ReportConfig:*` entities.

There are different modes for `ReportConfig`:

### sql

Requirements: SQS

Some useful SQL query snippets for Aam Digital contexts are collected here: [Aam Digital SQL Snippets](https://docs.google.com/document/d/14JqS6xgZzC1xHUogDho5n1kyNLzX1Eoyv6MeZtRejuM/edit?usp=sharing)

#### Simple SQL Report

```json
// app/ReportConfig:test-report
{
  "_id": "ReportConfig:test-report",
  "title": "Test Report",
  "mode": "sql",
  "reportDefinition": [
    {
      "query": "SELECT c.name as name, c.dateOfBirth as dateOfBirth FROM Child c"
    }
  ]
}
```

#### SQL Report With Arguments

Use named placeholders in the SQL query (for example `$startDate` and `$endDate`) and map these args via `transformations`.

```json
// app/ReportConfig:test-report
{
  "_id": "ReportConfig:test-report",
  "title": "Test Report",
  "mode": "sql",
  "transformations": {
    "startDate": ["SQL_FROM_DATE"],
    "endDate": ["SQL_TO_DATE"]
  },
  "reportDefinition": [
    {
      "query": "SELECT c.name as name, c.dateOfBirth as dateOfBirth FROM Child c WHERE created_at BETWEEN $startDate AND $endDate"
    }
  ]
}
```

#### Nested SQL Report (Grouped)

`reportDefinition` supports nested groups. Each item is either:

- a query item: `{ "query": "SELECT ..." }`
- or a group item: `{ "groupTitle": "...", "items": [...] }`

Groups can contain queries and other groups recursively.

The hierarchical SQL view is rendered as a `Name` + `Count` table.
That means each row should represent one metric value (typically a single numeric column such as `COUNT(*) as count`).
If a query returns multiple columns, only one value is shown as the row value and the other fields are used as row label details.

```json
// app/ReportConfig:test-report-grouped
{
  "_id": "ReportConfig:test-report-grouped",
  "title": "Test Report Grouped",
  "mode": "sql",
  "reportDefinition": [
    {
      "query": "SELECT COUNT(*) as count FROM Child c"
    },
    {
      "groupTitle": "By School Type",
      "items": [
        {
          "query": "SELECT COUNT(*) as count FROM Child c JOIN School s ON s._id = c.schoolId WHERE s.privateSchool = 0"
        },
        {
          "query": "SELECT COUNT(*) as count FROM Child c JOIN School s ON s._id = c.schoolId WHERE s.privateSchool = 1"
        }
      ]
    }
  ]
}
```

In the UI, grouped SQL reports are rendered as a hierarchical report view, while single-query SQL reports are shown as a flat table.

### JSON-Query Reports (legacy)

#### Aggregation structure

Inside the `reportDefinition` an array of aggregations can be added.
The following example shows the structure of an aggregation.

```json
{
  "label": "Events",
  "query": "Event:toArray[*date >= ? & date <= ?]",
  "groupBy": ["category"],
  "aggregations": [
    {
      "query": ":getParticipantsWithAttendance(PRESENT):unique:addPrefix(Child):toEntities",
      "groupBy": ["gender", "religion"],
      "label": "Participants"
    }
  ]
}
```

- The `label` will be used to display the length of the `query` result in the final report.
- The `query` defines a valid [JSON-Query](https://github.com/auditassistant/json-query#queries).
- `groupBy` defines an array of properties by which the results of the `query` are grouped,
  these results will be nested in the top-level query.
- The `aggregations` array can be filled with further aggregations with the same structure.
  They will be executed on the result of the `query` as well as on each `groupBy` result.

#### `query` syntax

A full documentation can be found [here](https://github.com/auditassistant/json-query#queries).
The most top-level aggregation has to start with the entity which should be queried.
This can be done by selecting the entity type and chaining it with `:toArray`: e.g. `Child:toArray`.
Now the array of all children is ready to be aggregated.
You could for example be interested in all the children older than 10: `Child:toArray[* age > 10]`.
The `*` tells the query language to select all the children and not just one.
The simple `age` call refers to the `get age()` function of the child entity.
If you are interested in all female children older than 10 the call would look like `Child:toArray[* age>10 & gender=F]`.
If you are only interested in the names of these children `Child:toArray[* age>10 & gender=M].name` will transform the
array of children into an array of strings.

To navigate between different entities a set of functions extends the query syntax.
The full documentation for all the available functions can be found and extended in the
[QueryService](../../injectables/QueryService.html).
The first function you already know `:toArray` which creates an object into an array of values of this object.
The following functions also exist:

- `:unique` removes all duplicates from an array
- `:addPrefix(<ENTITY_TYPE>)` adds the prefix `<ENTITY_TYPE>` to all strings in the input array.
  This is necessary to use the `:toEntities` function.
  The prefix will only be added if it is not set yet.
- `:toEntities` transforms an array of entity-ids into an array of entities.
  The IDs need to have the full format e.g. `Child:1234-5678`.
  Therefore `:addPrefix` should always be used to add the correct entity before calling `:toEntities`.
- `:getRelated(<ENTITY_TYPE>, <PROPERTY_NAME>)` is used to get the entity or entities which are mentioned through ids
  on a property of another entity e.g., to get all children that are part of a set of notes write `Note:toArray:getRelated(Child, children)`
- `:getIds(<PROPERTY_NAME>)` works similar to `:getRelated` but does not transform the ids into entities.
- `:filterByObjectAttribute(<PROPERTY_NAME>, <KEY>, <VALUE>)` is used to filter by an attribute which is a complex
  object like a `configurable-enum`. `<PROPERTY_NAME>` refers to the name of the property of the parent attribute,
  `<KEY>` refers to a key of this property and `<VALUE>` refers to the value(s) for which should be filtered.
  `<VALUE>` can be a string of multiple matches which are separated by `|`.
  E.g., to get all notes which are home visits or guardian talks write:
  `Note:toArray:filterByObjectAttribute(category, id, HOME_VISIT|GUARDIAN_TALK)`
- `:getParticipantsWithAttendance(<ATTENDANCE_STATUS>)` only returns the children with the given attendance for a set
  of notes. The attendance refers to the `:countAs` attribute. To get all present children write
  `Note:toArray:getParticipantsWithAttendance(PRESENT)`
- `:addEntities(<ENTITY_TYPE>)` can be used to create an array holding multiple entity types.
  E.g., to create an array holding notes and event notes write `Note:toArray:addEntities(EventNote)`.
