import { DateOnlyDatatype } from "./date-only.datatype";
import { MonthDatatype } from "./month.datatype";
import { DateWithAgeDatatype } from "./date-with-age.datatype";
import { DateDatatype } from "./date.datatype";

export const dateDataTypes = [
  DateDatatype.dataType,
  DateOnlyDatatype.dataType,
  MonthDatatype.dataType,
  DateWithAgeDatatype.dataType,
];
