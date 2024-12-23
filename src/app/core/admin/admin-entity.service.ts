import { EventEmitter, Injectable } from "@angular/core";
import { EntityConstructor } from "../entity/model/entity";
import { Config } from "../config/config";
import { EntityConfig } from "../entity/entity-config";
import { EntityConfigService } from "../entity/entity-config.service";

/**
 * Simply service to centralize updates between various admin components in the form builder.
 */
@Injectable({
  providedIn: "root",
})
export class AdminEntityService {
  public entitySchemaUpdated = new EventEmitter<void>();

  /**
   * Set a new schema field to the given entity and trigger update event for related admin components.
   * @param entityType
   * @param fieldId
   * @param updatedEntitySchema
   */
  updateSchemaField(
    entityType: EntityConstructor,
    fieldId: any,
    updatedEntitySchema: any,
  ) {
    entityType.schema.set(fieldId, updatedEntitySchema);
    this.entitySchemaUpdated.next();
  }

  public setEntityConfig(
    newConfig: Config,
    entityConstructor: EntityConstructor,
    configEntitySettings?: EntityConfig,
  ): void {
    const entityConfigKey =
      EntityConfigService.PREFIX_ENTITY_CONFIG + entityConstructor.ENTITY_TYPE;

    // Initialize config if not present
    newConfig.data[entityConfigKey] =
      newConfig.data[entityConfigKey] ?? ({ attributes: {} } as EntityConfig);
    newConfig.data[entityConfigKey].attributes =
      newConfig.data[entityConfigKey].attributes ?? {};
    const entitySchemaConfig: EntityConfig = newConfig.data[entityConfigKey];

    for (const [fieldId, field] of entityConstructor.schema.entries()) {
      entitySchemaConfig.attributes[fieldId] = field;
    }

    // Add additional general settings if available
    if (configEntitySettings) {
      entitySchemaConfig.label = configEntitySettings.label;
      entitySchemaConfig.labelPlural = configEntitySettings.labelPlural;
      entitySchemaConfig.icon = configEntitySettings.icon;
      entitySchemaConfig.color = configEntitySettings.color;
      entitySchemaConfig.toStringAttributes =
        configEntitySettings.toStringAttributes;
      entitySchemaConfig.hasPII = configEntitySettings.hasPII;
    }
  }
}
