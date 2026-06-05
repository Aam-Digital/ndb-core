import { faker } from "../../../core/demo-data/faker";
import { Entity } from "../../../core/entity/model/entity";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";
import { DateWithAge } from "../../../core/basic-datatypes/date-with-age/dateWithAge";

/**
 * Utility to create a single demo Child entity with realistic faker-based field values.
 * Used by Storybook stories and tests.
 */
export function generateChild(
  opts: { id?: string; inactive?: boolean; name?: string } = {},
): Entity & { [key: string]: any } {
  const id = opts.id ?? faker.string.alphanumeric(20);
  const child = createEntityOfType("Child", id) as Entity & {
    name: string;
    [key: string]: any;
  };

  child.name =
    opts.name ?? `${faker.person.firstName()} ${faker.person.lastName()}`;
  child.dateOfBirth = new DateWithAge(
    faker.date.birthdate({ mode: "age", min: 5, max: 20 }),
  );
  child.admissionDate = faker.date.past({ years: 3 });
  child.phone =
    "+" +
    faker.number.int({ min: 10, max: 99 }) +
    " " +
    faker.number.int({ min: 10000000, max: 99999999 });

  if (opts.inactive ?? false) {
    child.dropoutDate = faker.date.between({
      from: child.admissionDate,
      to: faker.defaultRefDate(),
    });
    child.inactive = true;
  }

  return child;
}
