import { ColumnMapping } from "./column-mapping";
import { EntityConstructor } from "../entity/model/entity";
import { DefaultValueConfigInheritedField } from "../../features/inherited-field/inherited-field-config";
import { FormFieldConfig } from "../common-components/entity-form/FormConfig";
import { getConfigsForInheritedMode } from "../../features/inherited-field/inherited-value.service";

/**
 * Shared helper for import warnings related to inherited fields.
 *
 * It centralizes detection of source-reference fields used by inherited-field
 * defaults so mapping dialogs and import summary can show consistent hints
 * without duplicating schema-scanning logic.
 */

function getInheritanceSourceReferenceFields(
  entityCtor?: EntityConstructor,
): Set<string> {
  if (!entityCtor?.schema) {
    return new Set<string>();
  }

  const fieldConfigs: FormFieldConfig[] = [...entityCtor.schema.entries()].map(
    ([id, field]) => ({ id, ...field }),
  );

  const inheritedConfigs = getConfigsForInheritedMode(fieldConfigs);

  return new Set(
    [...inheritedConfigs.values()]
      .filter((config) => !config?.sourceReferenceEntity)
      .map(
        (config) =>
          (config as DefaultValueConfigInheritedField)?.sourceReferenceField,
      )
      .filter((fieldId): fieldId is string => !!fieldId),
  );
}

export function isInheritanceSourceReferenceField(
  entityCtor: EntityConstructor,
  propertyName?: string,
): boolean {
  if (!propertyName) {
    return false;
  }

  const sourceReferenceFields = getInheritanceSourceReferenceFields(entityCtor);
  return sourceReferenceFields.has(propertyName);
}

export function hasMappedInheritedSourceField(
  entityCtor: EntityConstructor,
  columnMappings: ColumnMapping[],
): boolean {
  if (!columnMappings?.length) {
    return false;
  }

  const sourceReferenceFields = getInheritanceSourceReferenceFields(entityCtor);

  return columnMappings
    .map(({ propertyName }) => propertyName)
    .some(
      (propertyName) =>
        !!propertyName && sourceReferenceFields.has(propertyName),
    );
}
