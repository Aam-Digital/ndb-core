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

import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { Injectable } from "@angular/core";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import moment from "moment";

/**
 * Datatype for the EntitySchemaService transforming values to Date instances.
 *
 * This type is automatically used if you annotate a class's property that has the TypeScript type "Date"
 * ensuring that even if values in the database might be some kind of date string they will be cast to Date instances.
 *
 * For example:
 *
 * `@DatabaseField() myDate: Date; // will be a valid Date even if the database previously had "2020-01-15" as string`
 */
@Injectable()
export class DateDatatype<DBFormat = any> extends DefaultDatatype<
  Date,
  DBFormat
> {
  static override dataType = "date";
  static override label: string = $localize`:datatype-label:date (with time)`;

  viewComponent = "DisplayDate";
  editComponent = "EditDate";

  transformToDatabaseFormat(value: Date) {
    // TODO: should date format be saved as date object or as string "YYYY-mm-dd"?
    // return isValidDate(value) ? value.toISOString().slice(0, 10) : '';
    // DONE: date format is now being saved as date object
    return value as any;
  }

  transformToObjectFormat(value, schemaField, parent) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error(
        `failed to convert data '${value}' to Date object for ${parent._id}`,
      );
    }
    return date;
  }

  importConfigComponent = "DateImportConfig";

  async importMapFunction(
    val: any,
    schemaField: EntitySchemaField,
    additional?: any,
  ) {
    const date = moment(val, additional, true);
    if (date.isValid()) {
      return date.toDate();
    } else {
      return undefined;
    }
  }

  async anonymize(value: Date): Promise<Date> {
    // normalize to 01.06. of the year, which has less statistical distortion than 01.01.
    // (roughly half the dates before anonymization will be earlier and half will be later)
    return new Date(value.getFullYear(), 6, 1);
  }
}
