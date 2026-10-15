import { Injectable } from "@angular/core";
import { ConfigMigration } from "./config-migration";

/**
 * Registry for config migrations that add default config parts which every system
 * should have without each deployment storing them in its own config
 * (e.g. the standard view of a feature).
 *
 * Feature modules register their own defaults here during their initialization,
 * so that the core code does not have to import from the feature folders -
 * the same approach as {@link ComponentRegistry} or {@link DashboardWidgetRegistryService}.
 *
 * These migrations run before the regular config migrations, so that those can
 * see the default-added config parts as well.
 */
@Injectable({ providedIn: "root" })
export class DefaultConfigMigrationRegistryService {
  private readonly migrations: ConfigMigration[] = [];

  /**
   * Register config migrations adding default config parts of a feature.
   * @param migrations
   */
  register(...migrations: ConfigMigration[]) {
    this.migrations.push(...migrations);
  }

  getAll(): ConfigMigration[] {
    return [...this.migrations];
  }
}
