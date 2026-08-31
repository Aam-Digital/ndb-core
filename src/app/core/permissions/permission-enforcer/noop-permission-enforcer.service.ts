import { Injectable } from "@angular/core";
import { DatabaseRule } from "../permission-types";
import { PermissionEnforcerService } from "./permission-enforcer.service";

/**
 * No-op implementation for `online` sessions.
 *
 * Online sessions have no local database to purge or invalidate: the server
 * already enforces permissions live on every request, so there is nothing to
 * do here.
 */
@Injectable()
export class NoopPermissionEnforcerService extends PermissionEnforcerService {
  async enforcePermissionsOnLocalData(
    _userRules: DatabaseRule[],
  ): Promise<void> {
    // nothing to do - online sessions have no local cache
  }

  getLastEnforcedRules(): DatabaseRule[] | undefined {
    return undefined;
  }
}
