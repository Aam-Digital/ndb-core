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

import { ChildSchoolRelation } from "./childSchoolRelation";
import { testEntitySubclass } from "../../../core/entity/model/entity.test-utils";
import { DefaultDatatype } from "../../../core/entity/default-datatype/default.datatype";
import { StringDatatype } from "../../../core/basic-datatypes/string/string.datatype";
import { DateOnlyDatatype } from "../../../core/basic-datatypes/date-only/date-only.datatype";
import { EntityDatatype } from "../../../core/basic-datatypes/entity/entity.datatype";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityActionsService } from "../../../core/entity/entity-actions/entity-actions.service";
import {
  entityRegistry,
  EntityRegistry,
} from "../../../core/entity/database-entity.decorator";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";

describe("ChildSchoolRelation Entity", () => {
  // "schoolClass" is not declared on the model, it is added to the schema by the app config.
  // Declare it here so the spec covers it without depending on the config initializer having run.
  let originalSchoolClass: EntitySchemaField | undefined;
  beforeAll(() => {
    originalSchoolClass = ChildSchoolRelation.schema.get("schoolClass");
    ChildSchoolRelation.schema.set("schoolClass", { dataType: "string" });
  });
  afterAll(() => {
    if (originalSchoolClass) {
      ChildSchoolRelation.schema.set("schoolClass", originalSchoolClass);
    } else {
      ChildSchoolRelation.schema.delete("schoolClass");
    }
  });

  testEntitySubclass(
    "ChildSchoolRelation",
    ChildSchoolRelation,
    {
      _id: "ChildSchoolRelation:some-id",

      childId: "1",
      schoolId: "2",
      schoolClass: "10",
      start: "2019-01-01",
      end: "2019-12-31",
    },
    false,
    [
      { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
      { provide: DefaultDatatype, useClass: DateOnlyDatatype, multi: true },
      { provide: DefaultDatatype, useClass: EntityDatatype, multi: true },
      // EntityDatatype only uses these to resolve referenced records, which the
      // pure schema transformation under test never does
      { provide: EntityMapperService, useValue: {} },
      { provide: EntityActionsService, useValue: {} },
      { provide: EntityRegistry, useValue: entityRegistry },
    ],
  );
});
