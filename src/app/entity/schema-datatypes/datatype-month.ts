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

import {EntitySchemaDatatype} from '../schema/entity-schema-datatype';

export const monthEntitySchemaDatatype: EntitySchemaDatatype = {
  name: 'month',

  transformToDatabaseFormat: (value) => {
    if (!(value instanceof Date)) {
      value = new Date(value);
    }
    return (value.getFullYear().toString() + '-' + (value.getMonth() + 1).toString());
  },

  transformToObjectFormat: (value) => {
    let date;
    if (value === '') {
      date = new Date();
    } else {
      date = new Date(value);
    }
    if (isNaN(date.getTime())) {
      throw new Error('failed to convert data to Date object: ' + value);
    }
    return date;
  }
};
