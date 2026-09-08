import { Injectable } from "@angular/core";
import { DatabaseRule } from "../permission-types";

/**
 * Reacts to changes in the current user's permission rules by invalidating
 * or purging any locally cached data the user is no longer allowed to read.
 *
 * The concrete implementation is selected in {@link PermissionsModule}.
 */
@Injectable()
export abstract class PermissionEnforcerService {
  /**
   * This is a suffix used to persist the user-relevant rules in local storage to later check for changes.
   */
  static readonly LOCALSTORAGE_KEY = "RULES";

  abstract enforcePermissionsOnLocalData(
    userRules: DatabaseRule[],
  ): Promise<void>;

  /**
   * The rules that were last successfully applied and enforced for the current
   * user on this device (see {@link enforcePermissionsOnLocalData}).
   *
   * `undefined` if there is no session or no rules have been enforced yet.
   */
  abstract getLastEnforcedRules(): DatabaseRule[] | undefined;
}
