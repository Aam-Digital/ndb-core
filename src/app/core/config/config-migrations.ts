/**
 * Temporary config migrations, extracted from ConfigService so the CLI
 * can import them without pulling in Angular or the full app bundle.
 *
 * Node-safe: no @angular/* imports.
 */

import { ConfigMigration } from "./config-migration";

/**
 * Dashboard widgets that used to implicitly count / list "Child" records if no entity type was configured.
 */
const DASHBOARDS_DEFAULTING_TO_CHILD = [
  "ChildrenCountDashboard",
  "EntityCountDashboard",
  "NotesDashboard",
];

const migrateDashboardDefaultEntityType: ConfigMigration = (
  key,
  configPart,
) => {
  if (DASHBOARDS_DEFAULTING_TO_CHILD.includes(configPart?.component)) {
    configPart.config ||= {};
    configPart.config.entityType ??= "Child";
  }
  return configPart;
};

/**
 * All temporary config migrations that fix legacy data formats.
 * Applied by both ConfigService (Angular app) and the admin CLI (`latest-config-formats`).
 * Order matters: earlier migrations may produce output consumed by later ones.
 *
 * Once a migration has been applied to all systems through the CLI, remove it from here.
 */
export const configMigrations: ConfigMigration[] = [
  migrateDashboardDefaultEntityType,
];

/**
 * Apply all config migrations to a plain JSON document.
 * Returns the migrated document as a plain object (no Angular entity re-hydration).
 * Used by the admin CLI; ConfigService wraps this and also applies the defaults that
 * feature modules register in the DefaultConfigMigrationRegistryService before calling
 * this, so the migrations above can see those default-added view configs too.
 */
export function applyConfigMigrations<E>(doc: E): E {
  return JSON.parse(JSON.stringify(doc), (_that, rawValue) => {
    let docPart = rawValue;
    for (const migration of configMigrations) {
      docPart = migration(_that, docPart);
    }
    return docPart;
  });
}
