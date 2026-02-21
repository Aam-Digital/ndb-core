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

import { EntitySchemaField } from "./entity-schema-field";

/**
 * Complete schema of an Entity containing multiple EntitySchemaFields.
 *
 * This is generated from all `@DatabaseField()` of a class
 * and then defines the transformation for that whole entity type.
 */
export type EntitySchema = Map<string, EntitySchemaField>;

/**
 * Constructor type for classes that have a static `schema` (via `@DatabaseField()` annotations)
 * but don't necessarily extend `Entity`.
 * This is used for embedded/nested schema objects like `AttendanceItem` or `UpdateMetadata`.
 */
export type SchemaEmbeddedType<T = any> = (new (...args: any[]) => T) & {
  schema: EntitySchema;
};
