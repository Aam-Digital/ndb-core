import { PREFIX_VIEW_CONFIG, ViewConfig } from "./view-config.interface";

/**
 * Stable URL prefix used for entity routes loaded from runtime config.
 */
export const CONFIG_ENTITY_ROUTE_PREFIX = "c";

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
 * Heuristic to identify config views that represent entity navigation.
 * Includes views with an explicit entityType config and detail views (path ending with /:id).
 */
export function isEntityViewConfig(view: ViewConfig): boolean {
  return Boolean(
    view?.config?.entityType ||
    view?.config?.entity ||
    view?._id?.endsWith("/:id"),
  );
}

/**
 * Build the canonical runtime path for config-driven entity routes.
 */
export function getEntityRuntimePath(path: string): string {
  return `${CONFIG_ENTITY_ROUTE_PREFIX}/${normalizeRoutePath(path)}`;
}

/**
 * Resolve the effective route path for a view config at runtime.
 * Entity views are always placed under `CONFIG_ENTITY_ROUTE_PREFIX`.
 */
export function getRuntimePathFromViewConfig(view: ViewConfig): string {
  const rawPath = getViewPathFromConfigId(view._id);
  if (!isEntityViewConfig(view) || !rawPath) {
    return rawPath;
  }

  return getEntityRuntimePath(rawPath);
}
