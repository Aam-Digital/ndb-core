import { DateDatatype } from "./datatype-date";
import { DateOnlyDatatype } from "./datatype-date-only";
import { DateWithAgeDatatype } from "./datatype-date-with-age";
import { MonthDatatype } from "./datatype-month";

export const dateDataTypes = [
  DateDatatype.dataType,
  DateOnlyDatatype.dataType,
  MonthDatatype.dataType,
  DateWithAgeDatatype.dataType,
];
