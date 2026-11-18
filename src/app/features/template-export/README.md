# Template Export (File / PDF Generation)

The template-export module generates files (PDFs) for one or more records
by filling the placeholders of an uploaded template file (e.g. a `.docx`) with the records' data.

Rendering happens server-side in the Export API of the [aam-services backend](https://github.com/Aam-Digital/aam-services),
which uses [carbone](https://carbone.io/documentation.html) as template engine.
The frontend manages the templates and assembles the data that is sent with a render request.

## Key files

- `template-export.entity.ts` — `TemplateExport`, the settings of one template (managed by admins under "Admin > Export Templates")
- `template-export-api/template-export-api.service.ts` — `TemplateExportApiService`, uploads template files and sends the render requests
- `template-export-selection-dialog/` — the "Generate File" dialog, in which users select a template for the record(s)
- `template-export-context/template-export-context.service.ts` — context data that is independent of the record (`{c.…}`)
- `template-export-related-records/` — config, loading and admin UI of the related records to include in a template
- `../../core/entity/entity-relation-resolver/entity-relation-resolver.service.ts` — resolves the records a record links to

## Data available to placeholders

| Placeholder                               | Data                                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `{d.name}`                                | a field of the record, by its field ID                                                                    |
| `{d.school.name}`                         | a field of a record that the record links to in an entity-reference field (resolved one level deep)       |
| `{d._related.Todo.parentTask[i].subject}` | a field of the records linking _to_ the record, if configured for the template (see below)                |
| `{c.user.name}`                           | a field of the record linked to the logged-in user                                                        |
| `{d[i].name}`                             | a field of each selected record, in a "Multi-Record Report" template (`arrayReport`) with `d` as an array |

The exported entity objects are never modified to add this data: the request data is built from copies.

## Related records

Records linking _to_ the exported record (e.g. the sub-tasks of a task, the notes about a child)
are only loaded if a template lists them in `TemplateExport.relatedRecords`,
to avoid loading and sending more data than a template needs.
Each entry (`TemplateExportRelatedRecords`) defines

- `entityType` and `property`: the record type and its field that links to the exported record,
  either an entity-reference field or a field of embedded objects with one (e.g. the participants of attendance items).
  The list is added to the record's data under both (`{d._related.<entityType>.<property>[i].…}`),
  kept under `_related` apart from the record's own fields (`d.*`), so that a list never hides a field.
  Several entries can be included, each for another record type or field.
- `levels` (optional): how many levels to load if the related records link among themselves
  through the same field (e.g. sub-tasks of sub-tasks). The records of each further level are added
  to their parent record in the same way (`{d._related.Todo.parentTask[i]._related.Todo.parentTask[i].subject}`).
- `includeArchived` (optional): whether archived (inactive) records are included, too.
  A template can tell them apart by their `inactive` field.

`TemplateExportRelatedRecordsService` loads these lists when a file is generated:

- A list is always present (possibly empty) for a valid entry, so that a repetition in the template prints nothing
  rather than the unresolved placeholder.
- Archived (inactive) records are excluded, together with the records below them in a hierarchy,
  unless `includeArchived` is set. Each list is sorted by the display text of the records.
- Related records are copies with their own entity-reference fields resolved one level deep,
  like the exported record itself. Only a plain link field to the record they are listed under
  holds just the ids (`{_id}`), as that record is available one level up.
- The related records for all exported records are looked up together, once per entry and level
  (`EntityRelationsService.loadLinkingToEntities`), also for a bulk export.
- Only records available to the current user are included, like everywhere in the app.
- An entry that cannot be applied (e.g. its field was removed from the data structure) is skipped
  and reported as a warning. The admin form (`EditTemplateExportRelatedRecords`) validates entries to prevent this.
