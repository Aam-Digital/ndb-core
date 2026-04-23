import { PREFIX_VIEW_CONFIG, ViewConfig } from "./view-config.interface";

export const CONFIG_ENTITY_ROUTE_PREFIX = "c";
export const RESERVED_FIXED_FEATURE_ROUTE_PATHS = [
  "import",
  "review-duplicates",
] as const;

const RESERVED_FIXED_FEATURE_ROUTE_SET = new Set<string>(
  RESERVED_FIXED_FEATURE_ROUTE_PATHS,
);

interface RuntimeViewPathOptions {
  prefixEntityRoutes?: boolean;
}

export interface RuntimeViewPath {
  path: string;
  legacyPath?: string;
}

export function normalizeRoutePath(path: string): string {
  return (path ?? "").replace(/^\//, "");
}

export function getViewPathFromConfigId(viewConfigId: string): string {
  return normalizeRoutePath(viewConfigId.substring(PREFIX_VIEW_CONFIG.length));
}

export function isReservedFixedRoutePath(path: string): boolean {
  const normalizedPath = normalizeRoutePath(path);
  const topLevelPath = normalizedPath.split("/")[0];
  return RESERVED_FIXED_FEATURE_ROUTE_SET.has(topLevelPath);
}

export function isEntityViewConfig(view: ViewConfig): boolean {
  return Boolean(view?.config?.entityType || view?.config?.entity);
}

export function getEntityRuntimePath(path: string): string {
  return `${CONFIG_ENTITY_ROUTE_PREFIX}/${normalizeRoutePath(path)}`;
}

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
