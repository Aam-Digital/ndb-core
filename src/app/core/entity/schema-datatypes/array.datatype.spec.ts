import { EntitySchemaField } from "../schema/entity-schema-field";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { ArrayDatatype } from "./array.datatype";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { CoreModule } from "../../core.module";
import { ComponentRegistry } from "../../../dynamic-components";
import { DefaultDatatype } from "../schema/default.datatype";
import { ConfigurableEnumDatatype } from "../../configurable-enum/configurable-enum-datatype/configurable-enum.datatype";

describe("Schema data type: array", () => {
  let schemaService: EntitySchemaService;
  const schema: EntitySchemaField = {
    dataType: "array",
    innerDataType: "configurable-enum",
    additional: "test",
  };
  let arrayDatatype: ArrayDatatype;
  let entitySchemaService: EntitySchemaService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule],
      providers: [
        ComponentRegistry,
        {
          provide: DefaultDatatype,
          useValue: new ConfigurableEnumDatatype({
            getEnumValues: () => defaultInteractionTypes,
          } as any),
          multi: true,
        },
      ],
    });
    entitySchemaService = TestBed.inject(EntitySchemaService);
    arrayDatatype = entitySchemaService.getDatatypeOrDefault(
      ArrayDatatype.dataType,
    ) as ArrayDatatype;
  }));

  it("should transform enums inside arrays", () => {
    const value = defaultInteractionTypes.map(({ id }) => id);

    const obj = arrayDatatype.transformToObjectFormat(value, schema, null);

    expect(obj).toEqual(defaultInteractionTypes);

    const db = arrayDatatype.transformToDatabaseFormat(obj, schema, null);

    expect(db).toEqual(value);
  });

  it("should automatically wrap value into array (and transform to inner type) if not an array yet", () => {
    const value = defaultInteractionTypes[1].id;

    const obj = arrayDatatype.transformToObjectFormat(
      value as any,
      schema,
      null,
    );

    expect(obj).toEqual([defaultInteractionTypes[1]]);
  });

  it("should transform empty values as an empty array", () => {
    let obj = arrayDatatype.transformToObjectFormat(undefined, schema, null);
    expect(obj).toEqual([]);

    obj = arrayDatatype.transformToObjectFormat("" as any, schema, null);
    expect(obj).toEqual([]);
  });
});
