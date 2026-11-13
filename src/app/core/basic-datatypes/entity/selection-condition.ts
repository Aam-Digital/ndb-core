import { inject, Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { asArray } from "app/utils/asArray";
import { Entity } from "../../entity/model/entity";
import { EntityRegistry } from "../../entity/database-entity.decorator";
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
 * `selectionCondition: { center: "$current_record.center" }`: the linked records should match the condition;
 * the dropdown of the field only offers such records.
 *
 * Only checked once this field or a field of the record that the condition refers to is changed (dirty),
 * so that records linked before (e.g. before the condition was configured) do not ask again on every save.
 * Selected records that cannot be loaded are not checked.
 * The record types and the records already loaded are taken from the dropdown editing the field
 * (see {@link registerLinkedRecordsSource}), only records it has not loaded are loaded here.
 */
@Injectable()
export class SelectionConditionValidator extends FieldValidator<
  DataFilter<Entity>
> {
  static override readonly key = "selectionCondition";
  readonly label = $localize`Selection Filter`;
  override readonly description = $localize`Only offer records matching a condition for selection in this field, e.g. based on the values of the record being edited. Selecting another record shows a warning, but users can still save.`;
  override readonly configComponent = "SelectionConditionValidatorSetting";
  override readonly warning = "always";
  override readonly requiresFieldId = true;

  private readonly entityRegistry = inject(EntityRegistry);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly placeholderService = inject(DynamicPlaceholderValueService);
  private readonly filterService = inject(FilterService);

  override appliesTo(
    datatype: DefaultDatatype,
    field: EntitySchemaField,
  ): boolean {
    const types = asArray(field.additional ?? []);
    return (
      datatype instanceof EntityDatatype &&
      types.length === 1 &&
      this.entityRegistry.has(types[0])
    );
  }

  build(
    condition: DataFilter<Entity>,
    { entity, field, singleRecord }: ValidatorContext,
  ): AsyncPromiseValidatorFn {
    const referencedFields = getCurrentRecordPlaceholderFields(condition);
    // only used if the field has no dropdown, which shares the types it offers (see EditEntityComponent)
    const fieldEntityTypes = asArray(field.additional ?? []);
    return async (control) => {
      const changed =
        control.dirty ||
        referencedFields.some((id) => control.parent?.get(id)?.dirty);
      const selectedIds = asArray<string>(control.value ?? []).filter(
        (id) => !!id,
      );
      if (!changed || selectedIds.length === 0) {
        return null;
      }
      const source = linkedRecordsSources.get(control);
      const dropdownTypes = source?.entityTypes() ?? [];
      const entityTypes =
        dropdownTypes.length > 0 ? dropdownTypes : fieldEntityTypes;
      const resolved = resolveSelectionCondition(
        condition,
        entityTypes,
        singleRecord ? getCurrentRecordOfControl(control, entity) : undefined,
        this.placeholderService,
      );
      if (!resolved) {
        return null;
      }
      const names = await this.notMatchingNames(
        resolved,
        entityTypes[0],
        selectedIds,
        source,
      );
      return names
        ? {
            selectionCondition: {
              errorMessage: $localize`Not matching the selection conditions of this field: ${names}`,
            },
          }
        : null;
    };
  }

  /** the names of the selected records not matching the resolved condition, `""` if all match */
  private async notMatchingNames(
    resolved: DataFilter<Entity>,
    entityType: string,
    selectedIds: string[],
    source: LinkedRecordsSource | undefined,
  ): Promise<string> {
    const matches = matchesSelectionCondition(resolved, this.filterService);
    const records = await Promise.all(
      selectedIds.map((id) => {
        const fullId = Entity.createPrefixedId(entityType, id);
        return (
          source?.getLoaded(fullId) ??
          loadLinkedRecord(this.entityMapper, entityType, fullId)
        );
      }),
    );
    return records
      .filter((record) => record && !matches(record))
      .map((record) => record.toString())
      .join(", ");
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
