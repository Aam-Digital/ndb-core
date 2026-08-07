import { inject, Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import moment from "moment";
import { map, Observable, shareReplay, startWith } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { Config } from "../config/config";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Logging } from "../logging/logging.service";
import { EntityAbility } from "./ability/entity-ability";
import { DatabaseRules } from "./permission-types";

/** how long the "Undo" action stays available after a permissions change */
const UNDO_DURATION_MS = 8000;

/**
 * Shared access to the central `Config:Permissions` document for the different
 * UIs that read or edit it (raw JSON editor, public form setup, feature grid).
 *
 * Editing permissions is a high-risk operation - a wrong write can lock users
 * out of the whole app - so every write goes through {@link saveWithBackup},
 * which keeps a timestamped copy of the previous state.
 */
@Injectable({ providedIn: "root" })
export class PermissionsConfigService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly ability = inject(EntityAbility);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Whether the current user may edit the permissions config.
   *
   * Derived from the actual CASL rules rather than a hardcoded role name, so
   * that deployments granting this to a role other than `admin_app` get the
   * editing UI, and deployments revoking it do not get a grid whose save fails.
   */
  canManagePermissions(): boolean {
    return this.ability.can("update", Config);
  }

  /**
   * {@link canManagePermissions} as a stream, re-evaluated whenever the rules of
   * the current user change (login, role change, updated permissions config).
   *
   * Shared, so that several consumers (e.g. one banner per open list view) do
   * not each register their own listener on the ability.
   */
  readonly canManagePermissions$: Observable<boolean> = new Observable<void>(
    (subscriber) => this.ability.on("updated", () => subscriber.next()),
  ).pipe(
    startWith(undefined),
    map(() => this.canManagePermissions()),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /**
   * Load the permissions config, or `null` if it does not exist yet.
   *
   * Any other load failure is rethrown: a caller must not mistake a temporary
   * error for "nothing configured yet" and overwrite the existing document.
   */
  async load(): Promise<Config<DatabaseRules> | null> {
    try {
      return await this.entityMapper.load<Config<DatabaseRules>>(
        Config,
        Config.PERMISSION_KEY,
      );
    } catch (error) {
      if (error?.status === 404 || error?.name === "not_found") {
        return null;
      }
      throw error;
    }
  }

  /**
   * Store a timestamped backup of the config's current state, then save the
   * updated rules.
   *
   * @param config the currently stored config, still holding the previous data
   * @param updatedData the rules to persist
   * @returns the backup Config, so callers can offer an {@link offerUndo}
   */
  async saveWithBackup(
    config: Config<DatabaseRules>,
    updatedData: DatabaseRules,
  ): Promise<Config<DatabaseRules>> {
    const backup = new Config<DatabaseRules>(
      Config.PERMISSION_KEY + ":" + moment().format("YYYY-MM-DD_HH-mm-ss"),
      structuredClone(config.data),
    );
    await this.entityMapper.save(backup);

    config.data = updatedData;
    // force past rev conflicts: the AbilityService also holds this doc live
    await this.entityMapper.save(config, true);

    return backup;
  }

  /**
   * Show a snackbar that restores the given backup when the user acts on it.
   *
   * @param backup the Config returned by {@link saveWithBackup}
   * @param message what to show while the undo is available
   */
  offerUndo(backup: Config<DatabaseRules>, message: string): void {
    const snackBarRef = this.snackBar.open(message, $localize`Undo`, {
      duration: UNDO_DURATION_MS,
    });

    snackBarRef.onAction().subscribe(async () => {
      try {
        // reload rather than reusing the in-memory doc, which may be outdated
        const config = await this.entityMapper.load<Config<DatabaseRules>>(
          Config,
          Config.PERMISSION_KEY,
        );
        config.data = backup.data;
        await this.entityMapper.save(config, true);
        await this.entityMapper.remove(backup);
      } catch (error) {
        Logging.error("Failed to undo permission change", error);
        this.snackBar.open(
          $localize`Could not undo the change. Please try again.`,
          undefined,
          { duration: 5000 },
        );
      }
    });
  }
}
