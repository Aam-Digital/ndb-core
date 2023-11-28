/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */
import {
  ConfigurableEnumConfig,
  ConfigurableEnumValue,
} from "../configurable-enum.interface";
import { Entity } from "../../../entity/model/entity";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { genders } from "../../../../child-dev-project/children/model/genders";
import { ConfigurableEnumDatatype } from "./configurable-enum.datatype";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("Schema data type: configurable-enum", () => {
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
      innerDataType: "test-enum",
    })
    option: ConfigurableEnumValue;
    @DatabaseField({
      dataType: "configurable-enum",
      additional: "test-enum",
    })
    optionInAdditional: ConfigurableEnumValue;
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
      imports: [MockedTestingModule],
      providers: [{ provide: ConfigurableEnumService, useValue: enumService }],
    });

    entitySchemaService =
      TestBed.inject<EntitySchemaService>(EntitySchemaService);
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

  it("should also support the name of the enum in the 'additional' field", () => {
    const data = {
      _id: "Test",
      optionInAdditional: "TEST_3",
    };
    const entity = new TestEntity();

    entitySchemaService.loadDataIntoEntity(entity, data);

    expect(entity.optionInAdditional).toEqual(TEST_CONFIG[2]);
    expect(entity).toHaveId("Test");
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

  it("should map values using importMappingFunction", () => {
    const dataType = new ConfigurableEnumDatatype(enumService);
    enumService.getEnumValues.and.returnValue(genders);

    const input = "MALEx";
    const actualMapped = dataType.importMapFunction(
      input,
      {
        dataType: "configurable-enum",
        additional: "genders",
      },
      { MALEx: "M" },
    );

    expect(actualMapped).toEqual(genders.find((e) => e.id === "M"));
  });
});
