import { EntitySchemaField } from "../schema/entity-schema-field";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { ConfigurableEnumDatatype } from "../../configurable-enum/configurable-enum-datatype/configurable-enum-datatype";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { ArrayDatatype } from "./datatype-array";
import { Injector } from "@angular/core";
import { waitForAsync } from "@angular/core/testing";

describe("Schema data type: array", () => {
  let schemaService: EntitySchemaService;
  const schema: EntitySchemaField = {
    dataType: "array",
    innerDataType: "configurable-enum",
    additional: "test",
  };
  let arrayDatatype: ArrayDatatype;
  let entitySchemaService: EntitySchemaService;
  let mockInjector: jasmine.SpyObj<Injector>;

  beforeEach(waitForAsync(() => {
    mockInjector = jasmine.createSpyObj(["get"]);
    entitySchemaService = new EntitySchemaService(mockInjector);

    arrayDatatype = new ArrayDatatype(entitySchemaService);

    mockInjector.get.and.returnValue([
      arrayDatatype,
      new ConfigurableEnumDatatype({
        getEnumValues: () => defaultInteractionTypes,
      } as any),
    ]);
  }));

  it("should transform enums inside arrays", () => {
    const value = defaultInteractionTypes.map(({ id }) => id);

    const obj = arrayDatatype.transformToObjectFormat(
      value,
      schema,
      schemaService,
    );

    expect(obj).toEqual(defaultInteractionTypes);

    const db = arrayDatatype.transformToDatabaseFormat(
      obj,
      schema,
      schemaService,
    );

    expect(db).toEqual(value);
  });

  it("should automatically wrap value into array (and transform to inner type) if not an array yet", () => {
    const value = defaultInteractionTypes[1].id;

    const obj = arrayDatatype.transformToObjectFormat(
      value as any,
      schema,
      schemaService,
    );

    expect(obj).toEqual([defaultInteractionTypes[1]]);
  });

  it("should transform empty values as an empty array", () => {
    let obj = arrayDatatype.transformToObjectFormat(
      undefined,
      schema,
      schemaService,
    );
    expect(obj).toEqual([]);

    obj = arrayDatatype.transformToObjectFormat(
      "" as any,
      schema,
      schemaService,
    );
    expect(obj).toEqual([]);
  });
});
