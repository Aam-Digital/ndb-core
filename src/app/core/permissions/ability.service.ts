import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../entity/model/entity";
import { SessionService } from "../session/session-service/session.service";
import { DynamicEntityService } from "../entity/dynamic-entity.service";
import { filter } from "rxjs/operators";
import { SyncState } from "../session/session-states/sync-state.enum";
import { merge, Observable, Subject } from "rxjs";
import {
  DatabaseRule,
  DatabaseRules,
  EntityAbility,
  EntityRule,
} from "./permission-types";
import { LoginState } from "../session/session-states/login-state.enum";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Permission } from "./permission";
import { PermissionEnforcerService } from "./permission-enforcer.service";

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
  private _abilityUpdateNotifier = new Subject<void>();

  get abilityUpdateNotifier(): Observable<void> {
    return this._abilityUpdateNotifier.asObservable();
  }

  constructor(
    private ability: EntityAbility,
    private sessionService: SessionService,
    private dynamicEntityService: DynamicEntityService,
    private entityMapper: EntityMapperService,
    private permissionEnforcer: PermissionEnforcerService
  ) {
    merge(
      this.sessionService.loginState.pipe(
        filter((state) => state === LoginState.LOGGED_IN)
      ),
      this.sessionService.syncState.pipe(
        filter((state) => state === SyncState.COMPLETED)
      )
    ).subscribe(() => this.initRules());
  }

  private async initRules(): Promise<void> {
    // Initially allow everything until rules object can be fetched
    this.ability.update([{ action: "manage", subject: "all" }]);

    let permission: Permission;
    try {
      permission = await this.entityMapper.load(
        Permission,
        Permission.PERMISSION_KEY
      );
    } catch (e) {
      // If no rule is found, keep allowing everything
      return;
    }
    if (permission) {
      // TODO what happens if there are no rules for a user
      const userRules = this.getRulesForUser(permission.rulesConfig);
      const userRulesCopy = JSON.parse(JSON.stringify(userRules));
      this.updateAbilityWithRules(userRules);
      await this.permissionEnforcer.enforcePermissionsOnLocalData(
        userRulesCopy
      );
    }
  }

  private getRulesForUser(rules: DatabaseRules): DatabaseRule[] {
    const rawUserRules: DatabaseRule[] = [];
    this.sessionService.getCurrentUser().roles.forEach((role) => {
      const rulesForRole = rules[role] || [];
      rawUserRules.push(...rulesForRole);
    });
    return rawUserRules;
  }

  private updateAbilityWithRules(rules: DatabaseRule[]) {
    const userRules: EntityRule[] = rules.map((rawRule) =>
      Object.assign(rawRule, {
        subject: this.parseStringToConstructor(rawRule.subject),
      })
    );
    this.ability.update(userRules);
    this._abilityUpdateNotifier.next();
  }

  private parseStringToConstructor(
    rawSubject: string | string[] | "all"
  ): EntityConstructor<any> | "all" {
    if (typeof rawSubject === "string") {
      if (rawSubject === "all") {
        return "all";
      } else {
        return this.dynamicEntityService.getEntityConstructor(rawSubject);
      }
    } else {
      throw Error("Creating rule for invalid subject " + rawSubject);
    }
  }
}
