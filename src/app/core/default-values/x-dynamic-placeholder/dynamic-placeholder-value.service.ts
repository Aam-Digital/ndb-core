import { inject, Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import {
  EntitySchemaField,
  PLACEHOLDERS,
} from "../../entity/schema/entity-schema-field";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { Logging } from "../../logging/logging.service";
import { Entity } from "../../entity/model/entity";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import {
  DataFilter,
  isCurrentRecordPlaceholder,
  placeholderFieldId,
  splitPlaceholderFieldId,
} from "../../filter/filters/filters";
import {
  AdminDefaultValueContext,
  DefaultValueStrategy,
} from "../default-value-strategy.interface";
import { DefaultValueConfigDynamic } from "./default-value-config-dynamic";
import { isEmptyValue } from "#src/app/utils/is-empty-value";
import { asArray } from "#src/app/utils/asArray";

/**
 * A simple default-value strategy that replaces placeholder strings with dynamic values, like the current date or user.
 */
@Injectable({
  providedIn: "root",
})
export class DynamicPlaceholderValueService extends DefaultValueStrategy {
  override readonly mode = "dynamic";

  private currentUser = inject(CurrentUserSubject);
  private readonly entitySchemaService = inject(EntitySchemaService);

  override async getAdminUI(): Promise<AdminDefaultValueContext> {
    const component =
      await import("./admin-default-value-dynamic/admin-default-value-dynamic.component").then(
        (c) => c.AdminDefaultValueDynamicComponent,
      );

    return {
      mode: this.mode,
      component: component,
      icon: "circle-left",
      description: $localize`dynamic placeholder (e.g. current date or user)`,
    };
  }

  override setDefaultValue(
    targetFormControl: AbstractControl<any, any>,
    fieldConfig: EntitySchemaField,
  ) {
    const config: DefaultValueConfigDynamic = fieldConfig.defaultValue.config;

    let value = this.getPlaceholderValue(config.value);

    if (!value) {
      return;
    }

    if (fieldConfig.isArray && !Array.isArray(value)) {
      targetFormControl.setValue([value]);
    } else {
      targetFormControl.setValue(value);
    }
  }

  /**
   * Get the current value for a given placeholder.
   * @param placeholder The placeholder string to resolve.
   * @returns The value for the given placeholder or `undefined` if not found.
   */
  getPlaceholderValue(placeholder: string): string | Date | undefined {
    switch (placeholder) {
      case PLACEHOLDERS.CURRENT_USER:
        let userId = this.currentUser.value?.getId();
        return userId;
      case PLACEHOLDERS.NOW:
        let date = new Date();
        return date;
      default:
        Logging.debug(
          "Unknown PLACEHOLDERS value used in fieldValueConfig: " + placeholder,
        );
        return;
    }
  }

  /**
   * Replace the `$current_record.<fieldId>` placeholders in a condition
   * (e.g. the `selectionCondition` of a field) with the values of the given record.
   * A placeholder inside a list (e.g. of `$in`) is replaced by all values of a multi-value field.
   * The values are used in database format, like the values of the records the condition is applied to.
   *
   * A row (a field with its value, or one of the conditions of `$and` or `$nor`) that references an empty field
   * cannot be applied and is left out. All other rows still apply.
   * If one of the alternatives of `$or` cannot be applied at all, the whole `$or` is left out
   * (that alternative does not restrict anything, so neither does the `$or`).
   *
   * A placeholder can go through a link field to a field of the linked record(s),
   * e.g. `$current_record.parentAction.locations` (one level only): it is replaced by the values of all linked records
   * given in `linkedRecords`. `_id` as the field of the linked record stands for that record itself.
   * Linked records that are not given (e.g. because they cannot be loaded) are skipped.
   *
   * @param condition The condition to resolve. It is not changed, a resolved copy is returned.
   * @param record The record being edited. Without a record (e.g. in bulk edit) no placeholder can be resolved.
   * @param linkedRecords The records that the record links to (by id), as far as placeholders go through them.
   * @returns The resolved condition, which is empty if no row is left to apply.
   */
  resolveRecordPlaceholders<T>(
    condition: DataFilter<T>,
    record: Entity | undefined,
    linkedRecords?: Map<string, Entity>,
  ): DataFilter<T> {
    const getValue = (placeholderField: string) => {
      const { fieldId, linkedFieldId } =
        splitPlaceholderFieldId(placeholderField);
      if (!linkedFieldId) {
        return this.getDatabaseValue(record, fieldId);
      }

      const linkValue = record?.[fieldId];
      const values = asArray<string>(linkValue ?? [])
        .map((id) => linkedRecords?.get(id))
        .map((linked) => this.getDatabaseValue(linked, linkedFieldId))
        .filter((value) => !isEmptyValue(value));
      if (!Array.isArray(linkValue)) {
        return values[0];
      }
      // the values of all linked records, each of them only once
      return [...new Set(values.flat())];
    };
    return resolveCondition(condition ?? {}, getValue) as DataFilter<T>;
  }

  /** the value of a record's field in database format, like the values of the records a condition is applied to */
  private getDatabaseValue(record: Entity | undefined, fieldId: string) {
    if (fieldId === "_id") {
      return record?.getId();
    }
    const value = record?.[fieldId];
    const schemaField = record?.getSchema().get(fieldId);
    if (value === undefined || value === null || !schemaField) {
      return value;
    }
    return this.entitySchemaService.valueToDatabaseFormat(value, schemaField);
  }
}

/** operators combining a list of conditions, each of which is a condition on its own */
const CONDITION_LIST_OPERATORS = ["$or", "$and", "$nor"];

/** marks a value that cannot be resolved, because it references an empty field */
const UNRESOLVED = Symbol("unresolved");

/** returns the value that a placeholder refers to (see `placeholderFieldId`), in database format */
type FieldValueGetter = (fieldId: string) => unknown;

/** the rows of a condition that can be applied, with their placeholders resolved */
function resolveCondition(condition: object, getValue: FieldValueGetter) {
  const resolved = {};
  for (const [key, value] of Object.entries(condition)) {
    const resolvedValue =
      CONDITION_LIST_OPERATORS.includes(key) && Array.isArray(value)
        ? resolveConditionList(key, value, getValue)
        : resolveValue(value, getValue);
    if (resolvedValue !== UNRESOLVED) {
      resolved[key] = resolvedValue;
    }
  }
  return resolved;
}

/**
 * The conditions of a list operator (`$or`, `$and`, `$nor`) of which at least one row can be applied
 * (`UNRESOLVED` if none can).
 * A condition that cannot be applied at all is left out of `$and` and `$nor`, which then restrict less.
 * For `$or` it would restrict more, as the other alternatives would have to match instead:
 * the whole `$or` is left out, because the alternative that cannot be applied does not restrict anything.
 */
function resolveConditionList(
  operator: string,
  conditions: object[],
  getValue: FieldValueGetter,
) {
  const resolved = conditions.map((condition) => ({
    condition,
    resolved: resolveCondition(condition, getValue),
  }));
  const isUnresolved = ({ condition, resolved }: (typeof resolved)[number]) =>
    Object.keys(resolved).length === 0 && Object.keys(condition).length > 0;

  if (operator === "$or" && resolved.some(isUnresolved)) {
    return UNRESOLVED;
  }
  const applicable = resolved
    .filter((entry) => !isUnresolved(entry))
    .map((entry) => entry.resolved);
  return applicable.length > 0 ? applicable : UNRESOLVED;
}

/** the value with its placeholders resolved (`UNRESOLVED` if one of them references an empty field) */
function resolveValue(value: unknown, getValue: FieldValueGetter): unknown {
  if (isCurrentRecordPlaceholder(value)) {
    const fieldValue = getValue(placeholderFieldId(value));
    return isEmptyValue(fieldValue) ? UNRESOLVED : fieldValue;
  }
  if (Array.isArray(value)) {
    return resolveList(value, getValue);
  }
  if (value && typeof value === "object") {
    return resolveObject(value, getValue);
  }
  return value;
}

/** a placeholder inside a list is replaced by all values of a multi-value field */
function resolveList(list: unknown[], getValue: FieldValueGetter): unknown {
  const items = list.map((item) => [item, resolveValue(item, getValue)]);
  if (items.some(([, resolved]) => resolved === UNRESOLVED)) {
    return UNRESOLVED;
  }
  return items.flatMap(([item, resolved]) =>
    isCurrentRecordPlaceholder(item) && Array.isArray(resolved)
      ? resolved
      : [resolved],
  );
}

function resolveObject(value: object, getValue: FieldValueGetter): unknown {
  const entries = Object.entries(value).map(([key, v]) => [
    key,
    resolveValue(v, getValue),
  ]);
  return entries.some(([, resolved]) => resolved === UNRESOLVED)
    ? UNRESOLVED
    : Object.fromEntries(entries);
}
