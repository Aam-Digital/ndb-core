import { inject, Injectable } from "@angular/core";
import {
  DatabaseRule,
  DatabaseRules,
  DEFAULT_SECTION_KEY,
  isReservedRuleConfigKey,
  PUBLIC_SECTION_KEY,
} from "../permission-types";
import { migrateLegacySectionKeys } from "../permissions-config-migration";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { PermissionEnforcerService } from "../permission-enforcer/permission-enforcer.service";
import { EntityAbility } from "./entity-ability";
import { Config } from "../../config/config";
import { Logging } from "../../logging/logging.service";
import { get, has } from "lodash-es";
import { LatestEntityLoader } from "../../entity/latest-entity-loader";
import { SessionInfo, SessionSubject } from "../../session/auth/session-info";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { filter, firstValueFrom, merge, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { HttpStatusCode } from "@angular/common/http";
import { isConnectivityError } from "#src/app/utils/connectivity-error";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

/**
 * This service sets up the `EntityAbility` injectable with the JSON defined rules for the currently logged in user.
 *
 * To get notified whenever the permissions of the current user are updated, use EntityAbility.on("updated", callback):
 * https://casl.js.org/v6/en/api/casl-ability#on
 */
@Injectable()
export class AbilityService extends LatestEntityLoader<Config<DatabaseRules>> {
  static readonly USER_PROPERTY_UNDEFINED = "__USER_PROPERTY_UNDEFINED__";

  private ability = inject(EntityAbility);
  private sessionInfo = inject(SessionSubject);
  private currentUser = inject(CurrentUserSubject);
  private permissionEnforcer = inject(PermissionEnforcerService);

  private currentRules: DatabaseRules;

  /**
   * Whether the state of the permission config is actually known, i.e. it was
   * loaded from the database or the database confirmed it does not exist.
   *
   * `currentRules` alone cannot express this: it is `undefined` both for an
   * instance that deliberately defines no permissions (-> allow everything) and
   * for a config we simply failed to load. Only the former is a fact about the
   * instance that may be enforced on local data.
   */
  private rulesKnown = false;

  /**
   * The rules of every loaded version of the permissions document, brought into
   * the current format once here, so that the rest of the service only deals
   * with the underscore-prefixed reserved section keys.
   */
  private readonly rulesUpdated: Observable<DatabaseRules>;

  constructor() {
    const entityMapper = inject(EntityMapperService);

    super(Config, Config.PERMISSION_KEY, entityMapper);

    this.rulesUpdated = this.entityUpdated.pipe(
      map((config) => migrateLegacySectionKeys(config.data)),
    );
    this.rulesUpdated
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rules) => {
        this.currentRules = rules;
        // includes a deletion of the config (empty entity): that the rules are
        // gone is a known state, unlike a failed load
        this.rulesKnown = true;
      });
  }

  async initializeRules() {
    let initialPermissions: Config<DatabaseRules> | undefined;
    try {
      initialPermissions = await super.startLoading();
      // loaded, or confirmed to not exist (404)
      this.rulesKnown = true;
    } catch (err) {
      this.logRulesLoadFailure(err);
    }

    if (initialPermissions) {
      await this.updateAbilityWithUserRules(
        migrateLegacySectionKeys(initialPermissions.data),
      );
    } else if (this.rulesKnown) {
      // no permission object is defined for this instance: allow everything
      this.ability.update([{ action: "manage", subject: "all" }]);
      this.ability.initialized = true;
    } else {
      this.applyLastKnownRules();
    }

    merge(
      this.rulesUpdated,
      this.sessionInfo.pipe(map(() => this.currentRules)),
      this.currentUser.pipe(map(() => this.currentRules)),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rules) => {
        if (this.rulesKnown) {
          this.updateAbilityWithUserRules(rules);
        } else {
          // While the rules are unknown, a session or user change must not
          // re-derive the permissive fallback and hand it to the enforcer: that
          // would store "allowed everything" as the baseline for future
          // comparisons, so the real rules arriving afterwards look like a
          // permission change and trigger a full re-sync (or, on the legacy
          // adapter, destroy the local database).
          this.applyLastKnownRules();
        }
      });
  }

  /**
   * Apply the rules of the previous session, while the actual rules could not
   * be loaded (e.g. the server was unreachable).
   *
   * Falling through to "allow everything" here would grant full client-side
   * permissions on a transient failure - at the moment the app is least able to
   * notice. Re-using the rules that were last successfully applied for this user
   * keeps the app usable without escalating access.
   * If there are none (first session on this device) the permissive fallback
   * still applies, so that instances which intentionally define no permissions
   * keep working.
   */
  private applyLastKnownRules() {
    const lastKnownRules = this.permissionEnforcer.getLastEnforcedRules();
    if (lastKnownRules) {
      Logging.debug("Applying permission rules of the previous session");
    }

    // stored rules are already interpolated, so they are applied as they are
    this.ability.update(
      lastKnownRules ?? [{ action: "manage", subject: "all" }],
    );
    this.ability.initialized = true;
  }

  /**
   * Report a failed load of the permission rules, unless the failure is an
   * expected part of normal operation:
   *
   * - 401/403: the session may not read the rules config. Anonymous visitors of
   *   a public form never can, and an expired session is already handled by the
   *   database layer (which triggers re-login).
   * - connectivity: offline, a request timeout or a 5xx from the server.
   *
   * Both are transient or by design and would otherwise drown out the failures
   * that do indicate a problem.
   */
  private logRulesLoadFailure(err: any) {
    const status = err?.status ?? err?.statusCode;
    if (
      status === HttpStatusCode.Unauthorized ||
      status === HttpStatusCode.Forbidden
    ) {
      Logging.debug("Permission rules not readable for this session", err);
      return;
    }
    if (isConnectivityError(err)) {
      Logging.debug("Could not load permission rules (connectivity)", err);
      return;
    }

    const error = new Error("Failed to load permission rules", { cause: err });
    error.name = "PermissionRulesLoadError";
    Logging.error(error);
  }

  private async updateAbilityWithUserRules(rules: DatabaseRules): Promise<any> {
    // If rules object is empty, everything is allowed
    const rawUserRules: DatabaseRule[] = rules
      ? this.getRulesForUser(rules)
      : [{ action: "manage", subject: "all" }];

    const userRules: DatabaseRule[] =
      await this.interpolateUserVariables(rawUserRules);

    this.ability.update(userRules);
    this.ability.initialized = true;
    return this.permissionEnforcer.enforcePermissionsOnLocalData(userRules);
  }

  private getRulesForUser(rules: DatabaseRules): DatabaseRule[] {
    const sessionInfo = this.sessionInfo.value;
    if (!sessionInfo) {
      return rules[PUBLIC_SECTION_KEY] ?? [];
    }

    const rawUserRules: DatabaseRule[] = [];
    const defaultRules = rules[DEFAULT_SECTION_KEY];
    if (defaultRules) {
      rawUserRules.push(...defaultRules);
    }
    sessionInfo.roles.forEach((role) => {
      // reserved section keys and underscore-prefixed names never resolve as roles
      if (isReservedRuleConfigKey(role)) {
        return;
      }
      const rulesForRole = rules[role] || [];
      rawUserRules.push(...rulesForRole);
    });

    if (rawUserRules.length === 0 && sessionInfo) {
      // No rules or only default rules defined
      Logging.warn("No permission rules found for user", {
        roles: sessionInfo.roles,
      });
    }

    return rawUserRules;
  }

  private async interpolateUserVariables(
    rules: DatabaseRule[],
  ): Promise<DatabaseRule[]> {
    const sessionInfo: SessionInfo = this.sessionInfo.value;
    if (!sessionInfo) {
      // for unauthenticated users, no user variables are available and interpolated
      return rules;
    }

    const user = await firstValueFrom(
      // only emit once user entity is loaded (or "null" for user account without entity)
      this.currentUser.pipe(filter((x) => x !== undefined)),
    );
    if (user && user["projects"]) {
      sessionInfo.projects = user["projects"];
    } else {
      sessionInfo.projects = [];
    }

    const dynamicPlaceholders = {
      user: sessionInfo,
    };
    return JSON.parse(JSON.stringify(rules), (_that, rawValue) => {
      if (rawValue[0] !== "$") {
        return rawValue;
      }

      let name = rawValue.slice(2, -1); // extract name from "${name}"
      if (name === "user.name") {
        // the user account related entity (assured with prefix) is now stored in user.entityId
        // mapping the previously valid ${user.name} here for backwards compatibility
        name = "user.entityId";
      }

      if (!has(dynamicPlaceholders, name)) {
        // log instead of silent failure
        Logging.warn("Rule variable is not defined for user", {
          variable: name,
        });
        return AbilityService.USER_PROPERTY_UNDEFINED;
      }

      const value = get(dynamicPlaceholders, name);
      if (typeof value === "undefined") {
        Logging.debug("[AbilityService] Variable not defined:", name);
        return AbilityService.USER_PROPERTY_UNDEFINED;
      }

      return value;
    }) as DatabaseRule[];
  }
}
