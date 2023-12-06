import { TestBed } from "@angular/core/testing";

import { SchemaGeneratorService } from "./schema-generator.service";
import { Entity } from "../../../core/entity/model/entity";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import {
  DatabaseEntity,
  EntityRegistry,
} from "../../../core/entity/database-entity.decorator";
import { User } from "../../../core/user/user";

describe("SchemaGeneratorService", () => {
  let service: SchemaGeneratorService;
  let mockEntities: EntityRegistry;

  beforeEach(() => {
    mockEntities = new EntityRegistry();
    TestBed.configureTestingModule({
      providers: [{ provide: EntityRegistry, useValue: mockEntities }],
    });
    service = TestBed.inject(SchemaGeneratorService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should generate a valid schema including all properties", () => {
    @DatabaseEntity("SchemaTest")
    class SchemaTest extends Entity {
      @DatabaseField() numberProp: number;
      @DatabaseField() stringProp: string;
      @DatabaseField({ dataType: "entity" }) entityProp: string;
      @DatabaseField({ innerDataType: "configurable-enum" })
      arrayEnum: string[];
      @DatabaseField() booleanProp: boolean;
    }
    mockEntities.add(SchemaTest.ENTITY_TYPE, SchemaTest);
    mockEntities.add(User.ENTITY_TYPE, User);

    const schema = service.generateSchema();

    const defaultProps = {
      _id: "TEXT",
      created: "TEXT",
      updated: "TEXT",
      inactive: "INTEGER",
      anonymized: "INTEGER",
    } as const;
    expect(schema.sql).toEqual({
      tables: {
        SchemaTest: {
          numberProp: "INTEGER", // TODO distinguish REAL and INT? SQLITE anyways has dynamic typing https://sqlite.org/datatype3.html
          stringProp: "TEXT",
          entityProp: "TEXT",
          arrayEnum: "TEXT",
          booleanProp: "INTEGER", // TODO check that this works with SQS
          ...defaultProps,
        },
        User: {
          name: "TEXT",
          paginatorSettingsPageSize: "TEXT",
          ...defaultProps,
        },
      },
      options: {
        table_name: {
          operation: "prefix",
          field: "_id",
          separator: ":",
        },
      },
    });
  });
});
