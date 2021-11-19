import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../app-config/app-config";
import { Entity, EntityConstructor } from "../entity/model/entity";
import { SessionService } from "../session/session-service/session.service";
import { DynamicEntityService } from "../entity/dynamic-entity.service";
import { catchError, filter, mergeMap } from "rxjs/operators";
import { waitForChangeTo } from "../session/session-states/session-utils";
import { SyncState } from "../session/session-states/sync-state.enum";
import { Observable, Subject } from "rxjs";
import {
  DatabaseRule,
  DatabaseRules,
  EntityAbility,
  EntityRule,
} from "./permission-types";
import { LoginState } from "../session/session-states/login-state.enum";

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
    private httpClient: HttpClient,
    private ability: EntityAbility,
    private sessionService: SessionService,
    private dynamicEntityService: DynamicEntityService
  ) {
    this.sessionService.loginState
      .pipe(filter((state) => state === LoginState.LOGGED_IN))
      .subscribe(() => this.initRules());
  }

  private async initRules(): Promise<void> {
    this.ability.update([{ action: "manage", subject: "all" }]);
    let rules: DatabaseRules;
    try {
      rules = await this.fetchRules()
        .pipe(catchError(() => this.retryAfterSync()))
        .toPromise();
    } catch (e) {
      // If no rule is found, allow everything
      return;
    }
    this.updateAbilityWithRules(rules);
  }

  private fetchRules(): Observable<DatabaseRules> {
    const rulesUrl = AppConfig.settings.database.remote_url + "rules";
    return this.httpClient.get<DatabaseRules>(rulesUrl, {
      withCredentials: true,
    });
  }

  private retryAfterSync(): Observable<DatabaseRules> {
    return this.sessionService.syncState.pipe(
      waitForChangeTo(SyncState.STARTED),
      mergeMap(() => this.fetchRules())
    );
  }

  private updateAbilityWithRules(rules: DatabaseRules) {
    const rawUserRules: DatabaseRule[] = [];
    this.sessionService.getCurrentUser().roles.forEach((role) => {
      const rulesForRole = rules[role] || [];
      rawUserRules.push(...rulesForRole);
    });
    const userRules: EntityRule[] = rawUserRules.map((rawRule) =>
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
      throw Error("Creating rule for invalid subject" + rawSubject);
    }
  }
}
