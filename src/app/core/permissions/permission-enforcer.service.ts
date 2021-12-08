import { Inject, Injectable } from "@angular/core";
import { DatabaseRule, EntityAbility } from "./permission-types";
import { SessionService } from "../session/session-service/session.service";
import { EntityConstructor } from "../entity/model/entity";
import { DynamicEntityService } from "../entity/dynamic-entity.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Database } from "../database/database";
import { LOCATION_TOKEN } from "../../utils/di-tokens";
import { AnalyticsService } from "../analytics/analytics.service";

@Injectable()
export class PermissionEnforcerService {
  static readonly STORAGE_KEY = "RULES";
  constructor(
    private sessionService: SessionService,
    private dynamicEntityService: DynamicEntityService,
    private ability: EntityAbility,
    private entityMapper: EntityMapperService,
    private database: Database,
    private analyticsService: AnalyticsService,
    @Inject(LOCATION_TOKEN) private location: Location
  ) {}

  async enforcePermissionsOnLocalData(userRules: DatabaseRule[]) {
    const userStorageKey =
      this.sessionService.getCurrentUser().name +
      "-" +
      PermissionEnforcerService.STORAGE_KEY;
    const storedRules = window.localStorage.getItem(userStorageKey);
    const userRulesString = JSON.stringify(userRules);
    if (userRulesString !== storedRules) {
      // TODO maybe only do this with SyncedSession
      const subjects = this.getSubjectsWithReadRestrictions(userRules);
      if (await this.dbHasEntitiesWithoutPermissions(subjects)) {
        this.analyticsService.eventTrack(
          "destroying local db due to lost permissions",
          {
            category: "Migration",
          }
        );
        await this.database.destroy();
        this.location.reload();
      }
    }
    window.localStorage.setItem(userStorageKey, userRulesString);
  }

  private getSubjectsWithReadRestrictions(
    rules: DatabaseRule[]
  ): EntityConstructor[] {
    const subjects = new Set<string>();
    rules.forEach((rule) => {
      if (this.hasReadRestriction(rule)) {
        if (Array.isArray(rule.subject)) {
          rule.subject.forEach((subj) => subjects.add(subj));
        } else {
          subjects.add(rule.subject);
        }
      }
    });
    return [...subjects].map((subj) =>
      this.dynamicEntityService.getEntityConstructor(subj)
    );
  }

  private hasReadRestriction(rule: DatabaseRule): boolean {
    return (
      (rule.action === "read" ||
        rule.action.includes("read") ||
        rule.action === "manage") &&
      rule.inverted === true
    );
  }

  private async dbHasEntitiesWithoutPermissions(
    subjects: EntityConstructor[]
  ): Promise<boolean> {
    for (const subject of subjects) {
      const entities = await this.entityMapper.loadType(subject);
      if (entities.some((entity) => this.ability.cannot("read", entity))) {
        return true;
      }
    }
    return false;
  }
}
