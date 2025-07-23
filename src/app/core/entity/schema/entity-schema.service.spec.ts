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
import { TestBed, waitForAsync } from "@angular/core/testing";
import { EntitySchemaService } from "./entity-schema.service";
import { DatabaseField } from "../database-field.decorator";
import { DefaultDatatype } from "../default-datatype/default.datatype";
import { EntitySchemaField } from "./entity-schema-field";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { SyncStateSubject } from "app/core/session/session-type";
import { CurrentUserSubject } from "app/core/session/current-user-subject";
import { entityRegistry, EntityRegistry } from "../database-entity.decorator";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import { FileService } from "app/features/file/file.service";
import { of } from "rxjs";

describe("EntitySchemaService", () => {
  let service: EntitySchemaService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });
    service = TestBed.inject(EntitySchemaService);
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

  it("should keep 'null' as value if explicitly set", () => {
    class TestEntity extends Entity {
      @DatabaseField() aString: string;
    }

    const entity = new TestEntity();

    const data = {
      _id: entity.getId(),
      aString: null,
    };
    service.loadDataIntoEntity(entity, data);

    expect(entity.aString).toEqual(null);

    const rawData = service.transformEntityToDatabaseFormat(entity);
    expect(rawData.aString).toEqual(null);
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
    class Test extends Entity {
      @DatabaseField() dateProperty: Date;
    }

    const displayComponent = service.getComponent(
      Test.schema.get("dateProperty"),
      "view",
    );

    expect(displayComponent).toEqual("DisplayDate");
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

export function testDatatype<D extends DefaultDatatype>(
  dataType: D | (new (params: any) => D),
  objectValue,
  databaseValue,
  additionalSchemaFieldConfig?: any,
  additionalProviders?: any[],
) {
  let entitySchemaService: EntitySchemaService;
  let mockFileService: jasmine.SpyObj<FileService>;
  describe("test datatype", () => {
    mockFileService = jasmine.createSpyObj([
      "uploadFile",
      "loadFile",
      "removeFile",
    ]);
    mockFileService.loadFile.and.returnValue(of("success"));
    beforeEach(waitForAsync(() => {
      additionalProviders = additionalProviders || [];
      if (dataType instanceof DefaultDatatype) {
        additionalProviders.push({
          provide: DefaultDatatype,
          useValue: dataType,
          multi: true,
        });
      } else {
        additionalProviders.push({
          provide: DefaultDatatype,
          useClass: dataType,
          multi: true,
        });
      }

      TestBed.configureTestingModule({
        providers: [
          EntitySchemaService,
          ...additionalProviders,
          SyncStateSubject,
          CurrentUserSubject,
          {
            provide: EntityRegistry,
            useValue: entityRegistry,
          },
          { provide: FileService, useValue: mockFileService },

          UserAdminService,
        ],
      });

      entitySchemaService = TestBed.inject(EntitySchemaService);
    }));

    class TestEntity extends Entity {
      @DatabaseField({
        dataType: (dataType as DefaultDatatype | typeof DefaultDatatype)
          .dataType,
        additional: additionalSchemaFieldConfig,
      })
      field;
    }

    it("should convert to database format", () => {
      const entity = new TestEntity();
      entity.field = objectValue;

      const rawData =
        entitySchemaService.transformEntityToDatabaseFormat(entity);
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
  });

  describe("Schema transforms arrays", () => {
    const schema: EntitySchemaField = {
      dataType: "configurable-enum",
      isArray: true,
      additional: "test",
    };
    let entitySchemaService: EntitySchemaService;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [MockedTestingModule.withState()],
      });
      spyOn(
        TestBed.inject(ConfigurableEnumService),
        "getEnumValues",
      ).and.returnValue(defaultInteractionTypes);
      entitySchemaService = TestBed.inject(EntitySchemaService);
    }));

    it("should transform enums inside arrays", () => {
      const value = defaultInteractionTypes.map(({ id }) => id);

      const obj = entitySchemaService.valueToEntityFormat(value, schema, null);

      expect(obj).toEqual(defaultInteractionTypes);

      const db = entitySchemaService.valueToDatabaseFormat(obj, schema, null);

      expect(db).toEqual(value);
    });

    it("should automatically wrap value into array (and transform to inner type) if not an array yet", () => {
      const value = defaultInteractionTypes[1].id;

      const obj = entitySchemaService.valueToEntityFormat(
        value as any,
        schema,
        null,
      );

      expect(obj).toEqual([defaultInteractionTypes[1]]);
    });

    xit("should transform empty values as an empty array", () => {
      // TODO: if removing this behavior (previously part of array.datatype) does not break anything, it seems cleaner not to do special handling for this
      // --> remove test after e2e testing

      let obj = entitySchemaService.valueToEntityFormat(
        undefined,
        schema,
        null,
      );
      expect(obj).toEqual([]);

      obj = entitySchemaService.valueToEntityFormat("" as any, schema, null);
      expect(obj).toEqual([]);
    });
  });
}
