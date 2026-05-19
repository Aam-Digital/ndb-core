import { Injectable } from "@angular/core";
import { ReplaySubject } from "rxjs";

/**
 * Synchronization signal for when dynamic entity schemas have been applied.
 *
 * Emits after {@link EntityConfigService.setupEntitiesFromConfig} completes,
 * ensuring consumers do not parse entity data before config-defined schema
 * overrides are applied. Use this to gate operations that depend on full schema
 * information (e.g., {@link SiteSettingsService}, {@link SessionManagerService}).
 *
 * @see EntityConfigService
 * @see ConfigService
 */
@Injectable({ providedIn: "root" })
export class EntityConfigReadyService {
  private setupCompleted = new ReplaySubject<void>(1);

  /**
   * Emits once whenever dynamic entity schemas/configs have been applied at runtime.
   * Replays the signal to late subscribers, ensuring they can still act on the completion.
   */
  readonly setupCompleted$ = this.setupCompleted.asObservable();

  /**
   * Signal that entity schema setup (dynamic fields, overrides, etc.) has completed.
   * Called by {@link EntityConfigService} after all config-defined schema changes
   * have been applied to the entity registry.
   * @internal
   */
  markSetupCompleted() {
    this.setupCompleted.next();
  }
}
