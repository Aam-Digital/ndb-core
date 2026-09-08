import {
  DatabaseRules,
  DEFAULT_SECTION_KEY,
  LEGACY_DEFAULT_KEY,
  LEGACY_PUBLIC_KEY,
  PUBLIC_SECTION_KEY,
} from "./permission-types";

/** the current name of each reserved section key and its legacy spelling */
const LEGACY_SECTION_KEYS: { current: string; legacy: string }[] = [
  { current: DEFAULT_SECTION_KEY, legacy: LEGACY_DEFAULT_KEY },
  { current: PUBLIC_SECTION_KEY, legacy: LEGACY_PUBLIC_KEY },
];

/**
 * Bring a raw Config:Permissions rules object into the current format, so that
 * everything reading it can rely on the underscore-prefixed reserved section
 * keys ("_default", "_public") alone.
 *
 * A legacy section ("default", "public") is copied to its current name if that
 * is not present, which is the same precedence the backend applies: where both
 * exist, the underscore-prefixed one wins.
 *
 * The legacy keys themselves are kept, because removing them from the stored
 * document is a separate, staged step (the `oneoff-20260804-permissions-key-legacy-cleanup`
 * migration in `cli/migration/`, which only runs once every reader is known to
 * use the new keys). They are never resolved as a user role
 * (see {@link RESERVED_RULE_CONFIG_KEYS}), so leaving them in has no effect.
 *
 * Returns a new object; the input, which typically belongs to a loaded entity,
 * is not modified. A missing rules object is passed through unchanged, so that
 * callers can still distinguish "no permissions configured" from "no rules".
 */
export function migrateLegacySectionKeys(rules: DatabaseRules): DatabaseRules {
  if (!rules) {
    return rules;
  }

  const migrated: DatabaseRules = { ...rules };
  for (const { current, legacy } of LEGACY_SECTION_KEYS) {
    if (migrated[legacy] && !migrated[current]) {
      migrated[current] = migrated[legacy];
    }
  }
  return migrated;
}
