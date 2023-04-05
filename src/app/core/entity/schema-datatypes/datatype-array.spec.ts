import { EntitySchemaField } from "../schema/entity-schema-field";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { ConfigurableEnumDatatype } from "../../configurable-enum/configurable-enum-datatype/configurable-enum-datatype";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { arrayEntitySchemaDatatype } from "./datatype-array";

describe("Schema data type: array", () => {
  let schemaService: EntitySchemaService;
  const schema: EntitySchemaField = {
    dataType: "array",
    innerDataType: "configurable-enum",
    additional: "test",
  };
  beforeEach(() => {
    schemaService = new EntitySchemaService();
    schemaService.registerSchemaDatatype(
      new ConfigurableEnumDatatype({
        getEnumValues: () => defaultInteractionTypes,
      } as any)
    );
  });

  it("should transform enums inside arrays", () => {
    const value = defaultInteractionTypes.map(({ id }) => id);

    const obj = arrayEntitySchemaDatatype.transformToObjectFormat(
      value,
      schema,
      schemaService
    );

    expect(obj).toEqual(defaultInteractionTypes);

    const db = arrayEntitySchemaDatatype.transformToDatabaseFormat(
      obj,
      schema,
      schemaService
    );

    expect(db).toEqual(value);
  });

  it("should automatically transform values that are not entities", () => {
    const value = defaultInteractionTypes[1].id;

    const obj = arrayEntitySchemaDatatype.transformToObjectFormat(
      value,
      schema,
      schemaService
    );

    expect(obj).toEqual([defaultInteractionTypes[1]]);
  });

  it("should transform empty values as an empty array", () => {
    let obj = arrayEntitySchemaDatatype.transformToObjectFormat(
      undefined,
      schema,
      schemaService
    );
    expect(obj).toEqual([]);

    obj = arrayEntitySchemaDatatype.transformToObjectFormat(
      "",
      schema,
      schemaService
    );
    expect(obj).toEqual([]);
  });
});
