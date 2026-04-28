import { PREFIX_VIEW_CONFIG, ViewConfig } from "./view-config.interface";

/**
 * Stable URL prefix used for entity routes loaded from runtime config.
 */
export const CONFIG_ENTITY_ROUTE_PREFIX = "c";

/**
 * Fixed feature routes that must never be replaced by dynamic config.
 */
export const RESERVED_FIXED_FEATURE_ROUTE_PATHS = [
  "import",
  "deduplication",
] as const;

const RESERVED_FIXED_FEATURE_ROUTE_SET = new Set<string>(
  RESERVED_FIXED_FEATURE_ROUTE_PATHS,
);

interface RuntimeViewPathOptions {
  /**
   * When enabled, entity views are moved under `CONFIG_ENTITY_ROUTE_PREFIX`.
   */
  prefixEntityRoutes?: boolean;
}

export interface RuntimeViewPath {
  /**
   * Final path to register in Angular router config.
   */
  path: string;
  /**
   * Optional legacy path (without prefix) for backward-compatible redirects.
   */
  legacyPath?: string;
}

/**
 * Normalize a route path for internal comparisons.
 * Removes a single leading slash and keeps nested segments unchanged.
 */
export function normalizeRoutePath(path: string): string {
  return (path ?? "").replace(/^\//, "");
}

/**
 * Convert a `view:*` config id into a plain route path.
 */
export function getViewPathFromConfigId(viewConfigId: string): string {
  return normalizeRoutePath(viewConfigId.substring(PREFIX_VIEW_CONFIG.length));
}

/**
 * Detect whether a path collides with a reserved top-level fixed feature route.
 */
export function isReservedFixedRoutePath(path: string): boolean {
  const normalizedPath = normalizeRoutePath(path);
  const topLevelPath = normalizedPath.split("/")[0];
  return RESERVED_FIXED_FEATURE_ROUTE_SET.has(topLevelPath);
}

/**
 * Heuristic to identify config views that represent entity navigation.
 */
export function isEntityViewConfig(view: ViewConfig): boolean {
  return Boolean(view?.config?.entityType || view?.config?.entity);
}

/**
 * Build the canonical runtime path for config-driven entity routes.
 */
export function getEntityRuntimePath(path: string): string {
  return `${CONFIG_ENTITY_ROUTE_PREFIX}/${normalizeRoutePath(path)}`;
}

/**
 * Resolve the effective route path for a view config at runtime.
 * Optionally returns a legacy unprefixed path when entity prefixing is active.
 */
export function getRuntimePathFromViewConfig(
  view: ViewConfig,
  options: RuntimeViewPathOptions = {},
): RuntimeViewPath {
  const rawPath = getViewPathFromConfigId(view._id);
  if (!options.prefixEntityRoutes || !isEntityViewConfig(view) || !rawPath) {
    return { path: rawPath };
  }

  return {
    path: getEntityRuntimePath(rawPath),
    legacyPath: rawPath,
  };
}
