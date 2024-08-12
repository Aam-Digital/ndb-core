import { Injectable } from "@angular/core";
import { DateOnlyDatatype } from "../date-only/date-only.datatype";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { Logging } from "../../logging/logging.service";

/**
 * Datatype for the EntitySchemaService transforming Date values to/from a short string month format ("YYYY-mm").
 *
 * Throws an exception if the property is set to something that is not a Date instance and cannot be cast to Date either.
 * Uses the import value mapping properties of the general DateDatatype.
 *
 * For example:
 * `@DatabaseField({dataType: 'month'}) myMonth: Date = new Date('2020-01-15'); // will be "2020-01" in the database`
 */
@Injectable()
export class MonthDatatype extends DateOnlyDatatype {
  static override dataType = "month";
  static override label: string = $localize`:datatype-label:month (date without day of month)`;

  viewComponent = "DisplayMonth";
  editComponent = "EditMonth";

  transformToDatabaseFormat(value) {
    if (!(value instanceof Date)) {
      value = new Date(value);
    }
    return (
      value.getFullYear().toString() +
      "-" +
      (value.getMonth() + 1).toString().replace(/^(\d)$/g, "0$1")
    );
  }

  transformToObjectFormat(
    value: string,
    schemaField: EntitySchemaField,
    parent: any,
  ) {
    const values = value.split("-").map((v) => Number(v));
    const date = new Date(values[0], values[1] - 1);
    if (Number.isNaN(date.getTime())) {
      Logging.warn(
        `failed to convert data '${value}' to Date object for ${parent?._id}`,
      );
      return undefined;
    }
    return date;
  }
}
