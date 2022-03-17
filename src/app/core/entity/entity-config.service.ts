import { Injectable } from "@angular/core";
import {
  Entity,
  ENTITY_CONFIG_PREFIX,
  EntityConstructor,
} from "./model/entity";
import { ConfigService } from "../config/config.service";
import { EntitySchemaField } from "./schema/entity-schema-field";
import { addPropertySchema } from "./database-field.decorator";
import { OperationType } from "../permissions/entity-permissions.service";
import { EntityRegistry } from "./database-entity.decorator";

/**
 * A service that allows to work with configuration-objects
 * related to entities such as assigning dynamic attributes
 * and their schemas to existing entities
 */
@Injectable({
  providedIn: "root",
})
export class EntityConfigService {
  static readonly PREFIX_ENTITY_CONFIG = "entity:";

  constructor(
    private configService: ConfigService,
    private entities: EntityRegistry
  ) {}

  /**
   * Appends the given (dynamic) attributes to the schema of the provided Entity.
   * If no arguments are provided, they will be loaded from the config
   * @param entityType The type to add the attributes to
   * @param configAttributes The attributes to add
   */
  public addConfigAttributes<T extends Entity>(
    entityType: EntityConstructor,
    configAttributes?: EntityConfig
  ) {
    const entityConfig = configAttributes || this.getEntityConfig(entityType);
    if (entityConfig?.attributes) {
      entityConfig.attributes.forEach((attribute) =>
        addPropertySchema(
          entityType.prototype,
          attribute.name,
          attribute.schema
        )
      );
    }
  }

  /**
   * Returns the `EntityConfig` from the config service that contains additional
   * fields for a certain entity
   * @param entityType The type to get the config for
   */
  public getEntityConfig(entityType: EntityConstructor): EntityConfig {
    const configName =
      EntityConfigService.PREFIX_ENTITY_CONFIG + entityType.ENTITY_TYPE;
    return this.configService.getConfig<EntityConfig>(configName);
  }

  /**
   * Assigns additional schema-fields to all entities that are
   * defined inside the config. Entities that are not registered
   * using the {@link DatabaseEntity}-Decorator won't work and will
   * trigger an error message
   */
  setupEntitiesFromConfig() {
    for (const config of this.configService.getAllConfigs<
      EntityConfig & { _id: string }
    >(ENTITY_CONFIG_PREFIX)) {
      const id = config._id.substring(ENTITY_CONFIG_PREFIX.length);
      const ctor = this.entities.get(id);
      this.addConfigAttributes(ctor, config);
    }
  }
}

/**
 * Dynamic configuration for a entity.
 * This allows to change entity metadata based on the configuration.
 */
export interface EntityConfig {
  permissions?: { [key in OperationType]?: string[] };

  /**
   * A list of attributes that will be dynamically added/overwritten to the entity.
   */
  attributes?: {
    /**
     * The name of the attribute (class variable) to be added/overwritten.
     */
    name: string;

    /**
     * The (new) schema configuration for this attribute.
     */
    schema: EntitySchemaField;
  }[];
}
