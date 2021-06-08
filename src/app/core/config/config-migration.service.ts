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
import { EntityDetailsConfig } from "../entity-components/entity-details/EntityDetailsConfig";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";

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
      if (viewConfig.component === "EntityDetails") {
        this.migrateEntityDetailsConfig(viewConfig.config, entity);
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

  private migrateEntityDetailsConfig(
    config: EntityDetailsConfig,
    entity: EntityConstructor<Entity>
  ) {
    config.panels.forEach((panel) => {
      panel.components.forEach((panelComp) => {
        switch (panelComp.component) {
          case "Form": {
            this.migrateFormComponent(panelComp.config["cols"], entity);
            break;
          }
          case "PreviousSchools": {
            this.migratePreviousSchoolsComponent(panelComp.config["columns"]);
          }
        }
      });
    });
  }

  private migrateFormComponent(
    columns: FormFieldConfig[][],
    entity: EntityConstructor<Entity>
  ) {
    const editMap = new Map<string, string>([
      ["text", "EditText"],
      ["checkbox", "EditBoolean"],
      ["textarea", "EditLongText"],
      ["photo", "EditPhoto"],
      ["configurable-enum-select", "EditConfigurableEnum"],
      ["age", "EditAge"],
      ["datepicker", "EditDate"],
      ["entity-select", "EditEntityArray"],
      ["select", "EditSelectable"],
    ]);
    columns.forEach((row) =>
      row.forEach((formField) => {
        try {
          formField.label = formField.label || formField["placeholder"];
          delete formField["placeholder"];
          formField.additional =
            formField["options"] ||
            formField["enumId"] ||
            formField["entityType"];
          if (formField.additional === undefined) {
            delete formField.additional;
          }
          delete formField["options"];
          delete formField["enumId"];
          delete formField["entityType"];
          if (formField.id === "photoFile") {
            formField.id = "photo";
          }
          formField.edit = editMap.get(formField["input"]);
          delete formField["input"];
          this.addLabelToEntity(formField.label, formField.id, entity, "short");
        } catch (e) {
          console.error(`Failed to convert form field ${formField.id}: ${e}`);
        }
      })
    );
  }

  private migratePreviousSchoolsComponent(columns: FormFieldConfig[]) {
    if (columns) {
      columns.forEach((formField) => {
        try {
          switch (formField["input"]) {
            case "school": {
              formField.view = "DisplayEntity";
              formField.edit = "EditSingleEntity";
              formField.additional = "School";
              break;
            }
            case "text": {
              formField.view = "DisplayText";
              formField.edit = "EditText";
              break;
            }
            case "date": {
              formField.view = "DisplayDate";
              formField.edit = "EditDate";
              break;
            }
            case "percentageResult": {
              formField.view = "DisplayPercentage";
              formField.edit = "EditPercentage";
            }
          }
          delete formField["input"];
          this.addLabelToEntity(
            formField.label,
            formField.id,
            ChildSchoolRelation,
            "long"
          );
        } catch (e) {
          console.error(
            `Filed to migrate previousSchoolsConfig for ${formField.id}: ${e}`
          );
        }
      });
    }
  }
}
