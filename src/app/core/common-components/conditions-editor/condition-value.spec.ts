import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import {
  shouldUseMultiSelectCondition,
  unwrapConditionValue,
  wrapConditionValue,
} from "./condition-value";

describe("condition value helpers", () => {
  const listField: EntitySchemaField = { dataType: "entity", isArray: true };
  const singleField: EntitySchemaField = { dataType: "entity" };
  const editedAsList: EntitySchemaField = { ...singleField, isArray: true };

  it.each([
    [listField, "EditText", true],
    [singleField, "EditConfigurableEnum", true],
    [singleField, "EditEntity", true],
    [singleField, "EditEntityType", true],
    [singleField, "EditText", false],
  ])(
    "decides for %j with %s whether the value is a list: %s",
    (field, editComponent, expected) => {
      expect(shouldUseMultiSelectCondition(field, editComponent)).toBe(
        expected,
      );
    },
  );

  it.each([
    [
      "a multi-value field",
      listField,
      listField,
      ["A"],
      { $elemMatch: { $in: ["A"] } },
    ],
    [
      "a field offering several options",
      singleField,
      editedAsList,
      ["A", "B"],
      { $in: ["A", "B"] },
    ],
    ["no value yet", singleField, editedAsList, [], []],
    ["a single value", singleField, singleField, "A", "A"],
  ])("stores the value of %s", (_, field, editedField, value, expected) => {
    expect(wrapConditionValue(field, editedField, value)).toEqual(expected);
  });

  it.each([
    ["a multi-value field", listField, { $elemMatch: { $in: ["A"] } }, ["A"]],
    ["a field offering several options", singleField, { $in: ["A"] }, ["A"]],
    ["a plain value", singleField, "A", "A"],
    ["a negated plain value", singleField, { $not: { $eq: "A" } }, "A"],
    [
      "a negated list",
      listField,
      { $not: { $elemMatch: { $in: ["A", "B"] } } },
      ["A", "B"],
    ],
    ["a single id in the legacy format", listField, { $elemMatch: "A" }, ["A"]],
    [
      "a list in the legacy format",
      listField,
      { $elemMatch: ["A", "B"] },
      ["A", "B"],
    ],
    ["no value yet", singleField, null, null],
  ])("reads the value of %s", (_, field, stored, expected) => {
    expect(unwrapConditionValue(stored, field)).toEqual(expected);
  });
});
