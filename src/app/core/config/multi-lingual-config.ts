/**
 * Pure helpers for resolving multi-lingual config values.
 * See `app/core/language/README.md` for the stored format and the rules around it.
 *
 * Node-safe on purpose (no `@angular/*` imports), like `config-migrations.ts`:
 * the valid locale ids are passed in by the caller instead of imported.
 */

/** A config text that may be a plain string or a per-locale translation map. */
export type TranslatableText = string | Record<string, string>;

/** Names of the config properties that hold a user-facing text. */
type TranslatableTextProperty =
  "label" | "labelShort" | "labelPlural" | "description" | "title" | "header";

/**
 * Config as it is stored, before it is resolved to the active language: every
 * display text may also be a per-language map. Matched by property name only, so
 * a `title` holding e.g. a field id is widened too.
 *
 * Use for config read in order to save it back, so that code treating such a text
 * as a plain string is flagged.
 */
export type RawConfig<T> = 0 extends 1 & T
  ? T // `any` stays `any`
  : T extends (...args: any[]) => any
    ? T
    : T extends object
      ? {
          [K in keyof T]: K extends TranslatableTextProperty
            ? RawText<T[K]>
            : RawConfig<T[K]>;
        }
      : T;

type RawText<V> = V extends string ? TranslatableText : RawConfig<V>;

/** Reduce a locale id to its language subtag, e.g. `en-US` -> `en`. */
export function baseLanguage(locale: string): string {
  return locale.split("-")[0].toLowerCase();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Whether a value is a translation map: every key a known locale id or the base
 * language of one (`en` for `en-US`), every value a string. Deliberately strict,
 * so ordinary config objects with a locale-like key are not misclassified.
 */
export function isTranslatableText(
  value: unknown,
  validLocaleIds: readonly string[],
): value is Record<string, string> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    return false;
  }
  const acceptedKeys = new Set([
    ...validLocaleIds,
    ...validLocaleIds.map(baseLanguage),
  ]);
  return entries.every(
    ([key, val]) => acceptedKeys.has(key) && typeof val === "string",
  );
}

/**
 * Pick the best non-empty text for `locale` from a translation map:
 * exact locale id first, then any entry that shares the same language subtag
 * (e.g. active `en-GB` falling back to a stored `en-US`).
 */
export function pickForLocale(
  map: Record<string, string>,
  locale: string,
): string | undefined {
  if (isNonEmptyString(map[locale])) {
    return map[locale];
  }
  const base = baseLanguage(locale);
  if (isNonEmptyString(map[base])) {
    return map[base];
  }
  const sharedKey = Object.keys(map).find(
    (key) => baseLanguage(key) === base && isNonEmptyString(map[key]),
  );
  return sharedKey !== undefined ? map[sharedKey] : undefined;
}

/**
 * Resolve a translatable value to a single string for the active locale.
 *
 * - a plain string (or `null`/`undefined`) is returned unchanged
 * - a translation map is resolved: active locale -> its language subtag ->
 *   default locale -> default's subtag -> the first non-empty value present
 * - any other (non-map) object is returned unchanged
 */
export function resolveTranslatableText(
  value: TranslatableText | null | undefined,
  activeLocale: string,
  defaultLocale: string,
  validLocaleIds: readonly string[],
): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  if (!isTranslatableText(value, validLocaleIds)) {
    return value as unknown as string;
  }
  return (
    pickForLocale(value, activeLocale) ??
    pickForLocale(value, defaultLocale) ??
    Object.values(value).find(isNonEmptyString)
  );
}

/**
 * Merge an edited, locale-resolved config object back onto its raw counterpart.
 * Admin UIs edit the resolved view and write the whole object back, which without
 * this would replace a translation map with just the editing admin's language.
 *
 * For each key whose raw value is a translation map (all of them, unless
 * `translatableKeys` restricts it): unchanged text keeps the map, a changed text
 * updates only the active locale's entry.
 */
export function mergeTranslatableValues<T extends Record<string, any>>(
  raw: Record<string, any> | undefined,
  edited: T,
  activeLocale: string,
  defaultLocale: string,
  validLocaleIds: readonly string[],
  translatableKeys?: readonly string[],
): T {
  const merged: Record<string, any> = { ...edited };
  if (!raw) {
    return merged as T;
  }

  for (const key of translatableKeys ?? Object.keys(raw)) {
    const rawValue = raw[key];
    if (!isTranslatableText(rawValue, validLocaleIds)) {
      // never was multi-lingual -> keep the edited value unchanged
      continue;
    }

    const editedValue = merged[key];
    if (isTranslatableText(editedValue, validLocaleIds)) {
      // already edited as a full map (e.g. via the translations dialog)
      continue;
    }
    if (typeof editedValue !== "string") {
      // nothing usable was edited -> do not lose the existing translations
      merged[key] = rawValue;
      continue;
    }

    const shownValue = resolveTranslatableText(
      rawValue,
      activeLocale,
      defaultLocale,
      validLocaleIds,
    );
    merged[key] =
      editedValue === shownValue
        ? rawValue
        : { ...rawValue, [activeLocale]: editedValue };
  }

  return merged as T;
}

/**
 * Deep-clone a config tree, replacing every translation map with its resolved
 * string for the active locale and leaving everything else untouched.
 *
 * Returns a new structure; the input is not mutated (the raw config must stay
 * intact as the persisted source of truth).
 */
export function resolveTranslatableConfig<T>(
  config: T,
  activeLocale: string,
  defaultLocale: string,
  validLocaleIds: readonly string[],
): T {
  const walk = (node: unknown): unknown => {
    if (isTranslatableText(node, validLocaleIds)) {
      return resolveTranslatableText(
        node,
        activeLocale,
        defaultLocale,
        validLocaleIds,
      );
    }
    if (Array.isArray(node)) {
      return node.map(walk);
    }
    if (node !== null && typeof node === "object") {
      const resolved: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(node)) {
        resolved[key] = walk(val);
      }
      return resolved;
    }
    return node;
  };

  return walk(config) as T;
}
