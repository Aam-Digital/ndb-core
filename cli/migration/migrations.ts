import { codoAddEventType } from "./codo-add-event-type.migration.js";
import { latestConfigFormats } from "./latest-config-formats.migration.js";
import { reportDefinitionLegacyCleanup } from "./report-definition-legacy-cleanup.migration.js";
import { setMapCountrycodes } from "./set-map-countrycodes.migration.js";
import { permissionsKeyLegacyCleanup } from "./permissions-key-legacy-cleanup.migration.js";
import { historicalDataLoader } from "./historical-data-loader.migration.js";
import { restoreBackup } from "./restore-backup.migration.js";
import { todoRouteLinks } from "./todo-route-links.migration.js";
import { publicFormLegacyFormats } from "./public-form-legacy-formats.migration.js";
import type { MigrationDefinition } from "./migration-definition.js";

export const CONFIG_DOC_PATH = "/app/Config:CONFIG_ENTITY";

/**
 * All registered migrations.
 * One-off migrations follow the naming convention: oneoff-YYYYMMDD-<slug>
 */
export const migrations: MigrationDefinition[] = [
  latestConfigFormats,
  codoAddEventType,
  reportDefinitionLegacyCleanup,
  permissionsKeyLegacyCleanup,
  setMapCountrycodes,
  todoRouteLinks,
  publicFormLegacyFormats,
  historicalDataLoader,
  restoreBackup,
];
