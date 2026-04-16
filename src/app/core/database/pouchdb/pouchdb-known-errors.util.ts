/**
 * Best-effort extraction of relevant text from unknown error values.
 * Handles Error instances, plain objects, arrays (bulk save errors),
 * and nested causes.
 */
export function extractErrorText(error: unknown): string {
  const visited = new Set<unknown>();
  const fragments = collectErrorFragments(error, visited)
    .map((fragment) => fragment.trim())
    .filter(Boolean);

  if (!fragments.length) {
    return String(error);
  }

  // Keep text compact to avoid overly long user-facing messages.
  return Array.from(new Set(fragments)).slice(0, 5).join(" | ");
}

/**
 * Detect IndexedDB/PouchDB corruption symptoms commonly observed when the app
 * is used in multiple tabs with concurrent writes.
 */
export function isKnownMultiTabDatabaseCorruption(error: unknown): boolean {
  const normalized = extractErrorText(error).toLowerCase();

  const hasSeqIndex =
    normalized.includes("index 'seq'") || normalized.includes('index "seq"');
  const hasConstraintError = normalized.includes("constrainterror");
  const hasUniqueness =
    normalized.includes("uniqueness requirement") ||
    normalized.includes("unable to add key to index");
  const hasGlobalFailure = normalized.includes("database has a global failure");
  const hasUnknownError =
    normalized.includes("unknown_error") ||
    normalized.includes("database encountered an unknown error");

  return (
    (hasSeqIndex && (hasConstraintError || hasUniqueness)) ||
    (hasGlobalFailure && (hasConstraintError || hasUnknownError)) ||
    hasUnknownError
  );
}

/**
 * Shared actionable guidance for affected users.
 */
export function getMultiTabCorruptionGuidanceMessage(): string {
  return $localize`A local database conflict was detected. This can happen when the app is open in multiple tabs. Please close other tabs and reload this page, then try again.`;
}

function collectErrorFragments(
  value: unknown,
  visited: Set<unknown>,
): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (typeof value !== "object") {
    return [];
  }

  if (visited.has(value)) {
    return [];
  }
  visited.add(value);

  if (value instanceof Error) {
    return [
      value.name,
      value.message,
      ...collectErrorFragments((value as any).cause, visited),
    ].filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectErrorFragments(entry, visited));
  }

  const objectValue = value as Record<string, unknown>;
  const keysToRead = [
    "message",
    "reason",
    "name",
    "error",
    "statusText",
    "details",
    "actualResponseBody",
  ];

  let fragments: string[] = [];
  for (const key of keysToRead) {
    fragments = fragments.concat(
      collectErrorFragments(objectValue[key], visited),
    );
  }

  fragments = fragments.concat(
    collectErrorFragments(objectValue.cause, visited),
    collectErrorFragments(objectValue.errors, visited),
  );

  return fragments;
}
