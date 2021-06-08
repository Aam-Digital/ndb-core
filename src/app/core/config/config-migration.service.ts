import { Injectable } from "@angular/core";
import { ConfigService } from "./config.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";
import { ViewConfig } from "../view/dynamic-routing/view-config.interface";
import { RouterService } from "../view/dynamic-routing/router.service";
import {
  ConfigurableEnumFilterConfig,
  EntityListConfig,
  FilterConfig,
} from "../entity-components/entity-list/EntityListConfig";
import { FormFieldConfig } from "../entity-components/entity-form/entity-form/FormConfig";
import { ENTITY_MAP } from "../entity-components/entity-details/entity-details.component";
import { Entity, EntityConstructor } from "../entity/entity";
import {
  EntityConfig,
  EntityConfigService,
} from "../entity/entity-config.service";

@Injectable({
  providedIn: "root",
})
export class ConfigMigrationService {
  readonly entityListComponents = [
    "ChildrenList",
    "SchoolsList",
    "ActivityList",
    "NotesManager",
  ];

  private config: Config;
  constructor(
    private configService: ConfigService,
    private entityMapper: EntityMapperService
  ) {}

  async migrateConfig(): Promise<void> {
    this.config = await this.configService.loadConfig(this.entityMapper);
    const viewConfigs = this.configService.getAllConfigs<ViewConfig>(
      RouterService.PREFIX_VIEW_CONFIG
    );
    viewConfigs.forEach((viewConfig) => {
      const entity = this.getEntity(viewConfig._id);
      if (this.entityListComponents.includes(viewConfig.component)) {
        this.migrateEntityListConfig(viewConfig.config, entity);
      }
    });
    console.log("config", this.config);
  }

  private getEntity(viewId: string): EntityConstructor<Entity> {
    let entityType = viewId.split(":")[1];
    entityType = entityType[0].toUpperCase() + entityType.slice(1);
    return ENTITY_MAP.get(entityType);
  }

  private migrateEntityListConfig(
    config: EntityListConfig,
    entity: EntityConstructor<Entity>
  ) {
    config.columnGroups = config["columnGroup"];
    delete config["columnGroup"];
    this.migrateColumnConfigs(config.columns as FormFieldConfig[], entity);
    this.migrateFilters(config.filters);
  }

  private migrateColumnConfigs(
    columns: FormFieldConfig[],
    entity: EntityConstructor<Entity>
  ) {
    columns.forEach((column: FormFieldConfig) => {
      try {
        column.view = column["component"];
        delete column["component"];
        column.label = column["title"];
        delete column["title"];
        if (column.hasOwnProperty("config")) {
          column.additional = column["config"];
          delete column["config"];
        }
        if (column.view === "SchoolBlockWrapper") {
          column.view = "DisplayEntity";
          column.additional = "School";
          column.noSorting = true;
        }
        if (column.view === "DisplayUsers") {
          column.view = "DisplayEntityArray";
          column.additional = "User";
          column.noSorting = true;
        }
        this.addLabelToEntity(column.label, column.id, entity, "short");
      } catch (e) {
        console.error(`Failed to migrate column ${column.id}: ${e}`);
      }
    });
  }

  private addLabelToEntity(
    label: string,
    attribute: string,
    entity: EntityConstructor<Entity>,
    type: "short" | "long"
  ) {
    try {
      const schema = entity.schema.get(attribute);
      if (type === "short") {
        schema.labelShort = label;
      } else {
        schema.label = label;
      }
      const schemaKey =
        EntityConfigService.PREFIX_ENTITY_CONFIG + entity.ENTITY_TYPE;
      let configSchema = this.configService.getConfig<EntityConfig>(schemaKey);
      if (!configSchema) {
        // @ts-ignore
        this.configService.config.data[schemaKey] = {};
        configSchema = this.configService.getConfig<EntityConfig>(schemaKey);
      }
      if (!configSchema.attributes) {
        configSchema.attributes = [];
      }
      let existing = configSchema.attributes.find(
        (attr) => attr.name === attribute
      );
      if (!existing) {
        existing = { name: attribute, schema: {} };
        configSchema.attributes.push(existing);
      }
      existing.schema = schema;
    } catch (e) {
      console.error(
        `Failed to set label ${label} to attribute ${attribute} of entity ${entity.ENTITY_TYPE}: ${e}`
      );
    }
  }

  private migrateFilters(filters: FilterConfig[]) {
    filters.forEach((filter) => {
      try {
        if (filter.type === "configurable-enum") {
          const enumFilter = filter as ConfigurableEnumFilterConfig<Entity>;
          delete enumFilter.enumId;
          delete enumFilter.type;
        } else if (filter.id === "school") {
          filter.type = "School";
          filter.id = "schoolId";
        }
      } catch (e) {
        console.error(`Failed to migrate filter ${filter.id}: ${e}`);
      }
    });
  }
}
