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


import { EntitySchemaDatatype } from '../schema/entity-schema-datatype';
import { EntitySchemaField } from '../schema/entity-schema-field';
import { EntitySchemaService } from '../schema/entity-schema.service';

/**
 * (De)serialize instances of any class recognizing the normal @DatabaseField() annotations.
 *
 * Requires the class constructor as extension field in the schema field annotation:
 * `@DatabaseField({ dataType: 'schema-embed', ext: MyClass })`
 * see the unit tests in entity-schema.service.spec.ts for an example
 */
export const schemaEmbedEntitySchemaDatatype: EntitySchemaDatatype = {
  name: 'schema-embed',

  transformToDatabaseFormat: (value: any, schemaField: EntitySchemaField, schemaService: EntitySchemaService) => {
    return schemaService.transformEntityToDatabaseFormat(value, schemaField.ext.schema);
  },


  transformToObjectFormat: (value: any, schemaField: EntitySchemaField, schemaService: EntitySchemaService) => {
    return schemaService.transformDatabaseToEntityFormat(value, schemaField.ext.schema);
  },
};
