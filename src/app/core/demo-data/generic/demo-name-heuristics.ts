import { DemoValueContext } from "./demo-value-generator";

const FIRST_NAME = /^(first_?name|given_?name|vorname)$/;
const LAST_NAME = /^(last_?name|sur_?name|family_?name|nachname)$/;

/**
 * Field names that carry more meaning than their datatype does, so that a
 * "name" column reads like a name rather than a random word. First match wins.
 *
 * Anything these cannot guess is set through the spec's `faker` key instead.
 */
const HEURISTICS: {
  matches: (id: string, label: string, context: DemoValueContext) => boolean;
  generate: (context: DemoValueContext) => string;
}[] = [
  {
    matches: (id, label) =>
      FIRST_NAME.test(id) || /^(first name|given name)$/.test(label),
    generate: (context) => context.faker.person.firstName(),
  },
  {
    matches: (id, label) =>
      LAST_NAME.test(id) || /^(last name|surname|family name)$/.test(label),
    generate: (context) => context.faker.person.lastName(),
  },
  {
    // a plain "name" is the whole name, unless a first name sits next to it -
    // then it holds the rest of it (e.g. "vorname" + "name")
    matches: (id, label) => id === "name" || label === "name",
    generate: (context) =>
      context.siblingFields.some((field) =>
        FIRST_NAME.test(field.toLowerCase()),
      )
        ? context.faker.person.lastName()
        : // composed rather than person.fullName(), which adds titles and suffixes
          `${context.faker.person.firstName()} ${context.faker.person.lastName()}`,
  },
  {
    matches: (id, label) =>
      /(^|_)tel/.test(id) || id.includes("phone") || label.includes("phone"),
    generate: (context) => context.faker.phone.number(),
  },
  {
    matches: (id) => id.includes("email") || id.includes("mail"),
    generate: (context) => context.faker.internet.email(),
  },
];

/** A value based on what the field is called, or `undefined` if nothing matches. */
export function generateByFieldName(
  fieldId: string,
  label: string | undefined,
  context: DemoValueContext,
): string | undefined {
  const id = fieldId.toLowerCase();
  const labelText = (typeof label === "string" ? label : "").toLowerCase();

  return HEURISTICS.find((heuristic) =>
    heuristic.matches(id, labelText, context),
  )?.generate(context);
}
