import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { DefaultDatatype } from "../default-datatype/default.datatype";
import { entityRegistry, EntityRegistry } from "../database-entity.decorator";
import { DatabaseField } from "../database-field.decorator";
import { Entity } from "../model/entity";
import { EntitySchemaField } from "./entity-schema-field";
import { EntitySchemaService } from "./entity-schema.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { SyncStateSubject } from "app/core/session/session-type";
import { CurrentUserSubject } from "app/core/session/current-user-subject";
import { UserAdminService } from "app/core/user/user-admin-service/user-admin.service";
import { FileService } from "app/features/file/file.service";

export function testDatatype<D extends DefaultDatatype>(
  dataType: D | (new (params: any) => D),
  objectValue,
  databaseValue,
  additionalSchemaFieldConfig?: any,
  additionalProviders?: any[],
) {
  let entitySchemaService: EntitySchemaService;
  let mockFileService: any;
  describe("test datatype", () => {
    mockFileService = {
      uploadFile: vi.fn(),
      loadFile: vi.fn(),
      removeFile: vi.fn(),
    };
    mockFileService.loadFile.mockReturnValue(of("success"));
    beforeEach(() => {
      const localAdditionalProviders = [...(additionalProviders ?? [])];
      if (dataType instanceof DefaultDatatype) {
        localAdditionalProviders.push({
          provide: DefaultDatatype,
          useValue: dataType,
          multi: true,
        });
      } else {
        localAdditionalProviders.push({
          provide: DefaultDatatype,
          useClass: dataType,
          multi: true,
        });
      }

      TestBed.configureTestingModule({
        providers: [
          EntitySchemaService,
          ...localAdditionalProviders,
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
    });

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

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [MockedTestingModule.withState()],
      });
      vi.spyOn(
        TestBed.inject(ConfigurableEnumService),
        "getEnumValues",
      ).mockReturnValue(defaultInteractionTypes);
      entitySchemaService = TestBed.inject(EntitySchemaService);
    });

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

    it.skip("should transform empty values as an empty array", () => {
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
