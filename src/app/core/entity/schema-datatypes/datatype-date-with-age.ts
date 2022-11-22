import { EntitySchemaDatatype } from "../schema/entity-schema-datatype";
import { dateOnlyEntitySchemaDatatype } from "./datatype-date-only";
import { DateWithAge } from "../../../child-dev-project/children/model/dateWithAge";

/**
 * Similar to the 'date-only' datatype but it uses the `DateWithAge` class which provides the `age` function.
 */
export const dateWithAgeEntitySchemaDatatype: EntitySchemaDatatype<
  DateWithAge,
  string
> = {
  name: "date-with-age",
  editComponent: "EditAge",
  viewComponent: "DisplayDate",

  transformToObjectFormat: (value) =>
    new DateWithAge(
      dateOnlyEntitySchemaDatatype.transformToObjectFormat(value)
    ),
  transformToDatabaseFormat: (value) =>
    dateOnlyEntitySchemaDatatype.transformToDatabaseFormat(value),
};
