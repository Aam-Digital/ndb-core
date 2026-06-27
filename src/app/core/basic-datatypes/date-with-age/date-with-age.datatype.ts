import { DateOnlyDatatype } from "../date-only/date-only.datatype";
import { Injectable } from "@angular/core";
import { DateWithAge } from "./dateWithAge";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { ExportColumnMapping } from "../../entity/default-datatype/default.datatype";

/**
 * Similar to the 'date-only' datatype but it uses the `DateWithAge` class which provides the `age` function.
 */
@Injectable()
export class DateWithAgeDatatype extends DateOnlyDatatype {
  static override dataType = "date-with-age";
  static override label: string = $localize`:datatype-label:date of birth (date + age)`;

  override editComponent = "EditAge";

  override transformToObjectFormat(
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

  /**
   * Export the raw date column plus an additional, derived "age" column.
   *
   * The age is a virtual property computed from the date and is not stored on the
   * entity itself, so without this dedicated column the value would be missing
   * from exports (see #4057).
   */
  override getExportColumns(
    schemaField: EntitySchemaField,
  ): ExportColumnMapping[] {
    const columns = super.getExportColumns(schemaField);
    if (columns.length === 0) {
      return columns;
    }

    return [
      ...columns,
      {
        keySuffix: "_age",
        label: schemaField.label + $localize`:export age column suffix: (age)`,
        resolveValue: (value: DateWithAge) => value?.age,
      },
    ];
  }
}
