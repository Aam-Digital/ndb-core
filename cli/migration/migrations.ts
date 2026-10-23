import { codoAddEventType } from "./codo-add-event-type.migration.js";
import { latestConfigFormats } from "./latest-config-formats.migration.js";
import { setMapCountrycodes } from "./set-map-countrycodes.migration.js";
import { restoreBackup } from "./restore-backup.migration.js";
import type { MigrationDefinition } from "./migration-definition.js";

export const CONFIG_DOC_PATH = "/app/Config:CONFIG_ENTITY";

/**
 * All registered migrations.
 * One-off migrations follow the naming convention: oneoff-YYYYMMDD-<slug>
 * One-off migrations needed only to upgrade a system to a new major version
 * are named <major>-upgrade-<slug> (e.g. v4-upgrade-<slug>)
 * and removed once all systems run that version.
 */
export const migrations: MigrationDefinition[] = [
  latestConfigFormats,
  codoAddEventType,
  setMapCountrycodes,
  restoreBackup,
];
