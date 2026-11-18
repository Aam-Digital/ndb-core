import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { asArray } from "#src/app/utils/asArray";

/**
 * Configuration of one list of related records that is added to the data of a
 * {@link TemplateExport}, to make records that link *to* the exported record
 * available for placeholders in the template file.
 *
 * e.g. `{ entityType: "Todo", property: "parentTask" }`
 * adds the tasks whose "parentTask" field links to the exported record,
 * to be used in the template as `{d._related.Todo.parentTask[i].subject}`
 * (see {@link getRelatedRecordsPlaceholder}).
 */
export interface TemplateExportRelatedRecords {
  /**
   * Entity type of the related records to be loaded.
   */
  entityType: string;

  /**
   * ID of the field of the related records (of `entityType`) that links to the exported record,
   * directly or in embedded objects (e.g. the participants of attendance items).
   */
  property: string;

  /**
   * How many levels of a hierarchy to load, if the related records are linked among themselves
   * through the same field (e.g. sub-tasks of sub-tasks).
   *
   * The related records of a related record are added to it in the same way.
   * Defaults to 1 (only records directly linking to the exported record)
   * and is limited to {@link RELATED_RECORDS_MAX_LEVELS}.
   */
  levels?: number;

  /**
   * Whether archived (inactive) records are included as well.
   * Templates can tell them apart by their `inactive` field.
   */
  includeArchived?: boolean;
}

/**
 * The property of an exported record under which the lists of its related records are added,
 * apart from the record's own fields so that they never hide one.
 */
export const RELATED_RECORDS_PROPERTY = "_related";

/**
 * The path of the list in the data of an exported record (`_related.<entityType>.<property>`),
 * i.e. its placeholder in the template is `{d.<path>[i]…}`.
 */
export function getRelatedRecordsPlaceholder(
  config: TemplateExportRelatedRecords,
): string {
  return [RELATED_RECORDS_PROPERTY, config.entityType, config.property].join(
    ".",
  );
}

/**
 * Maximum number of hierarchy levels of related records loaded for a template.
 */
export const RELATED_RECORDS_MAX_LEVELS = 5;

/**
 * Allowed format of the record type and field of a config,
 * so that they work as parts of a placeholder in a template.
 */
const PLACEHOLDER_PART_PATTERN = /^[A-Za-z_]\w*$/;

/**
 * Whether the record type and field of the config can be used in a placeholder of a template.
 */
export function canBeUsedInPlaceholder(
  config: TemplateExportRelatedRecords,
): boolean {
  return [config?.entityType, config?.property].every((part) =>
    PLACEHOLDER_PART_PATTERN.test(part ?? ""),
  );
}

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

  return clampRelatedRecordsLevels(config.levels);
}

/**
 * A number of hierarchy levels within the supported range (1 to {@link RELATED_RECORDS_MAX_LEVELS}).
 */
export function clampRelatedRecordsLevels(value: unknown): number {
  const levels = Math.floor(Number(value));
  if (!Number.isFinite(levels)) {
    return 1;
  }
  return Math.min(Math.max(levels, 1), RELATED_RECORDS_MAX_LEVELS);
}
