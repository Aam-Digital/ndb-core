import { Injectable } from "@angular/core";
import { ConfigService } from "./config.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";
import { ViewConfig } from "../view/dynamic-routing/view-config.interface";
import {
  ConfigurableEnumFilterConfig,
  EntityListConfig,
  FilterConfig,
} from "../entity-components/entity-list/EntityListConfig";
import { FormFieldConfig } from "../entity-components/entity-form/entity-form/FormConfig";
import { ENTITY_MAP } from "../entity-components/entity-details/entity-details.component";
import { Entity, EntityConstructor } from "../entity/model/entity";
import {
  EntityConfig,
  EntityConfigService,
} from "../entity/entity-config.service";
import {
  EntityDetailsConfig,
  PanelComponent,
} from "../entity-components/entity-details/EntityDetailsConfig";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { HistoricalEntityData } from "../../features/historical-data/historical-entity-data";
import { RecurringActivity } from "../../child-dev-project/attendance/model/recurring-activity";
import { HealthCheck } from "../../child-dev-project/health-checkup/model/health-check";
import { readingLevels } from "../../child-dev-project/aser/model/readingLevels";
import { mathLevels } from "../../child-dev-project/aser/model/mathLevels";
import { genders } from "../../child-dev-project/children/model/genders";
import { materials } from "../../child-dev-project/educational-material/model/materials";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumValue,
} from "../configurable-enum/configurable-enum.interface";
import { warningLevels } from "../../child-dev-project/warning-levels";
import { User } from "../user/user";

@Injectable({
  providedIn: "root",
})
export class ConfigMigrationService {
  private config: Config;
  constructor(
    private configService: ConfigService,
    private entityMapper: EntityMapperService
  ) {}

  async migrateConfig(): Promise<Config> {
    this.config = await this.configService.loadConfig(this.entityMapper);
    this.addNewConfigurableEnums();
    this.migrateViewConfigs();
    console.log("config", this.config);
    return this.configService.saveConfig(this.entityMapper, this.config.data);
  }

  private addNewConfigurableEnums() {
    this.config.data[CONFIGURABLE_ENUM_CONFIG_PREFIX + "reading-levels"] =
      readingLevels;
    this.config.data[CONFIGURABLE_ENUM_CONFIG_PREFIX + "math-levels"] =
      mathLevels;
    this.config.data[CONFIGURABLE_ENUM_CONFIG_PREFIX + "genders"] = genders;
    this.config.data[CONFIGURABLE_ENUM_CONFIG_PREFIX + "materials"] = materials;
    this.config.data[CONFIGURABLE_ENUM_CONFIG_PREFIX + "warning-levels"] =
      warningLevels;
  }

  private migrateViewConfigs() {
    const entityListComponents = [
      "ChildrenList",
      "SchoolsList",
      "ActivityList",
      "NotesManager",
    ];
    const viewConfigs = this.configService.getAllConfigs<ViewConfig>("view:");
    viewConfigs.forEach((viewConfig) => {
      const entity = this.getEntity(viewConfig._id);
      if (entityListComponents.includes(viewConfig.component)) {
        this.migrateEntityListConfig(viewConfig.config, entity);
      }
      if (viewConfig.component === "EntityDetails") {
        this.migrateEntityDetailsConfig(viewConfig.config, entity);
      }
    });
  }

  private getEntity(viewId: string): EntityConstructor<Entity> {
    const entityType = viewId
      .split(":")[1]
      .replace("/", "")
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");
    return ENTITY_MAP.get(entityType);
  }

  private migrateEntityListConfig(
    config: EntityListConfig,
    entity: EntityConstructor<Entity>
  ) {
    if (config.hasOwnProperty("columnGroup")) {
      config.columnGroups = config["columnGroup"];
      delete config["columnGroup"];
    }
    this.migrateColumnConfigs(config.columns as FormFieldConfig[], entity);
    if (config.hasOwnProperty("filters")) {
      this.migrateFilters(config.filters);
    }
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
        if (column.view === "ChildBlockList") {
          column.view = "DisplayEntityArray";
          column.additional = "Child";
          column.noSorting = true;
        }
        this.addLabelToEntity(column.label, column.id, entity, "short", column);
      } catch (e) {
        console.warn(`Failed to migrate column ${column.id}: ${e}`);
      }
    });
  }

  private addLabelToEntity(
    label: string,
    attribute: string,
    entity: EntityConstructor<Entity>,
    type: "short" | "long",
    formField?: FormFieldConfig
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
        this.config.data[schemaKey] = {};
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
      if (formField) {
        delete formField.label;
        if (formField.view === "DisplayText") {
          delete formField.view;
        }
      }
    } catch (e) {
      console.warn(
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
        } else if (filter.id === "assignedTo") {
          filter.type = "User";
          filter.label = "Assigned user(s)";
          filter.display = "dropdown";
        }
        if (filter.default === "") {
          delete filter.default;
        }
      } catch (e) {
        console.warn(`Failed to migrate filter ${filter.id}: ${e}`);
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
            if (panelComp.hasOwnProperty("config")) {
              this.migratePreviousSchoolsComponent(panelComp.config["columns"]);
            }
            break;
          }
          case "PreviousTeams": {
            this.migratePreviousTeams(panelComp);
            break;
          }
          case "HistoricalDataComponent": {
            this.migrateHistoricalDataComponent(panelComp.config as any);
            break;
          }
          case "ActivityParticipantsSection": {
            this.migrateActivityParticipantsSection(panelComp);
            break;
          }
          case "Aser":
          case "EducationalMaterial":
          case "HealthCheckup":
          case "NotesOfChild":
          case "ChildrenOverview": {
            if (panelComp.hasOwnProperty("config")) {
              this.migrateTable(panelComp.config);
            }
            break;
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
          if (formField["input"] === "select") {
            this.migrateSelectFormField(formField, entity);
          } else if (formField.id === "assignedTo") {
            const schema = entity.schema.get("assignedTo");
            formField.label = "Assigned user(s)";
            schema.dataType = "array";
            schema.innerDataType = "string";
            schema.viewComponent = "DisplayEntityArray";
            schema.editComponent = "EditEntityArray";
            schema.additional = User.ENTITY_TYPE;
          } else {
            formField.edit = editMap.get(formField["input"]);
          }
          delete formField["input"];
          this.addLabelToEntity(
            formField.label,
            formField.id,
            entity,
            "long",
            formField
          );
        } catch (e) {
          console.warn(`Failed to migrate form field ${formField.id}: ${e}`);
        }
      })
    );
  }

  private migrateSelectFormField(
    formField: FormFieldConfig,
    entity: EntityConstructor<Entity>
  ) {
    const selectableMap = new Map<string, string>([
      ["warningLevel", "warning-levels"],
      ["materialType", "materials"],
      ["gender", "genders"],
      ["hindi", "reading-levels"],
      ["bengali", "reading-levels"],
      ["english", "reading-levels"],
      ["math", "math-levels"],
    ]);
    if (!selectableMap.has(formField.id)) {
      const newEnum: ConfigurableEnumValue[] = [{ id: "", label: "" }].concat(
        ...formField["additional"].map((option: string) => {
          return {
            label: option,
            id: option,
          };
        })
      );
      this.config.data[CONFIGURABLE_ENUM_CONFIG_PREFIX + formField.id] =
        newEnum;
      console.warn(
        `Automatically created enum "${formField.id}" with values:`,
        newEnum
      );
      selectableMap.set(formField.id, formField.id);
    }
    const propertySchema = entity.schema.get(formField.id);
    propertySchema.dataType = "configurable-enum";
    propertySchema.innerDataType = selectableMap.get(formField.id);
    delete formField["additional"];
  }

  private migratePreviousSchoolsComponent(columns: FormFieldConfig[]) {
    if (columns) {
      columns.forEach((formField) => {
        try {
          this.migrateEntitySubrecordInput(formField, "input");
          this.addLabelToEntity(
            formField.label,
            formField.id,
            ChildSchoolRelation,
            "short",
            formField
          );
        } catch (e) {
          console.warn(
            `Filed to migrate previousSchoolsConfig for ${formField.id}: ${e}`
          );
        }
      });
    }
  }

  private migratePreviousTeams(config: PanelComponent) {
    config.component = "PreviousSchools";
    config.config = {
      single: false,
      columns: [
        {
          id: "schoolId",
          label: "Team",
          view: "DisplayEntity",
          edit: "EditSingleEntity",
          additional: "Team",
        },
        {
          id: "start",
          label: "From",
          view: "DisplayDate",
          edit: "EditDate",
        },
        {
          id: "end",
          label: "To",
          view: "DisplayDate",
          edit: "EditDate",
        },
      ],
    } as any;
    this.addLabelToEntity("Team", "schoolId", ChildSchoolRelation, "short");
    this.addLabelToEntity("From", "start", ChildSchoolRelation, "short");
    this.addLabelToEntity("To", "end", ChildSchoolRelation, "short");
  }

  private migrateEntitySubrecordInput(
    formField: FormFieldConfig,
    inputKey: string
  ) {
    switch (formField[inputKey]) {
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
        break;
      }
      case "configurable_enum": {
        formField.view = "DisplayConfigurableEnum";
        formField.edit = "EditConfigurableEnum";
        break;
      }
      default: {
        console.warn(
          `No migration defined for inputType ${formField[inputKey]} at property ${formField.id}`
        );
      }
    }
    delete formField[inputKey];
  }

  private migrateHistoricalDataComponent(columns: FormFieldConfig[]) {
    columns.forEach((formField) => {
      try {
        formField.id = formField["name"];
        delete formField["name"];
        if (formField.hasOwnProperty("enumId")) {
          formField.additional = formField["enumId"];
          delete formField["enumId"];
        }
        this.migrateEntitySubrecordInput(formField, "inputType");
        this.addLabelToEntity(
          formField.label,
          formField.id,
          HistoricalEntityData,
          "short",
          formField
        );
      } catch (e) {
        console.warn(
          `Failed to migrate HistoricalDataComponent ${formField.id}: ${e}`
        );
      }
    });
  }

  private migrateActivityParticipantsSection(config: PanelComponent) {
    config.component = "Form";
    config.config = {
      cols: [
        [
          {
            id: "linkedGroups",
            label: "Groups",
            edit: "EditEntityArray",
            additional: "School",
          },
          {
            id: "participants",
            label: "Participants",
            edit: "EditEntityArray",
            additional: "Child",
          },
        ],
      ],
    } as any;
    this.addLabelToEntity("Groups", "linkedGroups", RecurringActivity, "short");
    this.addLabelToEntity(
      "Participants",
      "participants",
      RecurringActivity,
      "short"
    );
  }

  private migrateTable(config: any) {
    const columnConfigs = [
      { id: "date", visibleFrom: "xs" },
      { id: "materialType", visibleFrom: "xs" },
      { id: "materialAmount", visibleFrom: "md" },
      { id: "description", visibleFrom: "md" },
      { id: "math", visibleFrom: "xs" },
      { id: "english", visibleFrom: "xs" },
      { id: "hindi", visibleFrom: "md" },
      { id: "bengali", visibleFrom: "md" },
      { id: "remarks", visibleFrom: "md" },
      { id: "schoolClass", label: "Class", view: "DisplayText" },
      { id: "age", label: "Age", view: "DisplayText" },
      {
        id: "bmi",
        label: "BMI",
        view: "ReadonlyFunction",
        additional: (entity: HealthCheck) => entity.bmi.toFixed(2),
      },
    ];
    config.columns = config.displayedColumns.map((col: string) => {
      return columnConfigs.find((cc) => cc.id === col) || col;
    });
    delete config.displayedColumns;
  }
}
