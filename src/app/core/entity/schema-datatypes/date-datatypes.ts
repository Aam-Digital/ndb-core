import { dateEntitySchemaDatatype } from "./datatype-date";
import { dateOnlyEntitySchemaDatatype } from "./datatype-date-only";
import { monthEntitySchemaDatatype } from "./datatype-month";
import { dateWithAgeEntitySchemaDatatype } from "./datatype-date-with-age";

export const dateDataTypes = [
  dateEntitySchemaDatatype,
  dateOnlyEntitySchemaDatatype,
  monthEntitySchemaDatatype,
  dateWithAgeEntitySchemaDatatype,
].map((dataType) => dataType.name);
