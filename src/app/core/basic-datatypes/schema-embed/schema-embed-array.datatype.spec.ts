import { Entity } from "../../entity/model/entity";
import { DatabaseField } from "../../entity/database-field.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { TestBed, waitForAsync } from "@angular/core/testing";
import moment from "moment";
import { SchemaEmbedArrayDatatype } from "./schema-embed-array.datatype";
import { SchemaEmbedDatatypeAdditional } from "./schema-embed.datatype";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { NumberDatatype } from "../number/number.datatype";
import { MonthDatatype } from "../month/month.datatype";
import { Injectable } from "@angular/core";
import { EntitySchema } from "../../entity/schema/entity-schema";

describe("Schema data type: schema-embed-array", () => {
  it("always forces isArray to true, regardless of config", () => {
    TestBed.configureTestingModule({
      providers: [EntitySchemaService, SchemaEmbedArrayDatatype],
    });
    const datatype = TestBed.inject(SchemaEmbedArrayDatatype);

    expect(
      datatype.normalizeSchemaField({ dataType: "schema-embed-array" }),
    ).toMatchObject({ isArray: true });
    expect(
      datatype.normalizeSchemaField({
        dataType: "schema-embed-array",
        isArray: false,
      }),
    ).toMatchObject({ isArray: true });
  });

  describe("(config-based with additional schema)", () => {
    class ConfigTestEntity extends Entity {
      // isArray is set explicitly here because normalizeSchemaField is only applied
      // when a schema is loaded from JSON config (EntityConfigService), not for fields
      // declared directly via @DatabaseField() - see TestEventEntity's "attendance" field.
      @DatabaseField({
        dataType: SchemaEmbedArrayDatatype.dataType,
        isArray: true,
        additional: {
          value: { dataType: "month" },
          value2: { dataType: "number" },
        } as SchemaEmbedDatatypeAdditional,
      })
      embedded: any[];
    }

    let entitySchemaService: EntitySchemaService;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        providers: [
          EntitySchemaService,
          {
            provide: DefaultDatatype,
            useClass: SchemaEmbedArrayDatatype,
            multi: true,
          },
          { provide: DefaultDatatype, useClass: NumberDatatype, multi: true },
          { provide: DefaultDatatype, useClass: MonthDatatype, multi: true },
        ],
      });
      entitySchemaService = TestBed.inject(EntitySchemaService);
    }));

    it("transforms an array of embedded objects to database format", () => {
      const entity = new ConfigTestEntity();
      entity.embedded = [
        { value: moment("2020-01-01").toDate(), value2: 1 },
        { value: moment("2021-06-01").toDate(), value2: 2 },
      ];

      const rawData =
        entitySchemaService.transformEntityToDatabaseFormat(entity);
      expect(rawData.embedded).toEqual([
        { value: "2020-01", value2: 1 },
        { value: "2021-06", value2: 2 },
      ]);
    });

    it("transforms an array of embedded objects to entity format", () => {
      const data = {
        embedded: [
          { value: "2020-01", value2: 1 },
          { value: "2021-06", value2: 2 },
        ],
      };
      const loadedEntity = new ConfigTestEntity();
      entitySchemaService.loadDataIntoEntity(loadedEntity, data);

      expect(loadedEntity.embedded).toHaveLength(2);
      expect(loadedEntity.embedded[0].value).toBeInstanceOf(Date);
      expect(loadedEntity.embedded[1].value2).toEqual(2);
    });

    it("wraps a single non-array value stored in the database into an array", () => {
      const data = { embedded: { value: "2020-01", value2: 1 } };
      const loadedEntity = new ConfigTestEntity();
      entitySchemaService.loadDataIntoEntity(loadedEntity, data);

      expect(loadedEntity.embedded).toHaveLength(1);
      expect(loadedEntity.embedded[0].value2).toEqual(1);
    });

    it("resolves the default edit and view components", () => {
      expect(
        entitySchemaService.getComponent(
          { dataType: SchemaEmbedArrayDatatype.dataType },
          "edit",
        ),
      ).toBe("EditSchemaEmbedArray");
      expect(
        entitySchemaService.getComponent(
          { dataType: SchemaEmbedArrayDatatype.dataType },
          "view",
        ),
      ).toBe("DisplaySchemaEmbedArray");
    });
  });

  describe("(subclass-based with embeddedType)", () => {
    class InnerClass {
      declare static schema: EntitySchema;

      @DatabaseField({ dataType: "month" })
      value: Date;

      @DatabaseField({ dataType: "number" })
      value2: number;
    }

    @Injectable()
    class SchemaEmbedArrayTestDatatype extends SchemaEmbedArrayDatatype {
      static override readonly dataType = "schema-embed-array-test";
      override embeddedType = InnerClass;
    }

    class TestEntityWithEmbeddedArray extends Entity {
      @DatabaseField({
        dataType: SchemaEmbedArrayTestDatatype.dataType,
        isArray: true,
      })
      embedded: InnerClass[];
    }

    let entitySchemaService: EntitySchemaService;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        providers: [
          EntitySchemaService,
          {
            provide: DefaultDatatype,
            useClass: SchemaEmbedArrayTestDatatype,
            multi: true,
          },
          { provide: DefaultDatatype, useClass: NumberDatatype, multi: true },
          { provide: DefaultDatatype, useClass: MonthDatatype, multi: true },
        ],
      });
      entitySchemaService = TestBed.inject(EntitySchemaService);
    }));

    it("creates instances of the embedded class for each array entry when loading", () => {
      const data = {
        embedded: [
          { value: "2020-01", value2: 1 },
          { value: "2021-06", value2: 2 },
        ],
      };
      const loadedEntity = new TestEntityWithEmbeddedArray();
      entitySchemaService.loadDataIntoEntity(loadedEntity, data);

      expect(loadedEntity.embedded).toHaveLength(2);
      expect(loadedEntity.embedded[0]).toBeInstanceOf(InnerClass);
      expect(loadedEntity.embedded[1]).toBeInstanceOf(InnerClass);
      expect(loadedEntity.embedded[1].value2).toEqual(2);
    });
  });
});
