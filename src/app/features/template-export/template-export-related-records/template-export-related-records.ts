import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { asArray } from "#src/app/utils/asArray";

/**
 * Configuration of one list of related records that is added to the data of a
 * {@link TemplateExport}, to make records that link *to* the exported record
 * available for placeholders in the template file.
 *
 * e.g. `{ key: "subTasks", entityType: "Task", property: "parentTask" }`
 * adds the tasks whose "parentTask" field links to the exported record,
 * to be used in the template as `{d.subTasks[i].subject}`.
 */
export interface TemplateExportRelatedRecords {
  /**
   * Name under which the list is added to the exported record,
   * i.e. the placeholder to use in the template (`{d.<key>[i]...}`).
   */
  key: string;

  /**
   * Entity type of the related records to be loaded.
   */
  entityType: string;

  /**
   * ID of the field of the related records (of `entityType`) that links to the exported record.
   */
  property: string;

  /**
   * How many levels of a hierarchy to load, if the related records are linked among themselves
   * through the same field (e.g. sub-tasks of sub-tasks).
   *
   * The related records of a related record are added to it under the same `key`.
   * Defaults to 1 (only records directly linking to the exported record)
   * and is limited to {@link RELATED_RECORDS_MAX_LEVELS}.
   */
  levels?: number;
}

/**
 * Maximum number of hierarchy levels of related records loaded for a template.
 */
export const RELATED_RECORDS_MAX_LEVELS = 5;

/**
 * Allowed format of {@link TemplateExportRelatedRecords.key},
 * so that it works as part of a placeholder in a template.
 */
export const RELATED_RECORDS_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

/**
 * Whether the field is a plain entity-reference field (`dataType: "entity"`)
 * through which records of (any of) the given types can be linked.
 *
 * References nested inside embedded objects are not supported for related records.
 */
export function isFieldLinkingToType(
  field: EntitySchemaField | undefined,
  ...entityTypes: string[]
): boolean {
  return (
    field?.dataType === "entity" &&
    asArray(field.additional).some((type) => entityTypes.includes(type))
  );
}

/**
 * The number of hierarchy levels to load for the given config:
 * more than one level is only possible if the related records link among themselves through the configured field.
 */
export function getRelatedRecordsLevels(
  config: TemplateExportRelatedRecords,
  relatedType: EntityConstructor,
): number {
  const field = relatedType.schema.get(config.property);
  if (!isFieldLinkingToType(field, relatedType.ENTITY_TYPE)) {
    return 1;
  }

  const levels = Math.floor(Number(config.levels));
  if (!Number.isFinite(levels)) {
    return 1;
  }
  return Math.min(Math.max(levels, 1), RELATED_RECORDS_MAX_LEVELS);
}
