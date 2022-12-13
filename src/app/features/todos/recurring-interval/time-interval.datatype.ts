import { EntitySchemaDatatype } from "../../../core/entity/schema/entity-schema-datatype";
import { TimeInterval } from "./time-interval";

/**
 * Datatype for defining a time interval.
 */
export const timeIntervalDatatype: EntitySchemaDatatype<
  TimeInterval,
  TimeInterval
> = {
  name: "time-interval",
  viewComponent: "DisplayRecurringInterval",
  editComponent: "EditRecurringInterval",
  transformToDatabaseFormat: (value) => value,
  transformToObjectFormat: (value) => value,
};
