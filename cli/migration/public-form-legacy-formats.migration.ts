import type {
  MigrationDefinition,
  MigrationResult,
} from "./migration-definition.js";

/** Values of `PLACEHOLDERS` (entity-schema-field.ts), formerly stored as a plain `defaultValue` string. */
const DYNAMIC_PLACEHOLDERS = ["$now", "$current_user"];

/**
 * Convert the legacy field formats that the removed config migrations converted
 * in PublicFormConfig docs at runtime (`latest-config-formats` only covered the main config):
 * - `defaultValue` as plain value, with config properties at the top level,
 *   or with the "inherited" / "inherited-from-referenced-entity" / "updated-from-referencing-entity" modes
 * - legacy `dataType`s ("entity-array", "array" with `innerDataType`, `EditPhoto` files, `DisplayPercentage` numbers)
 */
export function migratePublicFormLegacyFormats<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc), (key, value) => {
    if (key === "defaultValue") {
      return migrateDefaultValue(value);
    }
    if (value === "DisplayEntityArray") {
      return "DisplayEntity";
    }
    if (value && typeof value === "object" && "dataType" in value) {
      migrateDataType(value);
    }
    return value;
  });
}

function migrateDefaultValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value !== "object") {
    value = {
      mode: DYNAMIC_PLACEHOLDERS.includes(value) ? "dynamic" : "static",
      value,
    };
  }

  if (value.mode === "inherited") {
    value.mode = "inherited-from-referenced-entity";
  }
  if (!value.config) {
    value.config = {};
    for (const property of ["value", "localAttribute", "field"]) {
      if (value[property] !== undefined) {
        value.config[property] = value[property];
        delete value[property];
      }
    }
  }

  const config = value.config;
  if (value.mode === "inherited-from-referenced-entity") {
    return {
      ...value,
      mode: "inherited-field",
      config: {
        sourceReferenceField: config.localAttribute,
        sourceValueField: config.field,
      },
    };
  }
  if (value.mode === "updated-from-referencing-entity") {
    return {
      ...value,
      mode: "inherited-field",
      config: {
        sourceReferenceEntity: config.relatedEntityType,
        sourceReferenceField: config.relatedReferenceField,
        sourceValueField: config.relatedTriggerField,
        valueMapping: config.automatedMapping,
      },
    };
  }
  return value;
}

function migrateDataType(field: any): void {
  if (field.dataType === "entity-array") {
    field.dataType = "entity";
    field.isArray = true;
  }
  if (field.dataType === "array") {
    field.dataType = field.innerDataType;
    delete field.innerDataType;
    field.isArray = true;
  }
  if (field.dataType === "configurable-enum" && field.innerDataType) {
    field.additional = field.innerDataType;
    delete field.innerDataType;
  }
  if (field.dataType === "file" && field.editComponent === "EditPhoto") {
    field.dataType = "photo";
    delete field.editComponent;
  }
  if (
    field.dataType === "number" &&
    field.viewComponent === "DisplayPercentage"
  ) {
    field.dataType = "percentage";
    delete field.viewComponent;
    delete field.editComponent;
  }
}

/**
 * The config migrations have been removed from the app (v4).
 * They used to be applied to PublicFormConfig docs whenever a public form was loaded, but were never persisted for them.
 * Without this, a legacy default value is silently dropped from submissions of the form.
 */
export const publicFormLegacyFormats: MigrationDefinition = {
  id: "oneoff-20261022-public-form-legacy-formats",
  description:
    "Convert legacy defaultValue and dataType formats in PublicFormConfig docs to their latest formats. Safe to re-run.",

  async run(ctx): Promise<MigrationResult> {
    const docs = (await ctx.couchdb.getAll("PublicFormConfig")) as Array<{
      _id: string;
    }>;

    let intended = 0;
    for (const doc of docs) {
      const migrated = migratePublicFormLegacyFormats(doc);
      if (JSON.stringify(migrated) === JSON.stringify(doc)) {
        continue;
      }

      intended++;
      ctx.validateJson(migrated);
      ctx.log.info(`Migrating ${doc._id}`);
      await ctx.put(`/app/${doc._id}`, migrated);
    }

    if (intended === 0) {
      ctx.log.info("No PublicFormConfig docs need migration");
      return { changed: false, status: "no-change" };
    }

    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
