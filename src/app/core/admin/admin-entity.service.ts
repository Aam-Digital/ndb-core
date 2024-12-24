import { EventEmitter, inject, Injectable } from "@angular/core";
import { EntityConstructor } from "../entity/model/entity";
import { Config } from "../config/config";
import { EntityConfig } from "../entity/entity-config";
import { EntityConfigService } from "../entity/entity-config.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { EntityListConfig } from "../entity-list/EntityListConfig";
import { EntityDetailsConfig } from "../entity-details/EntityDetailsConfig";
import { DynamicComponentConfig } from "../config/dynamic-components/dynamic-component-config.interface";

/**
 * Simply service to centralize updates between various admin components in the form builder.
 */
@Injectable({
  providedIn: "root",
})
export class AdminEntityService {
  public entitySchemaUpdated = new EventEmitter<void>();
  private entityMapper = inject(EntityMapperService);

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

  /**
   * Updates the EntityConfig in the database to take any in-memory changes
   * of the EntityConstructor and persist them to the config doc.
   *
   * @param entityConstructor The entity type to be updated in the Config DB
   * @param configEntitySettings (optional) general entity settings to also be applied
   * @param configListView (optional) list view settings also to be applied
   * @param configDetailsView (optional) details view settings also to be applied
   */
  public async setAndSaveEntityConfig(
    entityConstructor: EntityConstructor,
    configEntitySettings?: EntityConfig,
    configListView?: DynamicComponentConfig<EntityListConfig>,
    configDetailsView?: DynamicComponentConfig<EntityDetailsConfig>,
  ): Promise<{ previous: Config; current: Config }> {
    const originalConfig = await this.entityMapper.load(
      Config,
      Config.CONFIG_KEY,
    );
    const newConfig = originalConfig.copy();

    let entitySchemaConfig: EntityConfig =
      this.getEntitySchemaFromConfig(newConfig, entityConstructor) ?? {};
    // Initialize config if not present
    entitySchemaConfig.attributes = entitySchemaConfig.attributes ?? {};

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

    // Add additional view config if available
    if (configListView) {
      newConfig.data[EntityConfigService.getListViewId(entityConstructor)] =
        configListView;
    }
    if (configDetailsView) {
      newConfig.data[EntityConfigService.getDetailsViewId(entityConstructor)] =
        configDetailsView;
    }

    const updatedConfig: Config = await this.entityMapper.save(newConfig);

    return { previous: originalConfig, current: updatedConfig };
  }

  private getEntitySchemaFromConfig(
    config: Config<unknown>,
    entityConstructor: EntityConstructor,
  ): EntityConfig {
    const entityConfigKey =
      EntityConfigService.PREFIX_ENTITY_CONFIG + entityConstructor.ENTITY_TYPE;
    return config.data[entityConfigKey];
  }
}
