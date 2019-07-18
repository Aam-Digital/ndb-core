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


/**
 * Object defining additional configuration about a DatabaseField schema
 */
export interface EntitySchemaField {
  /**
   * The datatype of this field. This will trigger to matching datatype transformer when saving/loading the entity.
   */
  dataType?: string;

  /**
   * In case of an array field (dataType==='array') define the datatype of the values contained in the array
   */
  arrayDataType?: string;

  /**
   * Set to true to make the framework automatically create an index to retrieve/filter Entities quickly based on this field
   */
  generateIndex?: boolean; // TODO: implement index support in EntitySchema
}
