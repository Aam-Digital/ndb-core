import { inject, Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { asArray } from "app/utils/asArray";
import { Entity } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import {
  CURRENT_RECORD_PLACEHOLDER_PREFIX,
  CurrentRecordReference,
  DataFilter,
  getCurrentRecordPlaceholderFields,
  getCurrentRecordReferences,
} from "../../filter/filters/filters";
import { FilterService } from "../../filter/filter.service";
import { DynamicPlaceholderValueService } from "../../default-values/x-dynamic-placeholder/dynamic-placeholder-value.service";
import { Logging } from "../../logging/logging.service";
import { AsyncPromiseValidatorFn } from "../../common-components/entity-form/dynamic-form-validators/validator-types";
import {
  FieldValidator,
  RecordTypeFields,
  ValidatorContext,
} from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { getCurrentRecordOfControl } from "../../common-components/entity-form/current-record-state";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { SchemaEmbedDatatype } from "../schema-embed/schema-embed.datatype";
import { EntityDatatype } from "./entity.datatype";
import { loadLinkedRecords } from "./load-linked-records";

/**
 * The `selectionCondition` of a field linking to other records,
 * with its placeholders referring to the record being edited resolved,
 * or `undefined` if it does not apply: none is configured, none of its rows can be applied,
 * or the field links to several record types (with different fields).
 *
 * @param linkedRecords the records that the record links to, for placeholders referring to their fields
 *   (see {@link getPlaceholderLinkedRecordIds})
 */
export function resolveSelectionCondition<E extends Entity>(
  condition: DataFilter<E> | undefined,
  entityTypes: string[],
  record: Entity | undefined,
  placeholderService: DynamicPlaceholderValueService,
  linkedRecords?: Entity[],
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
    linkedRecords,
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
  /**
   * a record (by its full id) the dropdown has already loaded, `undefined` if it has not:
   * one of the record types it offers, or one that its `selectionCondition` refers to
   */
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
 * The ids of the records that the given record links to in the fields through which placeholders of the condition
 * refer to a field of a linked record (e.g. the parent for `"$current_record.parentAction.locations"`).
 */
export function getPlaceholderLinkedRecordIds(
  condition: DataFilter<Entity> | undefined,
  record: Entity | undefined,
): string[] {
  if (!record) {
    return [];
  }
  const ids = getCurrentRecordReferences(condition)
    .filter(({ linkedFieldId }) => !!linkedFieldId)
    .flatMap(({ fieldId }) => asArray<unknown>(record[fieldId] ?? []));
  return [
    ...new Set(
      ids.filter((id): id is string => !!id && typeof id === "string"),
    ),
  ];
}

/**
 * `selectionCondition: { center: "$current_record.center" }`: the linked records should match the condition;
 * the dropdown of the field only offers such records.
 * A placeholder can also refer to a field of a record that the edited record links to,
 * e.g. `{ _id: { $in: ["$current_record.parentAction.locations"] } }`.
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
  override readonly warning = "always";
  override readonly requiresFieldId = true;

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
      const record = singleRecord
        ? getCurrentRecordOfControl(control, entity)
        : undefined;
      const resolved = resolveSelectionCondition(
        condition,
        entityTypes,
        record,
        this.placeholderService,
        await loadLinkedRecords(
          this.entityMapper,
          getPlaceholderLinkedRecordIds(condition, record),
          source?.getLoaded,
        ),
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
    const records = await loadLinkedRecords(
      this.entityMapper,
      selectedIds.map((id) => Entity.createPrefixedId(entityType, id)),
      source?.getLoaded,
    );
    return records
      .filter((record) => !matches(record))
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
    fieldsOf?: RecordTypeFields,
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
    return getCurrentRecordReferences(value).flatMap((reference) =>
      this.linkedFieldProblems(reference, fieldsOf),
    );
  }

  /** problems of a placeholder referring to a field of a linked record, like `$current_record.parentAction.locations` */
  private linkedFieldProblems(
    { fieldId, linkedFieldId }: CurrentRecordReference,
    fieldsOf: RecordTypeFields | undefined,
  ): string[] {
    if (!linkedFieldId) {
      return [];
    }
    const placeholder = `${CURRENT_RECORD_PLACEHOLDER_PREFIX}${fieldId}.${linkedFieldId}`;
    if (linkedFieldId.includes(".")) {
      return [
        $localize`:config validation:The selection filter ("selectionCondition") refers to "${placeholder}:placeholder:", which goes through more than one linked record. Only fields of a record linked directly can be used, so this condition is ignored.`,
      ];
    }
    const recordFields = fieldsOf?.();
    if (!recordFields) {
      return [];
    }
    const link = recordFields.get(fieldId);
    if (link?.dataType !== EntityDatatype.dataType) {
      return [
        $localize`:config validation:The selection filter ("selectionCondition") refers to "${placeholder}:placeholder:", but "${fieldId}:field:" is not a field linking to records. This condition is ignored.`,
      ];
    }
    const linkedTypes = asArray(link.additional ?? []).map((type) =>
      fieldsOf(type),
    );
    // not checked while one of the linked record types is not known here
    const isMissing =
      linkedFieldId !== "_id" &&
      linkedTypes.length > 0 &&
      linkedTypes.every((fields) => fields && !fields.has(linkedFieldId));
    return isMissing
      ? [
          $localize`:config validation:The selection filter ("selectionCondition") refers to "${placeholder}:placeholder:", but the records linked in "${fieldId}:field:" have no field "${linkedFieldId}:linkedField:". This condition is ignored.`,
        ]
      : [];
  }
}
