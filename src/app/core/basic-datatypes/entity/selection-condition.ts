import { AbstractControl } from "@angular/forms";
import { asArray } from "app/utils/asArray";
import { Entity } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { DataFilter } from "../../filter/filters/filters";
import { FilterService } from "../../filter/filter.service";
import { DynamicPlaceholderValueService } from "../../default-values/x-dynamic-placeholder/dynamic-placeholder-value.service";
import { Logging } from "../../logging/logging.service";
import { AsyncPromiseValidatorFn } from "../../common-components/entity-form/dynamic-form-validators/validator-types";

/**
 * The `selectionCondition` of a field linking to other records,
 * with its placeholders referring to the record being edited resolved,
 * or `undefined` if it does not apply: none is configured, none of its rows can be applied,
 * or the field links to several record types (with different fields).
 */
export function resolveSelectionCondition<E extends Entity>(
  condition: DataFilter<E> | undefined,
  entityTypes: string[],
  record: Entity | undefined,
  placeholderService: DynamicPlaceholderValueService,
): DataFilter<E> | undefined {
  if (
    !condition ||
    Object.keys(condition).length === 0 ||
    entityTypes.length !== 1
  ) {
    return undefined;
  }

  const resolved = placeholderService.resolveRecordPlaceholders(
    condition,
    record,
  );
  return Object.keys(resolved).length > 0 ? resolved : undefined;
}

/** Whether a record matches a resolved `selectionCondition` (any record does if the condition is invalid). */
export function matchesSelectionCondition<E extends Entity>(
  condition: DataFilter<E> | undefined,
  filterService: FilterService,
): (record: E) => boolean {
  if (!condition) {
    return () => true;
  }
  try {
    return filterService.getFilterPredicate(condition);
  } catch (err) {
    // an instance config problem and the resolved condition contains record data: not for remote monitoring
    Logging.debug("[ENTITY_SELECT] Invalid selectionCondition.", err);
    return () => true;
  }
}

/** the services the `selectionCondition` validator uses */
export interface SelectionConditionServices {
  entityMapper: EntityMapperService;
  placeholderService: DynamicPlaceholderValueService;
  filterService: FilterService;
}

/**
 * Validator for a field linking to other records, for selected records that do not match the field's `selectionCondition`.
 * Its error is only a warning (`warning: true`): the record can still be saved after confirming it.
 * Selected records that cannot be loaded are not checked.
 *
 * @param getCurrentRecord the record being edited, with the current values of its form,
 *   to resolve the placeholders referring to it (`undefined` if the form edits several records at once)
 */
export function selectionConditionValidator(
  condition: DataFilter<Entity>,
  entityTypes: string[],
  getCurrentRecord: (control: AbstractControl) => Promise<Entity | undefined>,
  {
    entityMapper,
    placeholderService,
    filterService,
  }: SelectionConditionServices,
): AsyncPromiseValidatorFn {
  return async (control) => {
    const selectedIds = asArray<string>(control.value ?? []).filter(
      (id) => !!id,
    );
    if (selectedIds.length === 0) {
      return null;
    }
    const resolved = resolveSelectionCondition(
      condition,
      entityTypes,
      await getCurrentRecord(control),
      placeholderService,
    );
    if (!resolved) {
      return null;
    }

    const matches = matchesSelectionCondition(resolved, filterService);
    const selected = await Promise.all(
      selectedIds.map((id) =>
        entityMapper.load(entityTypes[0], id).catch(() => undefined),
      ),
    );
    const notMatching = selected
      .filter((record) => record && !matches(record))
      .map((record) => record.toString());
    if (notMatching.length === 0) {
      return null;
    }
    const names = notMatching.join(", ");
    return {
      selectionCondition: {
        warning: true,
        errorMessage: $localize`Not matching the filter of this field: ${names}`,
      },
    };
  };
}
