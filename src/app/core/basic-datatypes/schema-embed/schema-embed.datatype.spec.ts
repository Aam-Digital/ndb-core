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

import { Entity, EntityConstructor } from "../../entity/model/entity";
import { DatabaseField } from "../../entity/database-field.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { TestBed, waitForAsync } from "@angular/core/testing";
import moment from "moment";
import { SchemaEmbedDatatype } from "./schema-embed.datatype";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { NumberDatatype } from "../number/number.datatype";
import { MonthDatatype } from "../month/month.datatype";
import { Injectable } from "@angular/core";

describe("Schema data type: schema-embed", () => {
  @Injectable()
  class SchemaEmbedTestDatatype extends SchemaEmbedDatatype {
    static override dataType = "schema-embed-test";
    override embeddedType = InnerClass as unknown as EntityConstructor;

    constructor(schemaService: EntitySchemaService) {
      super(schemaService);
    }
  }

  class TestEntity extends Entity {
    @DatabaseField({
      dataType: SchemaEmbedTestDatatype.dataType,
    })
    embedded = new InnerClass();
  }

  class InnerClass {
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
    const entity = new TestEntity();
    entity.embedded.value = moment("2020-01-01").toDate();

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData.embedded.value).toEqual("2020-01");
  });

  it("applies inner schema transformation for object format", () => {
    const data = {
      embedded: { value: "2020-01" },
    };
    const loadedEntity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity, data);

    expect(loadedEntity.embedded.value).toBeDate("2020-01-01");
  });

  it("creates instance of embedded class when loading", () => {
    const data = {
      embedded: { value2: "not a number" },
    };
    const loadedEntity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity, data);

    expect(loadedEntity.embedded).toBeInstanceOf(InnerClass);
    expect(loadedEntity.embedded.value2).toBe(-1); // setter used during loading
  });
});
