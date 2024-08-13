import { Config } from "./config";
import { EntityConfig } from "../entity/entity-config";

export function migrateAddMissingEntityAttributes(config: Config): Config {
  const entities: EntityConfig[] = Object.entries(config.data)
    .filter(([id, value]) => id.startsWith("entity:"))
    .map(([id, value]) => value);

  for (let entityType of ["User"]) {
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
};
