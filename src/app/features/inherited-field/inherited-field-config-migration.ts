import { ConfigMigration } from "#src/app/core/config/config-migration";
import { DefaultValueConfigInheritedField } from "./inherited-field-config";

/**
 * Transform DefaultValueConfigInherited and DefaultValueConfigUpdatedFromReferencingEntity configs
 * to DefaultValueConfigInheritedField.
 */
export const migrateInheritedFieldConfig: ConfigMigration = (
  key,
  configPart,
) => {
  if (key !== "defaultValue" || !configPart?.config) {
    return configPart;
  }

  const config = configPart.config;

  if (configPart.mode === "inherited-from-referenced-entity") {
    const newConfig: DefaultValueConfigInheritedField = {
      sourceReferenceField: config.localAttribute,
      sourceValueField: config.field,
    };

    return {
      ...configPart,
      mode: "inherited-field",
      config: newConfig,
    };
  }

  if (configPart.mode === "updated-from-referencing-entity") {
    const newConfig: DefaultValueConfigInheritedField = {
      sourceReferenceEntity: config.relatedEntityType,
      sourceReferenceField: config.relatedReferenceField,
      sourceValueField: config.relatedTriggerField,
      valueMapping: config.automatedMapping,
    };

    return {
      ...configPart,
      mode: "inherited-field",
      config: newConfig,
    };
  }

  return configPart;
};
