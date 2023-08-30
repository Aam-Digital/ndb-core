import { Injectable } from "@angular/core";
import { filter } from "rxjs/operators";
import { Observable, Subject } from "rxjs";
import { DatabaseRule, DatabaseRules } from "../permission-types";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { PermissionEnforcerService } from "../permission-enforcer/permission-enforcer.service";
import { EntityAbility } from "./entity-ability";
import { Config } from "../../config/config";
import { LoggingService } from "../../logging/logging.service";
import { get } from "lodash-es";
import { AuthUser } from "../../session/session-service/auth-user";
import { UserService } from "../../user/user.service";

/**
 * This service sets up the `EntityAbility` injectable with the JSON defined rules for the currently logged in user.
 */
@Injectable()
export class AbilityService {
  private _abilityUpdated = new Subject<void>();

  /**
   * Get notified whenever the permissions of the current user are updated.
   * Use this to re-evaluate the permissions of the currently logged-in user.
   */
  get abilityUpdated(): Observable<void> {
    return this._abilityUpdated.asObservable();
  }

  constructor(
    private ability: EntityAbility,
    private userService: UserService,
    private entityMapper: EntityMapperService,
    private permissionEnforcer: PermissionEnforcerService,
    private logger: LoggingService,
  ) {}

  initializeRules() {
    // TODO this setup is very similar to `ConfigService`
    this.loadRules();
    this.entityMapper
      .receiveUpdates<Config<DatabaseRules>>(Config)
      .pipe(filter(({ entity }) => entity.getId() === Config.PERMISSION_KEY))
      .subscribe(({ entity }) => this.updateAbilityWithUserRules(entity.data));
  }

  private loadRules(): Promise<void> {
    // Initially allow everything until permission document could be fetched
    // TODO somehow this rules is used if no other is found even after update
    this.ability.update([{ action: "manage", subject: "all" }]);
    return this.entityMapper
      .load<Config<DatabaseRules>>(Config, Config.PERMISSION_KEY)
      .then((config) => this.updateAbilityWithUserRules(config.data))
      .catch(() => undefined);
  }

  private updateAbilityWithUserRules(rules: DatabaseRules): Promise<any> {
    const userRules = this.getRulesForUser(rules);
    if (userRules.length === 0) {
      // No rules or only default rules defined
      const user = this.userService.getCurrentUser();
      this.logger.warn(
        `no rules found for user "${user?.name}" with roles "${user?.roles}"`,
      );
    }
    this.updateAbilityWithRules(userRules);
    return this.permissionEnforcer.enforcePermissionsOnLocalData(userRules);
  }

  private getRulesForUser(rules: DatabaseRules): DatabaseRule[] {
    const currentUser = this.userService.getCurrentUser();
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

  private updateAbilityWithRules(rules: DatabaseRule[]) {
    this.ability.update(rules);
    this._abilityUpdated.next();
  }
}
