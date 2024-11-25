import { Injectable } from "@angular/core";
import { DatabaseRule, DatabaseRules } from "../permission-types";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { PermissionEnforcerService } from "../permission-enforcer/permission-enforcer.service";
import { EntityAbility } from "./entity-ability";
import { Config } from "../../config/config";
import { Logging } from "../../logging/logging.service";
import { get } from "lodash-es";
import { LatestEntityLoader } from "../../entity/latest-entity-loader";
import { SessionInfo, SessionSubject } from "../../session/auth/session-info";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { filter, firstValueFrom, merge } from "rxjs";
import { map } from "rxjs/operators";

/**
 * This service sets up the `EntityAbility` injectable with the JSON defined rules for the currently logged in user.
 *
 * To get notified whenever the permissions of the current user are updated, use EntityAbility.on("updated", callback):
 * https://casl.js.org/v6/en/api/casl-ability#on
 */
@Injectable()
export class AbilityService extends LatestEntityLoader<Config<DatabaseRules>> {
  private currentRules: DatabaseRules;

  constructor(
    private ability: EntityAbility,
    private sessionInfo: SessionSubject,
    private currentUser: CurrentUserSubject,
    private permissionEnforcer: PermissionEnforcerService,
    entityMapper: EntityMapperService,
  ) {
    super(Config, Config.PERMISSION_KEY, entityMapper);

    this.entityUpdated.subscribe((config) => (this.currentRules = config.data));
  }

  async initializeRules() {
    const initialPermissions = await super.startLoading();
    if (initialPermissions) {
      await this.updateAbilityWithUserRules(initialPermissions.data);
    } else {
      // as default fallback if no permission object is defined: allow everything
      this.ability.update([{ action: "manage", subject: "all" }]);
    }

    merge(
      this.entityUpdated.pipe(map((config) => config.data)),
      this.sessionInfo.pipe(map(() => this.currentRules)),
      this.currentUser.pipe(map(() => this.currentRules)),
    ).subscribe((rules) => this.updateAbilityWithUserRules(rules));
  }

  private async updateAbilityWithUserRules(rules: DatabaseRules): Promise<any> {
    // If rules object is empty, everything is allowed
    const rawUserRules: DatabaseRule[] = rules
      ? this.getRulesForUser(rules)
      : [{ action: "manage", subject: "all" }];

    const userRules: DatabaseRule[] =
      await this.interpolateUserVariables(rawUserRules);

    this.ability.update(userRules);
    return this.permissionEnforcer.enforcePermissionsOnLocalData(userRules);
  }

  private getRulesForUser(rules: DatabaseRules): DatabaseRule[] {
    const sessionInfo = this.sessionInfo.value;
    if (!sessionInfo) {
      return rules.public ?? [];
    }

    const rawUserRules: DatabaseRule[] = [];
    if (rules.default) {
      rawUserRules.push(...rules.default);
    }
    sessionInfo.roles.forEach((role) => {
      const rulesForRole = rules[role] || [];
      rawUserRules.push(...rulesForRole);
    });

    if (rawUserRules.length === 0 && sessionInfo) {
      // No rules or only default rules defined
      Logging.warn(
        `no rules found for user "${sessionInfo.name}" with roles "${sessionInfo.roles}"`,
      );
    }

    return rawUserRules;
  }

  private async interpolateUserVariables(
    rules: DatabaseRule[],
  ): Promise<DatabaseRule[]> {
    const sessionInfo: SessionInfo = this.sessionInfo.value;

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
      const value = get(dynamicPlaceholders, name);

      if (typeof value === "undefined") {
        throw new ReferenceError(`Variable ${name} is not defined`);
      }

      return value;
    }) as DatabaseRule[];
  }
}
