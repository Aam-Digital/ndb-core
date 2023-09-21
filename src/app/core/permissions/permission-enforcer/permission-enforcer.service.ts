import { Inject, Injectable } from "@angular/core";
import { DatabaseRule } from "../permission-types";
import { EntityConstructor } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Database } from "../../database/database";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { AnalyticsService } from "../../analytics/analytics.service";
import { EntityAbility } from "../ability/entity-ability";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { ConfigService } from "../../config/config.service";
import { firstValueFrom } from "rxjs";
import { UserSubject } from "../../user/user";

/**
 * This service checks whether the relevant rules for the current user changed.
 * If it detects a change, all Entity types that have read restrictions are collected.
 * All entities of these entity types are loaded and checked whether the currently logged-in user has read permissions.
 * If one entity is found for which the user does **not** have read permissions, then the local database is destroyed and a new sync has to start.
 */
@Injectable({ providedIn: "root" })
export class PermissionEnforcerService {
  /**
   * This is a suffix used to persist the user-relevant rules in local storage to later check for changes.
   */
  static readonly LOCALSTORAGE_KEY = "RULES";

  constructor(
    private userSubject: UserSubject,
    private ability: EntityAbility,
    private entityMapper: EntityMapperService,
    private database: Database,
    private analyticsService: AnalyticsService,
    private entities: EntityRegistry,
    @Inject(LOCATION_TOKEN) private location: Location,
    private configService: ConfigService,
  ) {}

  async enforcePermissionsOnLocalData(userRules: DatabaseRule[]) {
    const userRulesString = JSON.stringify(userRules);
    if (!this.userRulesChanged(userRulesString)) {
      return;
    }
    const subjects = this.getSubjectsWithReadRestrictions(userRules);
    if (await this.dbHasEntitiesWithoutPermissions(subjects)) {
      this.analyticsService.eventTrack(
        "destroying local db due to lost permissions",
        { category: "Migration" },
      );
      await this.database.destroy();
      this.location.reload();
    }
    window.localStorage.setItem(this.getUserStorageKey(), userRulesString);
  }

  private userRulesChanged(newRules: string): boolean {
    const storedRules = window.localStorage.getItem(this.getUserStorageKey());
    return storedRules !== newRules;
  }

  private getUserStorageKey() {
    return `${this.userSubject.value.name}-${PermissionEnforcerService.LOCALSTORAGE_KEY}`;
  }

  private getSubjectsWithReadRestrictions(
    rules: DatabaseRule[],
  ): EntityConstructor[] {
    const subjects = new Set<string>(this.entities.keys());
    rules
      .filter((rule) => this.isReadRule(rule))
      .forEach((rule) => this.collectSubjectsFromRule(rule, subjects));
    return [...subjects].map((subj) => this.entities.get(subj));
  }

  private collectSubjectsFromRule(rule: DatabaseRule, subjects: Set<string>) {
    const relevantSubjects = this.getRelevantSubjects(rule);
    if (rule.inverted || rule.conditions) {
      // Add subject if the rule can prevent someone from having access
      relevantSubjects.forEach((subject) => subjects.add(subject));
    } else {
      // Remove subject if rule gives access
      relevantSubjects.forEach((subject) => subjects.delete(subject));
    }
  }

  private isReadRule(rule: DatabaseRule): boolean {
    return (
      rule.action === "read" ||
      rule.action.includes("read") ||
      rule.action === "manage"
    );
  }

  private getRelevantSubjects(rule: DatabaseRule): string[] {
    let subjects: string[];
    if (rule.subject === "all") {
      subjects = [...this.entities.keys()];
    } else if (Array.isArray(rule.subject)) {
      subjects = rule.subject;
    } else {
      subjects = [rule.subject];
    }
    // Only return valid entities
    return subjects.filter((sub) => this.entities.has(sub));
  }

  private async dbHasEntitiesWithoutPermissions(
    subjects: EntityConstructor[],
  ): Promise<boolean> {
    // wait for config service to be ready before using the entity mapper
    await firstValueFrom(this.configService.configUpdates);
    for (const subject of subjects) {
      const entities = await this.entityMapper.loadType(subject);
      if (entities.some((entity) => this.ability.cannot("read", entity))) {
        return true;
      }
    }
    return false;
  }
}
