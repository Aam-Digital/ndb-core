import { DateOnlyDatatype } from "../date-only/date-only.datatype";
import { Injectable } from "@angular/core";
import { DateWithAge } from "./dateWithAge";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

/**
 * Similar to the 'date-only' datatype but it uses the `DateWithAge` class which provides the `age` function.
 */
@Injectable()
export class DateWithAgeDatatype extends DateOnlyDatatype {
  static override dataType = "date-with-age";
  static override label: string = $localize`:datatype-label:date of birth (date + age)`;

  editComponent = "EditAge";

  transformToObjectFormat(
    value,
    schemaField: EntitySchemaField,
    parent: any,
  ): DateWithAge {
    const dateValue = super.transformToObjectFormat(value, schemaField, parent);
    if (!dateValue) {
      return undefined;
    }
    return new DateWithAge(dateValue);
  }
}
