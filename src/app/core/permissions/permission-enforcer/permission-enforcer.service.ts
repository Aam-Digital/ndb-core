import { Injectable, inject } from "@angular/core";
import { DatabaseRule } from "../permission-types";
import { EntityConstructor } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { AnalyticsService } from "../../analytics/analytics.service";
import { EntityAbility } from "../ability/entity-ability";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { ConfigService } from "../../config/config.service";
import { firstValueFrom } from "rxjs";
import { SessionSubject } from "../../session/auth/session-info";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { Logging } from "../../logging/logging.service";

/**
 * This service checks whether the relevant rules for the current user changed.
 * If it detects a change, all Entity types that have read restrictions are collected.
 * All entities of these entity types are loaded and checked whether the currently logged-in user has read permissions.
 * If one entity is found for which the user does **not** have read permissions, then the local database is destroyed and a new sync has to start.
 */
@Injectable({ providedIn: "root" })
export class PermissionEnforcerService {
  private sessionInfo = inject(SessionSubject);
  private ability = inject(EntityAbility);
  private entityMapper = inject(EntityMapperService);
  private dbResolver = inject(DatabaseResolverService);
  private analyticsService = inject(AnalyticsService);
  private entities = inject(EntityRegistry);
  private location = inject<Location>(LOCATION_TOKEN);
  private configService = inject(ConfigService);

  /**
   * This is a suffix used to persist the user-relevant rules in local storage to later check for changes.
   */
  static readonly LOCALSTORAGE_KEY = "RULES";

  async enforcePermissionsOnLocalData(
    userRules: DatabaseRule[],
  ): Promise<void> {
    Logging.debug(
      "Checking for updated permissions [PermissionEnforcerService]",
    );

    const userRulesString = JSON.stringify(userRules);
    if (!this.sessionInfo.value || !this.userRulesChanged(userRulesString)) {
      return;
    }

    Logging.debug("Detected changed permissions for user. Resetting sync ...");

    const subjects = this.getSubjectsWithReadRestrictions(userRules);
    if (await this.dbHasEntitiesWithoutPermissions(subjects)) {
      Logging.debug("destroying local db due to lost permissions");
      this.analyticsService.eventTrack(
        "destroying local db due to lost permissions",
        { category: "Migration" },
      );
      // TODO: is it enough to destroy the default DB or could other DBs also be affected?
      await this.dbResolver.destroyDatabases();
      this.location.reload();
    } else {
      // Rules changed but no lost permissions — the user may have gained access to new data.
      // Clear sync checkpoints to force a full re-check on the next sync.
      await this.dbResolver.resetSync();
    }

    // update stored rules to check for future changes
    window.localStorage.setItem(this.getUserStorageKey(), userRulesString);
  }

  private userRulesChanged(newRules: string): boolean {
    const storedRules = window.localStorage.getItem(this.getUserStorageKey());
    return storedRules !== newRules;
  }

  private getUserStorageKey() {
    return `${this.sessionInfo.value.id}-${PermissionEnforcerService.LOCALSTORAGE_KEY}`;
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
