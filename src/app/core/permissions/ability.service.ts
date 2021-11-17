import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../app-config/app-config";
import { Ability, AbilityClass, InferSubjects, RawRuleOf } from "@casl/ability";
import { Entity, EntityConstructor } from "../entity/model/entity";
import { SessionService } from "../session/session-service/session.service";
import { DynamicEntityService } from "../entity/dynamic-entity.service";
import { catchError, mergeMap } from "rxjs/operators";
import { waitForChangeTo } from "../session/session-states/session-utils";
import { SyncState } from "../session/session-states/sync-state.enum";
import { Observable } from "rxjs";

const actions = [
  "read",
  "create",
  "update",
  "delete",
  "manage", // Matches any actions
] as const;

// TODO explain types in comments
export type EntityAction = typeof actions[number];
export type EntitySubject = InferSubjects<typeof Entity> | "all";
export type EntityAbility = Ability<[EntityAction, EntitySubject]>;
export type EntityRule = RawRuleOf<EntityAbility>;
export const EntityAbility = Ability as AbilityClass<EntityAbility>;
type DatabaseRule = RawRuleOf<Ability<[EntityAction, string]>>;
export type DatabaseRules = { [key in string]: DatabaseRule[] };

export function detectEntityType(subject: Entity): EntityConstructor<any> {
  if (subject instanceof Entity) {
    return subject.getConstructor();
  } else {
    // This happens when trying to check permissions on a object that is not a subtype of Entity
    throw Error("Checking rule for invalid subject " + subject);
  }
}

@Injectable()
export class AbilityService {
  constructor(
    private httpClient: HttpClient,
    private ability: EntityAbility,
    private sessionService: SessionService,
    private dynamicEntityService: DynamicEntityService
  ) {}

  async initRules() {
    // TODO make this optional, in case no `/rules` endpoint exists, give all permission
    const rules = await this.fetchRules()
      .pipe(
        catchError(() =>
          this.sessionService.syncState.pipe(
            waitForChangeTo(SyncState.STARTED),
            mergeMap(() => this.fetchRules())
          )
        )
      )
      .toPromise();
    this.updateAbilityWithRules(rules);
  }

  private fetchRules(): Observable<DatabaseRules> {
    const rulesUrl = AppConfig.settings.database.remote_url + "rules";
    return this.httpClient.get<DatabaseRules>(rulesUrl, {
      withCredentials: true,
    });
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
