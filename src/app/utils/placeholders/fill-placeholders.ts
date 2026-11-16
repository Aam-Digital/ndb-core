/**
 * The data that placeholders can refer to, following the syntax of the Template Export feature:
 * `{d.<path>}` for the record and `{c.<path>}` for additional context (e.g. `{c.user.name}`).
 */
export interface PlaceholderData {
  /** the record */
  d?: unknown;
  /** additional context, e.g. the record of the current user under `user` */
  c?: unknown;
}

const PLACEHOLDER = /\{([^{}]*)\}/g;

/** a plain path below `d` or `c`; formatters of the template engine (`{d.date:formatD(L)}`) are not supported */
const SUPPORTED_PATH = /^[dc](\.[\w-]+)+$/;

/**
 * The content of all placeholders in the given text, e.g. `["d.name", "c.user.name"]`.
 */
export function getPlaceholders(template: string): string[] {
  return Array.from(template.matchAll(PLACEHOLDER), (match) => match[1].trim());
}

/**
 * Whether {@link fillPlaceholders} can resolve a placeholder with this content.
 */
export function isSupportedPlaceholder(placeholder: string): boolean {
  return SUPPORTED_PATH.test(placeholder);
}

/**
 * Replace the placeholders in the text with the values from the given data.
 *
 * A value that is missing becomes an empty string.
 * Placeholders that are not supported (see {@link isSupportedPlaceholder}) are left as they are.
 *
 * @param transform applied to each inserted value, e.g. `encodeURIComponent`
 */
export function fillPlaceholders(
  template: string,
  data: PlaceholderData,
  transform: (value: string) => string = (value) => value,
): string {
  return template.replace(PLACEHOLDER, (match, content: string) => {
    const placeholder = content.trim();
    if (!isSupportedPlaceholder(placeholder)) {
      return match;
    }
    return transform(valueToText(getValueAtPath(data, placeholder)));
  });
}

function getValueAtPath(data: unknown, path: string): unknown {
  let value = data;
  for (const key of path.split(".")) {
    if (value === null || typeof value !== "object") {
      return undefined;
    }
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function valueToText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return dateToText(value);
  }
  if (Array.isArray(value)) {
    return value.map(valueToText).join(",");
  }
  if (typeof value === "object") {
    // a linked record or a dropdown option: its stable ID rather than a label that can be renamed
    const id =
      (value as { _id?: unknown })._id ?? (value as { id?: unknown }).id;
    return typeof id === "object" ? "" : valueToText(id);
  }
  return String(value);
}

/** date-only values are stored as local midnight: write them without a time, which would shift in UTC */
function dateToText(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const isDateOnly =
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0;
  if (!isDateOnly) {
    return date.toISOString();
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
