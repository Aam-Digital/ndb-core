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

import { Entity } from "../../entity/model/entity";
import { DatabaseField } from "../../entity/database-field.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { TestBed, waitForAsync } from "@angular/core/testing";
import moment from "moment";
import {
  SchemaEmbedDatatype,
  SchemaEmbedDatatypeAdditional,
} from "./schema-embed.datatype";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { NumberDatatype } from "../number/number.datatype";
import { MonthDatatype } from "../month/month.datatype";
import { Injectable } from "@angular/core";
import { EntitySchema } from "../../entity/schema/entity-schema";

describe("Schema data type: schema-embed", () => {
  describe("(subclass-based with embeddedType)", () => {
    @Injectable()
    class SchemaEmbedTestDatatype extends SchemaEmbedDatatype {
      static override readonly dataType = "schema-embed-test";
      override embeddedType = InnerClass;
    }

    class TestEntityWithEmbedded extends Entity {
      @DatabaseField({
        dataType: SchemaEmbedTestDatatype.dataType,
      })
      embedded = new InnerClass();
    }

    class TestEntityWithEmbeddedOverride extends Entity {
      @DatabaseField({
        dataType: SchemaEmbedTestDatatype.dataType,
        additional: {
          value: { dataType: "number" },
          valueNew: { dataType: "month" },
        } as SchemaEmbedDatatypeAdditional,
      })
      embedded = new InnerClass();
    }

    class InnerClass {
      declare static schema: EntitySchema;

      @DatabaseField({ dataType: "month" }) value: Date;

      private _value2: number;
      @DatabaseField()
      get value2(): number {
        return this._value2;
      }
      set value2(v) {
        if (Number.isNaN(v)) {
          this._value2 = -1;
        } else {
          this._value2 = v;
        }
      }
    }

    let entitySchemaService: EntitySchemaService;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        providers: [
          EntitySchemaService,
          {
            provide: DefaultDatatype,
            useClass: SchemaEmbedTestDatatype,
            multi: true,
          },
          { provide: DefaultDatatype, useClass: NumberDatatype, multi: true },
          { provide: DefaultDatatype, useClass: MonthDatatype, multi: true },
        ],
      });
      entitySchemaService = TestBed.inject(EntitySchemaService);
    }));

    it("applies inner schema transformation for database format", () => {
      const entity = new TestEntityWithEmbedded();
      entity.embedded.value = moment("2020-01-01").toDate();

      const rawData =
        entitySchemaService.transformEntityToDatabaseFormat(entity);
      expect(rawData.embedded.value).toEqual("2020-01");
    });

    it("applies inner schema transformation for object format", () => {
      const data = {
        embedded: { value: "2020-01" },
      };
      const loadedEntity = new TestEntityWithEmbedded();
      entitySchemaService.loadDataIntoEntity(loadedEntity, data);

      expect(loadedEntity.embedded.value).toBeInstanceOf(Date);
      expect(
        moment(loadedEntity.embedded.value).isSame("2020-01-01", "day"),
      ).toBeTrue();
    });

    it("creates instance of embedded class when loading", () => {
      const data = {
        embedded: { value2: "not a number" },
      };
      const loadedEntity = new TestEntityWithEmbeddedOverride();
      entitySchemaService.loadDataIntoEntity(loadedEntity, data);

      expect(loadedEntity.embedded).toBeInstanceOf(InnerClass);
      expect(loadedEntity.embedded.value2).toBe(-1); // setter used during loading
    });

    it("merges additional schema with embeddedType schema and creates class instance", () => {
      const entity = new TestEntityWithEmbeddedOverride();
      entity.embedded.value = 99 as any; // type was overridden in the additional config
      entity.embedded["valueNew"] = moment("2023-06-15").toDate();

      const rawData =
        entitySchemaService.transformEntityToDatabaseFormat(entity);
      expect(rawData.embedded.value).toEqual(99);
      expect(rawData.embedded.valueNew).toEqual("2023-06");

      const data = {
        embedded: { value: 99, valueNew: "2023-06", value2: 5 },
      };
      const loadedEntity = new TestEntityWithEmbeddedOverride();
      entitySchemaService.loadDataIntoEntity(loadedEntity, data);

      expect(loadedEntity.embedded).toBeInstanceOf(InnerClass);
      expect(loadedEntity.embedded.value).toBe(99 as any);
      expect(loadedEntity.embedded["valueNew"]).toBeInstanceOf(Date);
      expect(
        moment(loadedEntity.embedded["valueNew"]).isSame("2023-06-01", "day"),
      ).toBeTrue();
      expect(loadedEntity.embedded.value2).toBe(5);
    });
  });

  describe("(config-based with additional schema)", () => {
    class ConfigTestEntity extends Entity {
      @DatabaseField({
        dataType: "schema-embed",
        additional: {
          value: { dataType: "month" },
          value2: { dataType: "number" },
        } as SchemaEmbedDatatypeAdditional,
      })
      embedded: any;
    }

    let entitySchemaService: EntitySchemaService;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        providers: [
          EntitySchemaService,
          {
            provide: DefaultDatatype,
            useClass: SchemaEmbedDatatype,
            multi: true,
          },
          { provide: DefaultDatatype, useClass: NumberDatatype, multi: true },
          { provide: DefaultDatatype, useClass: MonthDatatype, multi: true },
        ],
      });
      entitySchemaService = TestBed.inject(EntitySchemaService);
    }));

    it("applies inner schema transformation for database format", () => {
      const entity = new ConfigTestEntity();
      entity.embedded = { value: moment("2020-01-01").toDate(), value2: 42 };

      const rawData =
        entitySchemaService.transformEntityToDatabaseFormat(entity);
      expect(rawData.embedded.value).toEqual("2020-01");
      expect(rawData.embedded.value2).toEqual(42);
    });

    it("applies inner schema transformation for object format", () => {
      const data = {
        embedded: { value: "2020-01", value2: 42 },
      };
      const loadedEntity = new ConfigTestEntity();
      entitySchemaService.loadDataIntoEntity(loadedEntity, data);

      expect(loadedEntity.embedded.value).toBeInstanceOf(Date);
      expect(
        moment(loadedEntity.embedded.value).isSame("2020-01-01", "day"),
      ).toBeTrue();
      expect(loadedEntity.embedded.value2).toEqual(42);
    });

    it("returns a plain object when no embeddedType is set", () => {
      const data = {
        embedded: { value: "2020-01", value2: 5 },
      };
      const loadedEntity = new ConfigTestEntity();
      entitySchemaService.loadDataIntoEntity(loadedEntity, data);

      expect(loadedEntity.embedded).toEqual(
        jasmine.objectContaining({ value2: 5 }),
      );
      expect(loadedEntity.embedded.constructor).toBe(Object);
    });

    it("ignores fields not defined in additional schema", () => {
      const entity = new ConfigTestEntity();
      entity.embedded = {
        value: moment("2020-01-01").toDate(),
        value2: 42,
        extra: "not in schema",
      };

      const rawData =
        entitySchemaService.transformEntityToDatabaseFormat(entity);
      expect(rawData.embedded.value).toEqual("2020-01");
      expect(rawData.embedded.value2).toEqual(42);
      expect(rawData.embedded.extra).toBeUndefined();
    });
  });
});
