import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "./model/entity";
import { ConfigService } from "../config/config.service";
import { EntityRegistry } from "./database-entity.decorator";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { EntityConfig } from "./entity-config";
import { addPropertySchema } from "./database-field.decorator";

/**
 * A service that allows to work with configuration-objects
 * related to entities such as assigning dynamic attributes
 * and their schemas to existing entities
 */
@Injectable({
  providedIn: "root",
})
export class EntityConfigService {
  /** @deprecated will become private, use the service to access the data */
  static readonly PREFIX_ENTITY_CONFIG = "entity:";

  // TODO: merge with EntityRegistry?

  constructor(
    private configService: ConfigService,
    private entities: EntityRegistry,
  ) {}

  /**
   * Assigns additional schema-fields to all entities that are
   * defined inside the config. Entities that are not registered
   * using the {@link DatabaseEntity}-Decorator won't work and will
   * trigger an error message
   */
  setupEntitiesFromConfig() {
    for (const config of this.configService.getAllConfigs<
      EntityConfig & { _id: string }
    >(EntityConfigService.PREFIX_ENTITY_CONFIG)) {
      const id = config._id.substring(
        EntityConfigService.PREFIX_ENTITY_CONFIG.length,
      );
      if (!this.entities.has(id)) {
        this.createNewEntity(id, config.extends);
      }
      const ctor = this.entities.get(id);
      this.addConfigAttributes(ctor, config);
    }
  }

  private createNewEntity(id: string, parent: string) {
    const parentClass = this.entities.has(parent)
      ? this.entities.get(parent)
      : Entity;

    class DynamicClass extends parentClass {
      static schema = new Map(parentClass.schema.entries());
      static ENTITY_TYPE = id;
    }

    this.entities.set(id, DynamicClass);
  }

  /**
   * Appends the given (dynamic) attributes to the schema of the provided Entity.
   * If no arguments are provided, they will be loaded from the config
   * @param entityType The type to add the attributes to
   * @param configAttributes The attributes to add
   */
  public addConfigAttributes<T extends Entity>(
    entityType: EntityConstructor,
    configAttributes?: EntityConfig,
  ) {
    const entityConfig = configAttributes || this.getEntityConfig(entityType);
    for (const [key, value] of Object.entries(entityConfig?.attributes ?? {})) {
      addPropertySchema(entityType.prototype, { id: key, ...value });
    }

    // TODO: shall we just assign all properties that are present in the config object?
    entityType.toStringAttributes =
      entityConfig.toStringAttributes ?? entityType.toStringAttributes;
    entityType.label = entityConfig.label ?? entityType.label;
    entityType.labelPlural = entityConfig.labelPlural ?? entityType.labelPlural;
    entityType.icon = (entityConfig.icon as IconName) ?? entityType.icon;
    entityType.color = entityConfig.color ?? entityType.color;
    entityType.route = entityConfig.route ?? entityType.route;
    entityType.hasPII = entityConfig.hasPII ?? entityType.hasPII;

    entityType._isCustomizedType = true;
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
}
