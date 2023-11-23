import { Injectable } from "@angular/core";
import { SessionService } from "../../session/session-service/session.service";
import { shareReplay } from "rxjs/operators";
import { DatabaseRule, DatabaseRules } from "../permission-types";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { PermissionEnforcerService } from "../permission-enforcer/permission-enforcer.service";
import { EntityAbility } from "./entity-ability";
import { Config } from "../../config/config";
import { LoggingService } from "../../logging/logging.service";
import { get } from "lodash-es";
import { AuthUser } from "../../session/session-service/auth-user";
import { LatestEntityLoader } from "../../entity/latest-entity-loader";

/**
 * This service sets up the `EntityAbility` injectable with the JSON defined rules for the currently logged in user.
 */
@Injectable()
export class AbilityService extends LatestEntityLoader<Config<DatabaseRules>> {
  /**
   * Get notified whenever the permissions of the current user are updated.
   * Use this to re-evaluate the permissions of the currently logged-in user.
   */
  abilityUpdated = this.entityUpdated.pipe(shareReplay(1));

  constructor(
    private ability: EntityAbility,
    private sessionService: SessionService,
    private permissionEnforcer: PermissionEnforcerService,
    entityMapper: EntityMapperService,
    logger: LoggingService,
  ) {
    super(Config, Config.PERMISSION_KEY, entityMapper, logger);
  }

  initializeRules() {
    // Initially allow everything until permission document could be fetched
    this.ability.update([{ action: "manage", subject: "all" }]);
    super.startLoading();
    this.entityUpdated.subscribe((config) =>
      this.updateAbilityWithUserRules(config.data),
    );
  }

  private updateAbilityWithUserRules(rules: DatabaseRules): Promise<any> {
    // If rules object is empty, everything is allowed
    const userRules: DatabaseRule[] = rules
      ? this.getRulesForUser(rules)
      : [{ action: "manage", subject: "all" }];

    if (userRules.length === 0) {
      // No rules or only default rules defined
      const user = this.sessionService.getCurrentUser();
      this.logger.warn(
        `no rules found for user "${user?.name}" with roles "${user?.roles}"`,
      );
    }
    this.ability.update(userRules);
    return this.permissionEnforcer.enforcePermissionsOnLocalData(userRules);
  }

  private getRulesForUser(rules: DatabaseRules): DatabaseRule[] {
    const currentUser = this.sessionService.getCurrentUser();
    if (!currentUser) {
      return rules.public ?? [];
    }
    const rawUserRules: DatabaseRule[] = [];
    if (rules.default) {
      rawUserRules.push(...rules.default);
    }
    currentUser.roles.forEach((role) => {
      const rulesForRole = rules[role] || [];
      rawUserRules.push(...rulesForRole);
    });
    return this.interpolateUser(rawUserRules, currentUser);
  }

  private interpolateUser(
    rules: DatabaseRule[],
    user: AuthUser,
  ): DatabaseRule[] {
    return JSON.parse(JSON.stringify(rules), (_that, rawValue) => {
      if (rawValue[0] !== "$") {
        return rawValue;
      }

      const name = rawValue.slice(2, -1);
      const value = get({ user }, name);

      if (typeof value === "undefined") {
        throw new ReferenceError(`Variable ${name} is not defined`);
      }

      return value;
    });
  }
}
