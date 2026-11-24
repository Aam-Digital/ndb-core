import { Entity } from "../entity/model/entity";
import { faker } from "./faker";

/**
 * Not every use case records an admission date - the field may not exist on the type at
 * all - so fall back to a plausible one rather than failing the generators that build a
 * history from it.
 */
export function admissionDateOf(participant: Entity): Date {
  const admission = participant["admissionDate"];
  return admission instanceof Date ? admission : faker.date.past({ years: 3 });
}
