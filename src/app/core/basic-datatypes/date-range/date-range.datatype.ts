import { Injectable } from "@angular/core";
import {
  DefaultDatatype,
  ExportColumnMapping,
} from "../../entity/default-datatype/default.datatype";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { DateOnlyDatatype } from "../date-only/date-only.datatype";

/** A period of time with a start and an end date, either of which can be missing (open-ended). */
export interface DateRangeValue {
  start?: Date;
  end?: Date;
}

/** How a {@link DateRangeValue} is stored in the database: dates as "YYYY-MM-DD" (without time). */
export interface DateRangeDatabaseValue {
  start?: string;
  end?: string;
}

/**
 * Datatype for a period of time: the start and the end date in one field.
 *
 * Both dates are stored as date-only values (see {@link DateOnlyDatatype}) in one object,
 * and either of them may be missing:
 * `@DatabaseField({dataType: "date-range"}) period: DateRangeValue; // {"start": "2026-03-01", "end": "2026-05-31"} in the database`
 */
@Injectable()
export class DateRangeDatatype extends DefaultDatatype<
  DateRangeValue,
  DateRangeDatabaseValue
> {
  static override readonly dataType = "date-range";
  static override readonly label: string = $localize`:datatype-label:date range (start and end date)`;

  override viewComponent = "DisplayDateRange";
  override editComponent = "EditDateRange";

  /** converts the single dates, so that they are stored like all other date-only fields */
  private readonly dateOnly = new DateOnlyDatatype();

  override transformToDatabaseFormat(
    value: DateRangeValue,
  ): DateRangeDatabaseValue | undefined {
    const start = this.dateOnly.transformToDatabaseFormat(value?.start);
    const end = this.dateOnly.transformToDatabaseFormat(value?.end);
    if (!start && !end) {
      return undefined;
    }
    return { ...(start && { start }), ...(end && { end }) };
  }

  override transformToObjectFormat(
    value: DateRangeDatabaseValue,
    schemaField?: EntitySchemaField,
    parent?: any,
  ): DateRangeValue | undefined {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    const start = this.dateOnly.transformToObjectFormat(
      value.start,
      schemaField,
      parent,
    );
    const end = this.dateOnly.transformToObjectFormat(
      value.end,
      schemaField,
      parent,
    );
    if (!start && !end) {
      return undefined;
    }
    return { ...(start && { start }), ...(end && { end }) };
  }

  /** Sort by the start date (or by the end date, if there is no start date). */
  override sortValue(value: DateRangeValue): number | undefined {
    return (value?.start ?? value?.end)?.getTime();
  }

  /** Export the start and the end date in separate columns. */
  override getExportColumns(
    schemaField: EntitySchemaField,
  ): ExportColumnMapping<DateRangeValue>[] {
    if (!schemaField.label) {
      return [];
    }
    return [
      {
        keySuffix: "_start",
        label: $localize`:Export column header|e.g. Project period (start):${schemaField.label} (start)`,
        resolveValue: (value) => value?.start,
      },
      {
        keySuffix: "_end",
        label: $localize`:Export column header|e.g. Project period (end):${schemaField.label} (end)`,
        resolveValue: (value) => value?.end,
      },
    ];
  }

  override async anonymize(value: DateRangeValue): Promise<DateRangeValue> {
    const [start, end] = await Promise.all([
      value?.start && this.dateOnly.anonymize(value.start),
      value?.end && this.dateOnly.anonymize(value.end),
    ]);
    return { ...(start && { start }), ...(end && { end }) };
  }
}
