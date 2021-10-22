import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../app-config/app-config";
import { Ability, AbilityClass, InferSubjects, RawRuleOf } from "@casl/ability";
import { Entity, EntityConstructor } from "../entity/model/entity";
import { SessionService } from "../session/session-service/session.service";

const actions = [
  "read",
  "write", // Could be replaced with more granular distinction (create,update,delete)
  "manage", // Matches any actions
] as const;

type Actions = typeof actions[number];
type Subjects = InferSubjects<typeof Entity> | string;
export type EntityAbility = Ability<[Actions, Subjects]>;
export type EntityRule = RawRuleOf<EntityAbility>;
export type DatabaseRules = { [key in string]: EntityRule[] };
export const EntityAbility = Ability as AbilityClass<EntityAbility>;

export function detectSubjectType(
  subject: Entity | EntityConstructor<any> | string
): string {
  console.log("subject", subject);
  if (subject instanceof Entity) {
    console.log("entity", subject);
    return subject.getType();
  } else if (subject.hasOwnProperty("ENTITY_TYPE")) {
    console.log("constr", subject);
    return (subject as EntityConstructor<any>).ENTITY_TYPE;
  } else {
    console.log("other");
    return subject as string;
  }
}

@Injectable({
  providedIn: "root",
})
export class AbilityService {
  constructor(
    private httpClient: HttpClient,
    private ability: EntityAbility,
    private sessionService: SessionService
  ) {}

  initRules() {
    this.httpClient
      .get<DatabaseRules>(`${AppConfig.settings.database.remote_url}rules`, {
        withCredentials: true,
      })
      .subscribe((rules) => this.updateAbilityWithRules(rules));
  }

  private updateAbilityWithRules(rules: DatabaseRules) {
    const userRules: EntityRule[] = [];
    this.sessionService.getCurrentUser().roles.forEach((role) => {
      const rulesForRole = rules[role] || [];
      userRules.push(...rulesForRole);
    });
    this.ability.update(userRules);
  }
}
