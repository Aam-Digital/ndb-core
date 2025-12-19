import { migrateInheritedFieldConfig } from "./inherited-field-config-migration";
import { DefaultValueConfigInheritedField } from "./inherited-field-config";

describe("migrateInheritedFieldConfig", () => {
  it("should migrate inherited-from-referenced-entity mode correctly", () => {
    const defaultValue = {
      mode: "inherited-from-referenced-entity",
      config: {
        localAttribute: "parentId",
        field: "status",
      },
    };

    const result = migrateInheritedFieldConfig("defaultValue", defaultValue);

    expect(result).toEqual({
      mode: "inherited-field",
      config: {
        sourceReferenceField: "parentId",
        sourceValueField: "status",
      },
    });
  });

  it("should migrate updated-from-referencing-entity mode correctly", () => {
    const defaultValue = {
      mode: "updated-from-referencing-entity",
      config: {
        relatedEntityType: "School",
        relatedReferenceField: "students",
        relatedTriggerField: "status",
        automatedMapping: {
          active: "enrolled",
          closed: "graduated",
        },
      },
    };

    const result = migrateInheritedFieldConfig("defaultValue", defaultValue);

    expect(result).toEqual({
      mode: "inherited-field",
      config: {
        sourceReferenceEntity: "School",
        sourceReferenceField: "students",
        sourceValueField: "status",
        valueMapping: {
          active: "enrolled",
          closed: "graduated",
        },
      },
    });
  });

  it("should handle missing valueMapping in updated-from-referencing-entity config", () => {
    const defaultValue = {
      mode: "updated-from-referencing-entity",
      config: {
        relatedEntityType: "School",
        relatedReferenceField: "children",
        relatedTriggerField: "name",
      },
    };

    const result = migrateInheritedFieldConfig("defaultValue", defaultValue);

    expect(result).toEqual({
      mode: "inherited-field",
      config: {
        sourceReferenceEntity: "School",
        sourceReferenceField: "children",
        sourceValueField: "name",
        valueMapping: undefined,
      },
    });
  });

  it("should migrate complex nested config structure", () => {
    const complexConfig = {
      "entity:Child": {
        attributes: {
          category: {
            dataType: "configurable-enum",
            defaultValue: {
              mode: "inherited-from-referenced-entity",
              config: {
                localAttribute: "schoolId",
                field: "category",
              },
            },
          },
          status: {
            dataType: "string",
            defaultValue: {
              mode: "updated-from-referencing-entity",
              config: {
                relatedEntityType: "School",
                relatedReferenceField: "students",
                relatedTriggerField: "status",
                automatedMapping: {
                  open: "active",
                  closed: "inactive",
                },
              },
            },
          },
          normalField: {
            dataType: "string",
            defaultValue: {
              mode: "static",
              config: { value: "default" },
            },
          },
        },
      },
    };

    // Simulate the JSON.parse migration process
    const migratedConfig = JSON.parse(
      JSON.stringify(complexConfig),
      (key, value) => {
        return migrateInheritedFieldConfig(key, value);
      },
    );

    expect(
      migratedConfig["entity:Child"].attributes.category.defaultValue,
    ).toEqual({
      mode: "inherited-field",
      config: {
        sourceReferenceField: "schoolId",
        sourceValueField: "category",
      } satisfies DefaultValueConfigInheritedField,
    });

    expect(
      migratedConfig["entity:Child"].attributes.status.defaultValue,
    ).toEqual({
      mode: "inherited-field",
      config: {
        sourceReferenceEntity: "School",
        sourceReferenceField: "students",
        sourceValueField: "status",
        valueMapping: {
          open: "active",
          closed: "inactive",
        },
      } satisfies DefaultValueConfigInheritedField,
    });

    // Ensure other fields are unchanged
    expect(
      migratedConfig["entity:Child"].attributes.normalField.defaultValue,
    ).toEqual({
      mode: "static",
      config: { value: "default" },
    });
  });
});
