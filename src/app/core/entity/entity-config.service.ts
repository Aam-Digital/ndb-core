import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "./model/entity";
import { ConfigService } from "../config/config.service";
import { EntityRegistry } from "./database-entity.decorator";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { EntityConfig } from "./entity-config";
import { addPropertySchema } from "./database-field.decorator";
import {
  PREFIX_VIEW_CONFIG,
  ViewConfig,
} from "../config/dynamic-routing/view-config.interface";
import { EntitySchemaField } from "./schema/entity-schema-field";
import { EntitySchema } from "./schema/entity-schema";
import { EntityDetailsConfig } from "../entity-details/EntityDetailsConfig";
import { EntityListConfig } from "../entity-list/EntityListConfig";

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

  /** original initial entity schemas without overrides from config */
  private coreEntitySchemas = new Map<string, EntitySchema>();

  static getDetailsViewId(entityConfig: EntityConfig) {
    return this.getListViewId(entityConfig) + "/:id";
  }
  static getListViewId(entityConfig: EntityConfig) {
    return PREFIX_VIEW_CONFIG + entityConfig.route.replace(/^\//, "");
  }

  // TODO: merge with EntityRegistry?

  constructor(
    private configService: ConfigService,
    private entities: EntityRegistry,
  ) {
    this.storeCoreEntitySchemas();
  }

  private storeCoreEntitySchemas() {
    this.entities.forEach((ctr, key) => {
      this.coreEntitySchemas.set(key, this.deepCopySchema(ctr.schema));
    });
  }

  private deepCopySchema(schema: EntitySchema): EntitySchema {
    return new Map<string, EntitySchemaField>(
      JSON.parse(JSON.stringify(Array.from(schema))),
    );
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
    >(EntityConfigService.PREFIX_ENTITY_CONFIG)) {
      const id = config._id.substring(
        EntityConfigService.PREFIX_ENTITY_CONFIG.length,
      );
      if (!this.entities.has(id)) {
        this.createNewEntity(id, config.extends);
      }
      const ctor = this.entities.get(id);
      this.setCoreSchemaAttributes(ctor, config.extends);
      this.addConfigAttributes(ctor, config);
    }
  }

  private createNewEntity(id: string, parent: string) {
    const parentClass = this.entities.has(parent)
      ? this.entities.get(parent)
      : Entity;

    const schema = this.deepCopySchema(parentClass.schema);
    class DynamicClass extends parentClass {
      static schema = schema;
      static ENTITY_TYPE = id;
    }

    this.entities.set(id, DynamicClass);
  }

  /**
   * Set field definitons from the core schema to ensure undoing customized attributes is correctly applied.
   * @param entityType
   * @param parent
   */
  private setCoreSchemaAttributes(
    entityType: EntityConstructor,
    parent: string,
  ) {
    const coreEntityId = parent ?? entityType.ENTITY_TYPE;
    const coreSchema =
      this.coreEntitySchemas.get(coreEntityId) ?? Entity.schema;

    for (const [key, value] of coreSchema.entries()) {
      addPropertySchema(
        entityType.prototype,
        key,
        JSON.parse(JSON.stringify(value)),
      );
    }
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
      value._isCustomizedField = true;
      addPropertySchema(entityType.prototype, key, value);
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

  getDetailsViewConfig(
    entityType: EntityConstructor,
  ): ViewConfig<EntityDetailsConfig> {
    return this.configService.getConfig<ViewConfig<EntityDetailsConfig>>(
      EntityConfigService.getDetailsViewId(entityType),
    );
  }
  getListViewConfig(
    entityType: EntityConstructor,
  ): ViewConfig<EntityListConfig> {
    return this.configService.getConfig<ViewConfig<EntityListConfig>>(
      EntityConfigService.getListViewId(entityType),
    );
  }
}
