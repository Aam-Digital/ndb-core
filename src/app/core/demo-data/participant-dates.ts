import { Entity } from "../entity/model/entity";
import { faker } from "./faker";

/**
 * Not every use case records an admission date - the field may not exist on the type at
 * all - so fall back to a plausible one rather than failing the generators that build a
 * history from it.
 */
export function admissionDateOf(participant: Entity): Date {
  const admission = participant["admissionDate"];
  if (admission instanceof Date) {
    return admission;
  }

  // an invented admission after the recorded dropout would make every range built on it invalid
  const dropout = participant["dropoutDate"];
  const latest = dropout instanceof Date ? dropout : faker.defaultRefDate();
  return faker.date.past({ years: 3, refDate: latest });
}
