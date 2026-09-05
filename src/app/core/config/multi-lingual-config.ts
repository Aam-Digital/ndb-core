/**
 * Pure helpers for resolving multi-lingual config values
 *
 * A translatable config text can be stored either as a plain `string` (the
 * original, still-supported format) or as a per-language map keyed by locale id,
 * e.g. `{ "en-US": "My Field X", "de": "Mein Feld X" }`. At load time the config
 * is resolved down to the single string for the currently active locale, so that
 * every other part of the app keeps seeing the plain-string format it always has.
 *
 * IMPORTANT: this module is intentionally **node-safe** (no `@angular/*` imports),
 * mirroring `config-migrations.ts`, so it stays pure, unit-testable, and reusable
 * outside the Angular app. The list of valid locale ids is passed in by the caller
 * (e.g. `ConfigService` derives it from `availableLocales`) rather than imported,
 * to keep this file dependency-free.
 *
 * These helpers only ever produce the *resolved* (display) view. The raw maps must
 * remain the persisted source of truth — callers must never write a resolved value
 * back to the config document, or all other languages would be lost.
 */

/** A config text that may be a plain string or a per-locale translation map. */
export type TranslatableText = string | Record<string, string>;

/** Reduce a locale id to its language subtag, e.g. `en-US` -> `en`. */
function baseLanguage(locale: string): string {
  return locale.split("-")[0].toLowerCase();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Detect whether a value is a translation map: a plain object with at least one
 * entry, where *every* key is a recognized locale id and *every* value is a string.
 *
 * Requiring all keys to be known locales (and all values to be strings) keeps the
 * check conservative, so ordinary config objects that merely contain a locale-like
 * key are not misclassified.
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
  return entries.every(
    ([key, val]) => validLocaleIds.includes(key) && typeof val === "string",
  );
}

/**
 * Pick the best non-empty text for `locale` from a translation map:
 * exact locale id first, then any entry that shares the same language subtag
 * (e.g. active `en-GB` falling back to a stored `en-US`).
 */
function pickForLocale(
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
 * Config keys that hold user-facing text and may therefore be multi-lingual.
 * Keys not present on a given object are simply skipped.
 */
export const TRANSLATABLE_CONFIG_KEYS = [
  "label",
  "labelShort",
  "labelPlural",
  "description",
] as const;

/**
 * Merge an edited, locale-resolved config object back onto its raw counterpart,
 * preserving the translations of all other languages.
 *
 * Admin UIs read config through the *resolved* view (plain strings) and write the
 * whole object back. Without this merge, saving would replace a translation map
 * with the single string of the editing admin's language and silently drop every
 * other language (#3862).
 *
 * For each translatable key, if the raw value is a translation map:
 * - unchanged (the edited text still equals what the admin was shown) -> keep the map
 * - changed -> update only the active locale's entry, keeping the other languages
 *
 * Raw plain strings keep the previous simple-string behaviour, so configs that never
 * opted into multiple languages are untouched.
 */
export function mergeTranslatableValues<T extends Record<string, any>>(
  raw: Record<string, any> | undefined,
  edited: T,
  activeLocale: string,
  defaultLocale: string,
  validLocaleIds: readonly string[],
  translatableKeys: readonly string[] = TRANSLATABLE_CONFIG_KEYS,
): T {
  const merged: Record<string, any> = { ...edited };
  if (!raw) {
    return merged as T;
  }

  for (const key of translatableKeys) {
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
