import { codoAddEventType } from "./codo-add-event-type.migration.js";
import { latestConfigFormats } from "./latest-config-formats.migration.js";
import { consolidateReportDefinition } from "./consolidate-report-definition.migration.js";
import { reportConfigSafeIds } from "./reportconfig-safe-ids.migration.js";
import { permissionsKeyRename } from "./permissions-key-rename.migration.js";
import type { MigrationDefinition } from "./migration-definition.js";

export const CONFIG_DOC_PATH = "/app/Config:CONFIG_ENTITY";

/**
 * All registered migrations.
 * One-off migrations follow the naming convention: oneoff-YYYYMMDD-<slug>
 */
export const migrations: MigrationDefinition[] = [
  latestConfigFormats,
  codoAddEventType,
  consolidateReportDefinition,
  reportConfigSafeIds,
  permissionsKeyRename,
];
