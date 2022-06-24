import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { SessionService } from "../../session/session-service/session.service";
import { filter } from "rxjs/operators";
import { Observable, Subject } from "rxjs";
import { DatabaseRule, DatabaseRules } from "../permission-types";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { PermissionEnforcerService } from "../permission-enforcer/permission-enforcer.service";
import { DatabaseUser } from "../../session/session-service/local-user";
import { EntityAbility } from "./entity-ability";
import { Config } from "../../config/config";
import { LoggingService } from "../../logging/logging.service";
import { get } from "lodash-es";

export function detectEntityType(subject: Entity): EntityConstructor<any> {
  if (subject instanceof Entity) {
    return subject.getConstructor();
  } else {
    // This happens when trying to check permissions on a object that is not a subtype of Entity
    throw Error("Checking rule for invalid subject " + subject);
  }
}

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
    private sessionService: SessionService,
    private entityMapper: EntityMapperService,
    private permissionEnforcer: PermissionEnforcerService,
    private logger: LoggingService
  ) {
    // TODO this setup is very similar to `ConfigService`
    this.initRules();
    this.entityMapper
      .receiveUpdates<Config<DatabaseRules>>(Config)
      .pipe(filter(({ entity }) => entity.getId() === Config.PERMISSION_KEY))
      .subscribe(({ entity }) => this.updateAbilityWithUserRules(entity.data));
  }

  private initRules(): Promise<void> {
    // Initially allow everything until permission document could be fetched
    this.ability.update([{ action: "manage", subject: "all" }]);
    return this.entityMapper
      .load<Config<DatabaseRules>>(Config, Config.PERMISSION_KEY)
      .then((config) => this.updateAbilityWithUserRules(config.data))
      .catch(() => undefined);
  }

  private updateAbilityWithUserRules(rules: DatabaseRules): Promise<any> {
    const userRules = this.getRulesForUser(rules);
    if (userRules.length === 0 || userRules.length === rules.default?.length) {
      // No rules or only default rules defined
      const { name, roles } = this.sessionService.getCurrentUser();
      this.logger.warn(
        `no rules found for user "${name}" with roles "${roles}"`
      );
    }
    this.updateAbilityWithRules(userRules);
    return this.permissionEnforcer.enforcePermissionsOnLocalData(userRules);
  }

  private getRulesForUser(rules: DatabaseRules): DatabaseRule[] {
    const rawUserRules: DatabaseRule[] = [];
    if (rules.default) {
      rawUserRules.push(...rules.default);
    }
    const currentUser = this.sessionService.getCurrentUser();
    currentUser.roles.forEach((role) => {
      const rulesForRole = rules[role] || [];
      rawUserRules.push(...rulesForRole);
    });
    return this.interpolateUser(rawUserRules, currentUser);
  }

  private interpolateUser(
    rules: DatabaseRule[],
    user: DatabaseUser
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
