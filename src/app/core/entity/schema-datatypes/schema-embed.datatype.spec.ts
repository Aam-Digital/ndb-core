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
import { DatabaseField } from "../database-field.decorator";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { CoreModule } from "../../core.module";
import { ComponentRegistry } from "../../../dynamic-components";

describe("Schema data type: schema-embed", () => {
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

  class TestEntity extends Entity {
    @DatabaseField({ dataType: "schema-embed", additional: InnerClass })
    embedded = new InnerClass();
  }

  let entitySchemaService: EntitySchemaService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule],
      providers: [ComponentRegistry],
    });
    entitySchemaService = TestBed.inject(EntitySchemaService);
  }));

  it("applies inner schema transformation for database format", () => {
    const entity = new TestEntity();
    entity.embedded.value = new Date("2020-01-01");

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
