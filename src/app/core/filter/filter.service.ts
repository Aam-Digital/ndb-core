import { inject, Injectable } from "@angular/core";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { Entity, EntityConstructor } from "../entity/model/entity";
import {
  combineFilterConditions,
  DataFilter,
  Filter as EntityFilter,
} from "./filters/filters";
import {
  createFilterPredicate,
  isPlainObject,
} from "../../utils/filter-compare-utils";
import { isEqual } from "lodash-es";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { EntitySchema } from "../entity/schema/entity-schema";
import { toStoredFormatCondition, toStoredFormatRecord } from "./stored-format";
import {
  getEmbeddedFieldId,
  getEmbeddedFieldLabel,
  getEmbeddedFieldRefs,
  getSchemaEmbedDatatype,
  resolveEmbeddedField,
} from "../entity/schema/embedded-schema-field.util";
import { conditionOnEmbeddedField } from "./embedded-field-filter";
import { FormFieldConfig } from "../common-components/entity-form/FormConfig";
import { asArray } from "../../utils/asArray";
import { Logging } from "../logging/logging.service";
import { SchemaEmbedDatatype } from "../basic-datatypes/schema-embed/schema-embed.datatype";
import { requiredEntry, requiredStoredValue } from "./required-values";
import { resolveLocaleText } from "../language/active-locale";

/**
 * Works with conditions on records: matches records in memory, offers the fields a condition can be set on,
 * and pre-fills a new record so that it matches a condition.
 */
@Injectable({
  providedIn: "root",
})
export class FilterService {
  private readonly schemaService = inject(EntitySchemaService);

  /** the records in the stored format, kept per saved revision (see {@link toStoredFormat}) */
  private readonly storedFormatCache = new WeakMap<
    Entity,
    { rev: string; record: object | undefined }
  >();

  /**
   * The fields of the entity type that a condition can be set on, for a field select, in the order of the schema:
   * its own fields and, in place of an embedded field itself, the properties of its entries (with paths like "attendance.status").
   * The `excludedFields` are the embedded fields replaced by their properties.
   * The options include the record's own fields, as the field select lists given options before the ones it infers.
   *
   * @param onStoredDocuments the conditions are matched against the stored documents (e.g. permissions, notification rules),
   *    which do not support conditions on the entries of an embedded field: embedded fields are then kept whole
   */
  getConditionFields(
    entityType: EntityConstructor,
    onStoredDocuments = false,
  ): {
    options: FormFieldConfig[];
    excludedFields: string[];
  } {
    const embeddedRefs = onStoredDocuments
      ? []
      : getEmbeddedFieldRefs(this.schemaService, entityType);

    const options: FormFieldConfig[] = [];
    const excludedFields: string[] = [];
    for (const [id, field] of entityType.schema) {
      const [option] = fieldOptions([[id, field]]);
      if (!option) continue;

      const refs = embeddedRefs.filter((ref) => ref.outerProp === id);
      if (refs.length === 0) {
        options.push(option);
        continue;
      }
      options.push(
        ...refs.map((ref) => ({
          ...ref.innerSchema,
          id: getEmbeddedFieldId(ref),
          label: getEmbeddedFieldLabel(ref),
        })),
      );
      excludedFields.push(id);
    }
    return { options, excludedFields };
  }

  /** The schema of the field at the path (see {@link getConditionFields}). */
  getFieldAtPath(
    entityType: EntityConstructor,
    fieldPath: string,
  ): EntitySchemaField | undefined {
    return (
      entityType.schema.get(fieldPath) ??
      resolveEmbeddedField(this.schemaService, entityType, fieldPath)
        ?.innerSchema
    );
  }

  /**
   * A condition on a field path (see {@link getConditionFields}) as it is stored:
   * one on a property of an embedded field is a condition on one of its entries
   * (e.g. `{ "attendance.status": "A" }` becomes `{ attendance: { $elemMatch: { status: "A" } } }`).
   */
  editorRowToCondition<T extends Entity>(
    entityType: EntityConstructor,
    condition: DataFilter<T>,
  ): DataFilter<T> {
    const fields = Object.keys(condition ?? {});
    // a row with conditions on several fields stays as it is, like in {@link conditionToEditorRow}:
    // wrapping it in `$elemMatch` would turn the conditions on other fields into conditions on the entry
    const fieldPath = fields.length === 1 ? fields[0] : undefined;
    const embedded =
      fieldPath &&
      resolveEmbeddedField(this.schemaService, entityType, fieldPath);
    return embedded
      ? conditionOnEmbeddedField(condition, fieldPath, embedded)
      : condition;
  }

  /** The reverse of {@link editorRowToCondition}: a condition on one entry of an embedded field becomes one on the path of the property. */
  conditionToEditorRow<T extends Entity>(
    entityType: EntityConstructor,
    condition: DataFilter<T>,
  ): DataFilter<T> {
    const fields = Object.keys(condition ?? {});
    // a row with conditions on several fields stays as it is, so that none of them gets lost
    const fieldId = fields.length === 1 ? fields[0] : undefined;
    const entryCondition = condition?.[fieldId]?.$elemMatch;
    const innerKeys = isPlainObject(entryCondition)
      ? Object.keys(entryCondition)
      : [];
    if (innerKeys.length !== 1 || innerKeys[0].startsWith("$")) {
      return condition;
    }
    const fieldPath = `${fieldId}.${innerKeys[0]}`;
    return resolveEmbeddedField(this.schemaService, entityType, fieldPath)
      ? ({ [fieldPath]: entryCondition[innerKeys[0]] } as DataFilter<T>)
      : condition;
  }

  combineFilters<T extends Entity>(
    entityFilters: EntityFilter<T>[],
  ): DataFilter<T> {
    return combineFilterConditions<T>(
      ...entityFilters.map((value: EntityFilter<T>): DataFilter<T> =>
        value.getFilter(),
      ),
    );
  }

  /**
   * A function telling whether a record matches the condition, e.g. to filter a list of records.
   * Records are matched in the stored format, like the database matches them
   * (see the README of the filter module).
   *
   * @throws if the condition cannot be parsed
   */
  getFilterPredicate<T extends Entity>(
    filter: DataFilter<T>,
  ): (record: T) => boolean {
    if (Object.keys(filter ?? {}).length === 0) {
      // matches every record, so a list without active filter does not convert its records
      return () => true;
    }
    const matchesAsIs = createFilterPredicate<T>(filter);
    const matchesPerSchema = new Map<
      EntitySchema,
      (record: object) => boolean
    >();
    return (record: T) => {
      if (!(record instanceof Entity)) {
        return matchesAsIs(record);
      }
      const schema = record.getSchema();
      let matches = matchesPerSchema.get(schema);
      if (!matches) {
        matches = createFilterPredicate(
          toStoredFormatCondition(filter, schema, this.schemaService, true),
        );
        matchesPerSchema.set(schema, matches);
      }
      const storedRecord = this.toStoredFormat(record);
      return !!storedRecord && matches(storedRecord);
    };
  }

  /**
   * The record as the database stores it (see {@link toStoredFormatRecord}).
   *
   * Saved records are converted once per revision (also when that fails). A record without revision (e.g. a new record) is converted every time,
   * as it may still change. A copy with unsaved changes (like the current state of a form) is a new object and converted anew.
   *
   * @returns the stored format, or `undefined` for a record with a value that cannot be converted
   */
  private toStoredFormat(record: Entity): object | undefined {
    const cached = this.storedFormatCache.get(record);
    if (record._rev && cached?.rev === record._rev) {
      return cached.record;
    }

    let storedRecord: object | undefined;
    try {
      storedRecord = toStoredFormatRecord(record, this.schemaService);
    } catch (err) {
      // a data problem of this record, not a reason to fail the whole list: the record is left out,
      // as matching its entity format against a condition in the stored format would give wrong results
      Logging.warn(
        "[FILTER] could not convert a record to the stored format, leaving it out of the result",
        err,
        { id: record.getId() },
      );
    }
    if (record._rev) {
      this.storedFormatCache.set(record, {
        rev: record._rev,
        record: storedRecord,
      });
    }
    return storedRecord;
  }

  /**
   * Set the values the condition requires on the entity (in place), so that it matches the condition afterwards.
   *
   * Only conditions requiring one specific value are applied, like `{ category: "A" }`, `{ category: { $in: ["A"] } }`
   * or `{ tags: { $elemMatch: { $eq: "A" } } }` (only for a multi-value field), every branch of `$or` and `$and`.
   * A condition on an entry of an embedded field (like `{ attendance: { $elemMatch: { participant: "Child:1" } } }`)
   * adds such an entry. The values are converted from the stored format through the datatype of the field.
   */
  alignEntityWithFilter<T extends Entity>(entity: T, filter: DataFilter<T>) {
    for (const [key, condition] of Object.entries(filter ?? {})) {
      if (key === "_id") {
        // a filter selecting existing records by id does not describe a new record
        continue;
      }
      if ((key === "$or" || key === "$and") && Array.isArray(condition)) {
        // apply each branch of the alternatives ($or) or required parts ($and)
        condition.forEach((branch) =>
          this.alignEntityWithFilter(entity, branch),
        );
      } else {
        this.alignFieldCondition(entity, key, condition);
      }
    }
  }

  /** Set the value a condition on one field (or on a property of an embedded field) requires. */
  private alignFieldCondition(entity: Entity, key: string, condition: unknown) {
    const schema = entity.getSchema();
    const [path, storedCondition] = Object.entries(
      toStoredFormatCondition({ [key]: condition }, schema, this.schemaService),
    )[0];
    const [fieldId, ...innerPath] = path.split(".");
    const field = schema.get(fieldId);
    const container = getSchemaEmbedDatatype(this.schemaService, field);

    if (container && innerPath.length > 0) {
      // a single embedded object, e.g. { "phone.type": "mobile" }
      this.addEmbeddedEntry(entity, fieldId, field, container, {
        [innerPath.join(".")]: storedCondition,
      });
    } else if (container && isPlainObject(storedCondition?.["$elemMatch"])) {
      this.addEmbeddedEntry(
        entity,
        fieldId,
        field,
        container,
        storedCondition["$elemMatch"],
      );
    } else if (field && innerPath.length === 0) {
      const value = requiredStoredValue(
        storedCondition,
        field,
        this.schemaService,
      );
      if (value !== undefined) {
        entity[fieldId] = this.schemaService.valueToEntityFormat(
          field.isArray
            ? this.storedValuesWith(entity[fieldId], field, value)
            : value,
          field,
          entity,
        );
      }
    }
  }

  /** the stored values of a multi-value field with the value added, as several parts of a condition can each require one */
  private storedValuesWith(
    current: unknown,
    field: EntitySchemaField,
    value: unknown,
  ): unknown[] {
    const stored = asArray(
      this.schemaService.valueToDatabaseFormat(current ?? [], field) ?? [],
    );
    return stored.some((storedValue) => isEqual(storedValue, value))
      ? stored
      : [...stored, value];
  }

  /**
   * Add the entry required by the conditions on the inner properties of an embedded field
   * to its list of entries, or into its single embedded object.
   */
  private addEmbeddedEntry(
    entity: Entity,
    fieldId: string,
    field: EntitySchemaField,
    container: SchemaEmbedDatatype,
    innerConditions: object,
  ) {
    const storedEntry = requiredEntry(
      container,
      field,
      innerConditions,
      this.schemaService,
    );
    if (!storedEntry) {
      return;
    }

    if (container.holdsArray(field)) {
      const entries = asArray(entity[fieldId] ?? []);
      const [newEntry] = asArray(
        this.schemaService.valueToEntityFormat([storedEntry], field, entity),
      );
      // the alternatives of a condition (like the shapes a field may be stored in) can require the same entry
      if (!entries.some((entry) => isEqual(entry, newEntry))) {
        entity[fieldId] = [...entries, newEntry];
      }
    } else {
      entity[fieldId] = {
        ...(entity[fieldId] ?? {}),
        ...this.schemaService.valueToEntityFormat(storedEntry, field, entity),
      };
    }
  }
}

/** the options for the given fields that an admin can select (not the internal ones, nor those without a label) */
export function fieldOptions(
  fields: [string, EntitySchemaField][],
): FormFieldConfig[] {
  return fields
    .filter(([, field]) => !field.isInternalField && !!field.label)
    .map(([id, field]) => ({
      ...field,
      id,
      label: resolveLocaleText(field.label),
    }));
}
