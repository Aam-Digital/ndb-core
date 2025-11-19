import { Entity } from "../../../entity/model/entity";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { genders } from "../../../../child-dev-project/children/model/genders";
import { ConfigurableEnumDatatype } from "./configurable-enum.datatype";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import {
  ConfigurableEnumConfig,
  ConfigurableEnumValue,
} from "../configurable-enum.types";
import { DefaultDatatype } from "../../../entity/default-datatype/default.datatype";

describe("Schema data type: configurable-enum", () => {
  let dataType: ConfigurableEnumDatatype;

  const GENDER_MALE = genders.find((e) => e.id === "M");

  const TEST_CONFIG: ConfigurableEnumConfig = [
    { id: "NONE", label: "" },
    { id: "TEST_1", label: "Category 1" },
    {
      id: "TEST_3",
      label: "Category 3",
      color: "#FFFFFF",
      isMeeting: true,
    } as ConfigurableEnumValue,
  ];

  @DatabaseEntity("ConfigurableEnumDatatypeTestEntity")
  class TestEntity extends Entity {
    @DatabaseField({
      dataType: "configurable-enum",
      additional: "test-enum",
    })
    option: ConfigurableEnumValue;
  }

  let entitySchemaService: EntitySchemaService;
  let enumService: jasmine.SpyObj<ConfigurableEnumService>;

  beforeEach(waitForAsync(() => {
    enumService = jasmine.createSpyObj([
      "getEnumValues",
      "preLoadEnums",
      "cacheEnum",
    ]);
    enumService.getEnumValues.and.returnValue(TEST_CONFIG);

    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [{ provide: ConfigurableEnumService, useValue: enumService }],
    });

    entitySchemaService =
      TestBed.inject<EntitySchemaService>(EntitySchemaService);

    dataType = (
      TestBed.inject(DefaultDatatype) as unknown as DefaultDatatype[]
    ).find((x) => x instanceof ConfigurableEnumDatatype);
  }));

  it("converts objects to keys for database format", () => {
    const testOptionKey = "TEST_1";
    const entity = new TestEntity();
    entity.option = TEST_CONFIG.find((c) => c.id === testOptionKey);

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData.option).toEqual(testOptionKey);
  });

  it("converts keys to full enum value objects for entity format", () => {
    const entity = new TestEntity();

    const data = {
      _id: "test2",
      option: "TEST_1",
    };
    entitySchemaService.loadDataIntoEntity(entity, data);

    expect(entity.option).toEqual(TEST_CONFIG[1]);
  });

  it("transformation should work with identical object copies", () => {
    const testOptionKey = "TEST_1";
    const entity = new TestEntity();
    entity.option = JSON.parse(JSON.stringify(TEST_CONFIG[1]));
    expect(entity.option).not.toBe(TEST_CONFIG[1]);
    expect(entity.option).toEqual(TEST_CONFIG[1]);

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData.option).toEqual(testOptionKey);
  });

  it("should gracefully handle invalid enum ids and show a dummy option to users", () => {
    const data = {
      _id: "Test",
      option: "INVALID_OPTION",
    };
    const entity = new TestEntity();

    entitySchemaService.loadDataIntoEntity(entity, data);

    expect(entity.option).toEqual({
      id: "INVALID_OPTION",
      isInvalidOption: true,
      label: "[invalid option] INVALID_OPTION",
    });
  });

  it("should not expand 'undefined' into a full INVALID_OPTION enum object", () => {
    const undefinedToObjectFormat = dataType.transformToObjectFormat(
      undefined,
      TestEntity.schema.get("option"),
    );

    expect(undefinedToObjectFormat).toBeUndefined();
  });

  it("should map values using importMappingFunction", async () => {
    enumService.getEnumValues.and.returnValue(genders);

    const input = "MALEx";
    const actualMapped = await dataType.importMapFunction(
      input,
      {
        dataType: "configurable-enum",
        additional: "genders",
      },
      { MALEx: GENDER_MALE.id },
    );

    expect(actualMapped).toEqual(GENDER_MALE);
  });

  it("should map values using importMappingFunction for arrays", async () => {
    enumService.getEnumValues.and.returnValue(genders);

    const input = "MALEx";
    const actualMapped = await dataType.importMapFunction(
      input,
      {
        dataType: "configurable-enum",
        additional: "genders",
        isArray: true,
      },
      { MALEx: [GENDER_MALE.id] },
    );

    expect(actualMapped).toEqual([GENDER_MALE]);
  });

  it("should return undefined for unmapped values when mapping is configured", async () => {
    enumService.getEnumValues.and.returnValue(genders);

    const input = "unmapped";
    const actualMapped = await dataType.importMapFunction(
      input,
      {
        dataType: "configurable-enum",
        additional: "genders",
      },
      { MALEx: GENDER_MALE.id },
    );

    expect(actualMapped).toBeUndefined();
  });

  it("should create invalid option when mapping dialog is skipped", async () => {
    enumService.getEnumValues.and.returnValue(genders);

    const input = "unmapped";
    const actualMapped = await dataType.importMapFunction(
      input,
      {
        dataType: "configurable-enum",
        additional: "genders",
      },
      undefined,
    );

    expect(actualMapped).toEqual({
      id: "unmapped",
      isInvalidOption: true,
      label: "[invalid option] unmapped",
    });
  });
});
