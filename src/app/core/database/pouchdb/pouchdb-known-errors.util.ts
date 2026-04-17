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

  if (hasUnknownError) {
    return true;
  }

  const hasSeqConstraintError = hasSeqIndex && hasConstraintError;
  const hasSeqUniquenessError = hasSeqIndex && hasUniqueness;
  if (hasSeqConstraintError || hasSeqUniquenessError) {
    return true;
  }

  const hasGlobalConstraintFailure = hasGlobalFailure && hasConstraintError;
  return hasGlobalConstraintFailure;
}

function collectErrorFragments(
  value: unknown,
  visited: Set<unknown>,
): string[] {
  let fragments: string[] = [];

  if (value === null || value === undefined) {
    fragments = [];
  } else if (typeof value === "string") {
    fragments = [value];
  } else if (typeof value === "number" || typeof value === "boolean") {
    fragments = [String(value)];
  } else if (typeof value !== "object") {
    fragments = [];
  } else if (visited.has(value)) {
    fragments = [];
  } else {
    visited.add(value);

    if (value instanceof Error) {
      fragments = [
        value.name,
        value.message,
        ...collectErrorFragments((value as any).cause, visited),
      ].filter(Boolean);
    } else if (Array.isArray(value)) {
      fragments = value.flatMap((entry) =>
        collectErrorFragments(entry, visited),
      );
    } else {
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

      for (const key of keysToRead) {
        fragments = fragments.concat(
          collectErrorFragments(objectValue[key], visited),
        );
      }

      fragments = fragments.concat(
        collectErrorFragments(objectValue.cause, visited),
        collectErrorFragments(objectValue.errors, visited),
      );
    }
  }

  return fragments;
}
