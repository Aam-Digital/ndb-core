import { EntitySchemaDatatype } from "../schema/entity-schema-datatype";
import { dateOnlyEntitySchemaDatatype } from "./datatype-date-only";
import { DateOfBirth } from "../../../child-dev-project/children/model/dateOfBirth";

/**
 * Similar to the 'date-only' datatype but it uses the `DateOfBirth` class which provides the `age` function.
 */
export const dateOfBirthEntitySchemaDatatype: EntitySchemaDatatype<
  DateOfBirth,
  string
> = {
  name: "date-of-birth",
  editComponent: "EditAge",
  viewComponent: "DisplayAge",

  transformToObjectFormat: (value) =>
    new DateOfBirth(
      dateOnlyEntitySchemaDatatype.transformToObjectFormat(value)
    ),
  transformToDatabaseFormat: (value) =>
    dateOnlyEntitySchemaDatatype.transformToDatabaseFormat(value),
};
