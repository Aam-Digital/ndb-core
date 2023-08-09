import { dateEntitySchemaDatatype } from "./datatype-date";
import { dateOnlyEntitySchemaDatatype } from "./datatype-date-only";
import { dateWithAgeEntitySchemaDatatype } from "./datatype-date-with-age";
import { MonthDatatype } from "./datatype-month";

export const dateDataTypes = [
  dateEntitySchemaDatatype.name,
  dateOnlyEntitySchemaDatatype.name,
  MonthDatatype.dataType,
  dateWithAgeEntitySchemaDatatype.name,
];
