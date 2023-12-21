import { Injectable } from "@angular/core";
import { DatabaseRule, DatabaseRules } from "../permission-types";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { PermissionEnforcerService } from "../permission-enforcer/permission-enforcer.service";
import { EntityAbility } from "./entity-ability";
import { Config } from "../../config/config";
import { LoggingService } from "../../logging/logging.service";
import { get } from "lodash-es";
import { LatestEntityLoader } from "../../entity/latest-entity-loader";
import { SessionInfo, SessionSubject } from "../../session/auth/session-info";

/**
 * This service sets up the `EntityAbility` injectable with the JSON defined rules for the currently logged in user.
 *
 * To get notified whenever the permissions of the current user are updated, use EntityAbility.on("updated", callback):
 * https://casl.js.org/v6/en/api/casl-ability#on
 */
@Injectable()
export class AbilityService extends LatestEntityLoader<Config<DatabaseRules>> {
  constructor(
    private ability: EntityAbility,
    private sessionInfo: SessionSubject,
    private permissionEnforcer: PermissionEnforcerService,
    entityMapper: EntityMapperService,
    logger: LoggingService,
  ) {
    super(Config, Config.PERMISSION_KEY, entityMapper, logger);
  }

  async initializeRules() {
    const initialPermissions = await super.startLoading();
    if (initialPermissions) {
      await this.updateAbilityWithUserRules(initialPermissions.data);
    } else {
      // as default fallback if no permission object is defined: allow everything
      this.ability.update([{ action: "manage", subject: "all" }]);
    }

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
      const user = this.sessionInfo.value;
      this.logger.warn(
        `no rules found for user "${user?.name}" with roles "${user?.roles}"`,
      );
    }
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
    return this.interpolateUser(rawUserRules, sessionInfo);
  }

  private interpolateUser(
    rules: DatabaseRule[],
    user: SessionInfo,
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
