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

import { Entity } from "../model/entity";
import { waitForAsync } from "@angular/core/testing";
import { EntitySchemaService } from "./entity-schema.service";
import { DatabaseField } from "../database-field.decorator";
import { Injector } from "@angular/core";
import { StringDatatype } from "../schema-datatypes/string.datatype";
import { DefaultDatatype } from "./default.datatype";
import { DateOnlyDatatype } from "../schema-datatypes/date-only.datatype";
import { ArrayDatatype } from "../schema-datatypes/array.datatype";

describe("EntitySchemaService", () => {
  let service: EntitySchemaService;
  let mockInjector: jasmine.SpyObj<Injector>;

  beforeEach(waitForAsync(() => {
    mockInjector = jasmine.createSpyObj(["get"]);
    mockInjector.get.and.returnValue([new StringDatatype()]);

    service = new EntitySchemaService(mockInjector);
  }));

  it("should use datatype service transform methods to converts values", function () {
    class TestEntity extends Entity {
      @DatabaseField() aString: string;
    }

    const id = "test1";
    const entity = new TestEntity(id);

    const data = {
      _id: "test2",
      aString: 192,
    };
    service.loadDataIntoEntity(entity, data);

    expect(entity.aString).toEqual("192");

    const rawData = service.transformEntityToDatabaseFormat(entity);
    expect(rawData.aString).toEqual("192");
  });

  it("should return the directly defined component name for viewing and editing a property", () => {
    class Test extends Entity {
      @DatabaseField({
        dataType: "month",
        viewComponent: "DisplayDate",
        editComponent: "EditDate",
      })
      month: Date;
    }

    const viewComponent = service.getComponent(
      Test.schema.get("month"),
      "view",
    );
    const editComponent = service.getComponent(
      Test.schema.get("month"),
      "edit",
    );

    expect(viewComponent).toEqual("DisplayDate");
    expect(editComponent).toEqual("EditDate");
  });

  it("should return the display component of the datatype if no other is defined", () => {
    class TestDatatype extends DefaultDatatype {
      static dataType = "test-datatype";
      viewComponent = "DisplayText";
      transformToDatabaseFormat = () => null;
      transformToObjectFormat = () => null;
    }
    mockInjector.get.and.returnValue([new TestDatatype()]);

    class Test extends Entity {
      @DatabaseField({ dataType: "test-datatype" }) stringProperty: string;
    }

    const displayComponent = service.getComponent(
      Test.schema.get("stringProperty"),
      "view",
    );

    expect(displayComponent).toEqual("DisplayText");
  });

  it("should return the display and edit component for the innerDataType if dataType is array", () => {
    class TestEntity extends Entity {
      @DatabaseField({ innerDataType: DateOnlyDatatype.dataType })
      dates: Date[];
    }
    mockInjector.get.and.returnValue([
      new DateOnlyDatatype(),
      new ArrayDatatype(service),
    ]);

    const propertySchema = TestEntity.schema.get("dates");

    const displayComponent = service.getComponent(propertySchema, "view");
    expect(displayComponent).toBe(new DateOnlyDatatype().viewComponent);

    const editComponent = service.getComponent(propertySchema, "edit");
    expect(editComponent).toBe(new DateOnlyDatatype().editComponent);
  });

  it("should return the default datatype no type is specified", () => {
    const dataType = service.getDatatypeOrDefault(undefined);
    expect(dataType).toBeInstanceOf(DefaultDatatype);
  });

  it("should throw an error if data type does not exist", () => {
    expect(() =>
      service.getDatatypeOrDefault("invalidDataType"),
    ).toThrowError();
  });
});

export function testDatatype(
  dataType: DefaultDatatype,
  objectValue,
  databaseValue,
  additionalSchemaFieldConfig?: any,
) {
  let entitySchemaService: EntitySchemaService;
  let mockInjector: jasmine.SpyObj<Injector>;

  beforeEach(waitForAsync(() => {
    mockInjector = jasmine.createSpyObj(["get"]);
    mockInjector.get.and.returnValue([dataType]);

    entitySchemaService = new EntitySchemaService(mockInjector);
  }));

  class TestEntity extends Entity {
    @DatabaseField({
      dataType: dataType.dataType,
      additional: additionalSchemaFieldConfig,
    })
    field;
  }

  it("should convert to database format", () => {
    const entity = new TestEntity();
    entity.field = objectValue;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData.field).toEqual(databaseValue);
  });

  it("should convert from database to entity format", () => {
    const data = {
      field: databaseValue,
    };
    const loadedEntity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity, data);

    expect(loadedEntity.field).toEqual(objectValue);
  });
}
