import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "./model/entity";
import { ConfigService } from "../config/config.service";
import { EntitySchemaField } from "./schema/entity-schema-field";
import { addPropertySchema } from "./database-field.decorator";
import { EntityRegistry } from "./database-entity.decorator";
import { IconName } from "@fortawesome/fontawesome-svg-core";

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
    if (entityConfig?.attributes) {
      entityConfig.attributes.forEach((attribute) =>
        addPropertySchema(
          entityType.prototype,
          attribute.name,
          attribute.schema,
        ),
      );
    }
    entityType.toStringAttributes =
      entityConfig.toStringAttributes ?? entityType.toStringAttributes;
    entityType.label = entityConfig.label ?? entityType.label;
    entityType.labelPlural = entityConfig.labelPlural ?? entityType.labelPlural;
    entityType.icon = (entityConfig.icon as IconName) ?? entityType.icon;
    entityType.color = entityConfig.color ?? entityType.color;
    entityType.route = entityConfig.route ?? entityType.route;

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

/**
 * Dynamic configuration for a entity.
 * This allows to change entity metadata based on the configuration.
 */
export interface EntityConfig {
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

  /**
   * A list of attributes which should be shown when calling the `.toString()` method of this entity.
   * E.g. showing the first and last name of a child.
   *
   * (optional) the default is the ID of the entity (`.entityId`)
   */
  toStringAttributes?: string[];

  /**
   * human-readable name/label of the entity in the UI
   */
  label?: string;

  /**
   * human-readable name/label of the entity in the UI when referring to multiple
   */
  labelPlural?: string;

  /**
   * icon used to visualize the entity type
   */
  icon?: string;

  /**
   * color used for to highlight this entity type across the app
   */
  color?: string;

  /**
   * base route of views for this entity type
   */
  route?: string;

  /**
   * when a new entity is created, all properties from this class will also be available
   */
  extends?: string;
}
