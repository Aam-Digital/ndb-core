import { inject, Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { asArray } from "app/utils/asArray";
import { Entity } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import {
  DataFilter,
  getCurrentRecordPlaceholderFields,
} from "../../filter/filters/filters";
import { FilterService } from "../../filter/filter.service";
import { DynamicPlaceholderValueService } from "../../default-values/x-dynamic-placeholder/dynamic-placeholder-value.service";
import { Logging } from "../../logging/logging.service";
import { AsyncPromiseValidatorFn } from "../../common-components/entity-form/dynamic-form-validators/validator-types";
import {
  FieldValidator,
  ValidatorContext,
} from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { getCurrentRecordOfControl } from "../../common-components/entity-form/current-record-state";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { SchemaEmbedDatatype } from "../schema-embed/schema-embed.datatype";
import { EntityDatatype } from "./entity.datatype";

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
 * What the dropdown editing a link field (`EditEntityComponent`) shares with the field's validator,
 * so that both check the same record types and the validator does not load records again.
 */
export interface LinkedRecordsSource {
  /** the record types the dropdown offers */
  entityTypes: () => string[];
  /** a record (by its full id) the dropdown has already loaded, `undefined` if it has not */
  getLoaded: (id: string) => Entity | undefined;
}

const linkedRecordsSources = new WeakMap<
  AbstractControl,
  LinkedRecordsSource
>();

/**
 * Share the records a dropdown has loaded with the validators of its form control.
 * @returns a function to call when the dropdown is not bound to the control anymore
 */
export function registerLinkedRecordsSource(
  control: AbstractControl,
  source: LinkedRecordsSource,
): () => void {
  linkedRecordsSources.set(control, source);
  return () => {
    if (linkedRecordsSources.get(control) === source) {
      linkedRecordsSources.delete(control);
    }
  };
}

/**
 * Load a record that a link field refers to, `undefined` if it cannot be loaded
 * (not found or not permitted, which is not reported as a problem).
 */
export async function loadLinkedRecord<E extends Entity>(
  entityMapper: EntityMapperService,
  entityType: string,
  id: string,
): Promise<E | undefined> {
  return entityMapper
    .load<E>(entityType, id)
    .catch((err: { status?: number } | undefined) => {
      if (err?.status === 404) {
        Logging.debug("[ENTITY_SELECT] Selected entity not found.", id);
      } else {
        Logging.warn("[ENTITY_SELECT] Error loading selected entity.", err, id);
      }
      return undefined;
    });
}

/**
 * Validator for a field linking to other records, for selected records that do not match the field's `selectionCondition`.
 * Its error is only a warning (`warning: true`): the record can still be saved after confirming it.
 * Only checked once this field or a field of the record that the condition refers to is changed (dirty),
 * so that records linked before (e.g. before the condition was configured) do not ask again on every save.
 * Selected records that cannot be loaded are not checked.
 *
 * The record types and the records already loaded are taken from the dropdown editing the field
 * (see {@link registerLinkedRecordsSource}), only records it has not loaded are loaded here.
 *
 * @param fieldEntityTypes the record types the field links to (from its config),
 *   if the field is not edited with a dropdown sharing its record types
 * @param getCurrentRecord the record being edited, with the current values of its form,
 *   to resolve the placeholders referring to it (`undefined` if the form edits several records at once)
 */
export function selectionConditionValidator(
  condition: DataFilter<Entity>,
  fieldEntityTypes: string[],
  getCurrentRecord: (control: AbstractControl) => Entity | undefined,
  {
    entityMapper,
    placeholderService,
    filterService,
  }: SelectionConditionServices,
): AsyncPromiseValidatorFn {
  const referencedFields = getCurrentRecordPlaceholderFields(condition);
  return async (control) => {
    const changed =
      control.dirty ||
      referencedFields.some((field) => control.parent?.get(field)?.dirty);
    if (!changed) {
      return null;
    }
    const selectedIds = asArray<string>(control.value ?? []).filter(
      (id) => !!id,
    );
    if (selectedIds.length === 0) {
      return null;
    }
    const source = linkedRecordsSources.get(control);
    const dropdownTypes = source?.entityTypes() ?? [];
    const entityTypes =
      dropdownTypes.length > 0 ? dropdownTypes : fieldEntityTypes;
    const resolved = resolveSelectionCondition(
      condition,
      entityTypes,
      getCurrentRecord(control),
      placeholderService,
    );
    if (!resolved) {
      return null;
    }

    const matches = matchesSelectionCondition(resolved, filterService);
    const records = await Promise.all(
      selectedIds.map((id) => {
        const fullId = Entity.createPrefixedId(entityTypes[0], id);
        return (
          source?.getLoaded(fullId) ??
          loadLinkedRecord(entityMapper, entityTypes[0], fullId)
        );
      }),
    );
    const notMatching = records
      .filter((record) => record && !matches(record))
      .map((record) => record.toString());
    if (notMatching.length === 0) {
      return null;
    }
    const names = notMatching.join(", ");
    return {
      selectionCondition: {
        warning: true,
        errorMessage: $localize`Not matching the selection conditions of this field: ${names}`,
      },
    };
  };
}

/**
 * `selectionCondition: { center: "$current_record.center" }`: the linked records should match the condition
 * (see `DYNAMIC_VALIDATORS`); the dropdown of the field only offers such records.
 */
@Injectable()
export class SelectionConditionValidator extends FieldValidator<
  DataFilter<Entity>
> {
  static override key = "selectionCondition";
  override readonly warning = "always";
  override readonly async = true;
  // selecting a record is a single change (unlike typing a text)
  override readonly checkOnChange = true;

  private readonly entityMapper = inject(EntityMapperService);
  private readonly placeholderService = inject(DynamicPlaceholderValueService);
  private readonly filterService = inject(FilterService);

  override appliesTo(
    datatype: DefaultDatatype,
    field: EntitySchemaField,
  ): boolean {
    return (
      datatype instanceof EntityDatatype &&
      asArray(field.additional ?? []).length === 1
    );
  }

  build(
    value: DataFilter<Entity>,
    { entity, field, singleRecord }: ValidatorContext,
  ): AsyncPromiseValidatorFn | null {
    if (!value || !field?.id) {
      return null;
    }
    return selectionConditionValidator(
      value,
      // only if the field has no dropdown, which shares the types it offers (see EditEntityComponent)
      asArray(field.additional ?? []),
      (control) =>
        singleRecord ? getCurrentRecordOfControl(control, entity) : undefined,
      {
        entityMapper: this.entityMapper,
        placeholderService: this.placeholderService,
        filterService: this.filterService,
      },
    );
  }

  override dependsOn(value: DataFilter<Entity>): string[] {
    return getCurrentRecordPlaceholderFields(value);
  }

  override validateConfig(
    value: DataFilter<Entity>,
    field: EntitySchemaField,
    datatype: DefaultDatatype,
  ): string[] {
    if (!value) {
      return [];
    }
    if (field.dataType !== EntityDatatype.dataType) {
      return [
        datatype instanceof SchemaEmbedDatatype
          ? $localize`:config validation:A selection filter ("selectionCondition") does not apply to a field of embedded entries, it is ignored. Set it in the validators of the inner field linking to records instead (e.g. "additional.participant.validators").`
          : $localize`:config validation:A selection filter ("selectionCondition") only applies to a field linking to records, it is ignored.`,
      ];
    }
    if (asArray(field.additional ?? []).length !== 1) {
      return [
        $localize`:config validation:A selection filter ("selectionCondition") only applies to a field linking to one record type, it is ignored.`,
      ];
    }
    return [];
  }
}
