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

import { AttendanceDay } from "./attendance-day";
import { async } from "@angular/core/testing";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { AttendanceMonth } from "./attendance-month";

describe("AttendanceDay", () => {
  let entitySchemaService: EntitySchemaService;

  beforeEach(async(() => {
    entitySchemaService = new EntitySchemaService();
  }));

  it("(AttendanceMonth) saves date values as only YYYY-MM-dd", () => {
    const month = new Date("2018-01-01");
    const entity = new AttendanceMonth("");
    entity.month = month;

    const data = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(data.dailyRegister[1].date).toBe("2018-01-02"); // dailyRegister array is zero-based, index 1 is second day

    const loadedEntity = new AttendanceMonth("");
    entitySchemaService.loadDataIntoEntity(loadedEntity, data);
    expect(loadedEntity.dailyRegister[1].date).toEqual(new Date("2018-01-02"));
  });
});
