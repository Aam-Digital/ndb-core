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
import { InteractionSchemaDatatype } from "./interaction-schema-datatype";
import { InteractionType, NoteConfig } from "./note-config.interface";

describe("InteractionSchemaDatatype", () => {
  const testConfig: NoteConfig = {
    InteractionTypes: {
      NONE: { name: "" },
      TEST_1: { name: "Category 1" },
    },
  };
  const interactionSchemaDatatype: InteractionSchemaDatatype = new InteractionSchemaDatatype(
    testConfig
  );

  it(".transformToObjectFormat() should return interaction types by key", () => {
    for (const key of Object.keys(testConfig.InteractionTypes)) {
      const ret: InteractionType = interactionSchemaDatatype.transformToObjectFormat(
        key
      );
      expect(ret).toBe(testConfig.InteractionTypes[key]);
    }
  });

  it(".transformToDatabaseFormat() should return matching keys", () => {
    for (const key of Object.keys(testConfig.InteractionTypes)) {
      const interaction: InteractionType = testConfig.InteractionTypes[key];
      const ret: string = interactionSchemaDatatype.transformToDatabaseFormat(
        interaction
      );
      expect(ret).toBe(key);
    }
  });
});
