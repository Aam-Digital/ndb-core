import { ConfigMigration } from "#src/app/core/config/config-migration";

/**
 * Transform DefaultValueConfigInherited and DefaultValueConfigUpdatedFromReferencingEntity configs
 * to DefaultValueConfigInheritedField.
 */
const migrateInheritedFieldConfig: ConfigMigration = (key, configPart) => {
  if (configPart) {
    return configPart;
  }

  // field / relatedTriggerField -> relatedSourceField
  // automatedMapping -> valueMapping
};
