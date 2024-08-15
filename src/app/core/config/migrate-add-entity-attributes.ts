import { Config } from "./config";
import { EntityConfig } from "../entity/entity-config";

export function migrateAddMissingEntityAttributes(config: Config): Config {
  const entities: EntityConfig[] = Object.entries(config.data)
    .filter(([id, value]) => id.startsWith("entity:"))
    .map(([id, value]) => value);

  for (let entityType of Object.keys(DEFAULT_ENTITIES)) {
    // TODO: just blindly save all hard-coded fields into the entity config? or scan which ones are actually used?!
    if (!JSON.stringify(config).includes(`"${entityType}"`)) {
      // don't add config if the entity is never explicitly used or referenced
      continue;
    }
    applyDefaultFieldsForEntityConfig(config, entityType);
  }

  return config;
}

function applyDefaultFieldsForEntityConfig(config: Config, entityType: string) {
  if (!config.data["entity:" + entityType]) {
    config.data["entity:" + entityType] = {};
  }
  const entityConfig: EntityConfig = config.data["entity:" + entityType];

  const hardCodedConfig = DEFAULT_ENTITIES[entityType];

  entityConfig.label = entityConfig.label ?? hardCodedConfig.label;
  entityConfig.labelPlural =
    entityConfig.labelPlural ?? hardCodedConfig.labelPlural;
  entityConfig.icon = entityConfig.icon ?? hardCodedConfig.icon;
  entityConfig.toStringAttributes =
    entityConfig.toStringAttributes ?? hardCodedConfig.toStringAttributes;
  entityConfig.hasPII = entityConfig.hasPII ?? hardCodedConfig.hasPII;

  entityConfig.attributes = Object.assign(
    {},
    hardCodedConfig.attributes,
    entityConfig.attributes,
  );
}

const DEFAULT_ENTITIES = {
  User: {
    toStringAttributes: ["name"],
    icon: "user",
    label: "User",
    labelPlural: "Users",
    hasPII: true,
    attributes: {
      name: {
        dataType: "string",
        label: "Username",
        validators: {
          required: true,
          uniqueId: "User",
        },
      },
      phone: {
        dataType: "string",
        label: "Contact",
      },
    },
  },
  EducationalMaterial: {
    attributes: {
      child: {
        dataType: "entity",
        additional: "Child",
        entityReferenceRole: "composite",
      },
      date: {
        dataType: "date",
        label: "Date",
        defaultValue: {
          mode: "dynamic",
          value: "$now",
        },
      },
      materialType: {
        label: "Material",
        dataType: "configurable-enum",
        additional: "materials",
        validators: {
          required: true,
        },
      },
      materialAmount: {
        dataType: "number",
        label: "Amount",
        defaultValue: {
          mode: "static",
          value: 1,
        },
        validators: {
          required: true,
        },
      },
      description: {
        dataType: "string",
        label: "Description",
      },
    },
  },
  Todo: {
    toStringAttributes: ["subject"],
    icon: "check",
    label: "Task",
    labelPlural: "Tasks",
    hasPII: true,
    attributes: {
      subject: {
        dataType: "string",
        label: "Subject",
        showInDetailsView: true,
      },
      description: {
        dataType: "long-text",
        showInDetailsView: true,
        label: "Description",
      },
      deadline: {
        dataType: "date-only",
        showInDetailsView: true,
        anonymize: "retain",
        label: "Deadline",
      },
      startDate: {
        dataType: "date-only",
        description:
          "When you are planning to start work so that you keep enough time before the actual hard deadline.",
        showInDetailsView: true,
        anonymize: "retain",
        label: "Start Date",
      },
      assignedTo: {
        label: "Assigned to",
        dataType: "entity",
        isArray: true,
        additional: "User",
        showInDetailsView: true,
        defaultValue: {
          mode: "dynamic",
          value: "$current_user",
        },
        anonymize: "retain",
      },
      relatedEntities: {
        dataType: "entity",
        isArray: true,
        label: "Related Records",
        additional: ["Child", "School", "RecurringActivity"],
        entityReferenceRole: "composite",
        showInDetailsView: true,
        anonymize: "retain",
      },
      repetitionInterval: {
        label: "repeats",
        additional: [
          {
            label: "every week",
            interval: { amount: 1, unit: "week" },
          },
          {
            label: "every month",
            interval: { amount: 1, unit: "month" },
          },
        ],
        showInDetailsView: true,
        anonymize: "retain",
      },
      completed: {
        label: "completed",
        viewComponent: "DisplayTodoCompletion",
        anonymize: "retain",
      },
    },
  },
  School: {
    toStringAttributes: ["name"],
    icon: "university",
    label: "School",
    labelPlural: "Schools",
    color: "#9E9D24",
    attributes: {
      name: {
        dataType: "string",
        label: "Name",
        validators: {
          required: true,
        },
      },
    },
  },
};
