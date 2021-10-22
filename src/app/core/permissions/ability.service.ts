import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../app-config/app-config";
import { Ability, AbilityClass, InferSubjects, RawRuleOf } from "@casl/ability";
import { Entity, EntityConstructor } from "../entity/model/entity";
import { SessionService } from "../session/session-service/session.service";
import { DynamicEntityService } from "../entity/dynamic-entity.service";

const actions = [
  "read",
  "write", // Could be replaced with more granular distinction (create,update,delete)
  "manage", // Matches any actions
] as const;

type Actions = typeof actions[number];
type Subjects = InferSubjects<typeof Entity> | "all";
export type EntityAbility = Ability<[Actions, Subjects]>;
export type EntityRule = RawRuleOf<EntityAbility>;
export const EntityAbility = Ability as AbilityClass<EntityAbility>;
export type DatabaseRule = RawRuleOf<Ability<[Actions, string]>>;
export type DatabaseRules = { [key in string]: DatabaseRule[] };

export function detectSubjectType(subject: Entity): EntityConstructor<any> {
  if (subject instanceof Entity) {
    return subject.getConstructor();
  } else {
    // This should never happen because CASL already ensures correct subject types internally
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
    const rules = await this.httpClient
      .get<DatabaseRules>(AppConfig.settings.database.remote_url + "rules", {
        withCredentials: true,
      })
      .toPromise();
    this.updateAbilityWithRules(rules);
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
