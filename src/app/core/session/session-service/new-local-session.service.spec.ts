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

import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { NewLocalSessionService } from "./new-local-session.service";
import { testSessionServiceImplementation } from "./session.service.spec";
import { InMemoryDatabase } from "../../database/in-memory-database";

describe("NewLocalSessionService", async () => {
  testSessionServiceImplementation(async () => {
    return new NewLocalSessionService(
      jasmine.createSpyObj(["warn"]),
      new EntitySchemaService(),
      InMemoryDatabase.create()
    );
  });
});
