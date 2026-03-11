import { Injectable, inject } from "@angular/core";
import { DatabaseRule } from "../permission-types";
import { Entity, EntityConstructor } from "../../entity/model/entity";
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
 * This service checks whether the relevant rules for the current user changed
 * and reacts accordingly.
 *
 * **`indexeddb` adapter (PouchDB 8+):**
 * Scans locally-cached entities of restricted types and purges any that the
 * current CASL rules deny reading. Immediately updates the UI without a page
 * reload. Also calls `resetSync()` so the next sync cycle can receive a
 * `lostPermissions` list from the replication proxy for any remaining docs
 * that haven't been synced yet.
 *
 * **Legacy `idb` adapter (PouchDB < 8, purge not supported):**
 * Falls back to the classic behaviour — if any inaccessible entity is found
 * locally, calls `destroyDatabases()` + `location.reload()` to force a clean
 * re-sync.
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

    if (this.dbResolver.isIndexedDbAdapterSupported()) {
      // indexeddb adapter: purge inaccessible entities locally first (immediate UI update),
      // then reset sync so the server-side lostPermissions flow also runs.
      Logging.debug(
        "Detected changed permissions for user. Purging inaccessible entities and resetting sync ...",
      );
      this.analyticsService.eventTrack(
        "re-sync triggered due to changed permissions",
        { category: "Migration" },
      );
      const subjects = this.getSubjectsWithReadRestrictions(userRules);
      // First pass: purge immediately so the UI updates without waiting for sync.
      await this.purgeEntitiesWithoutPermissions(subjects);
      // Sync so the server can also process access changes and provide lostPermissions.
      // NOTE: the sync may temporarily re-add entities that were purged above if the
      // concurrent push (user entity change) hasn't been processed by the server yet.
      await this.dbResolver.resetSync();
      // Second pass: purge any entities that were re-synced before the server
      // processed the access change (handles push/pull race condition).
      await this.purgeEntitiesWithoutPermissions(subjects);
    } else {
      // Legacy idb adapter: purge() not available — fall back to destroy + reload when needed.
      const subjects = this.getSubjectsWithReadRestrictions(userRules);
      if (await this.dbHasEntitiesWithoutPermissions(subjects)) {
        Logging.debug(
          "Detected changed permissions for user. Destroying local db due to lost permissions ...",
        );
        this.analyticsService.eventTrack(
          "destroying local db due to lost permissions",
          { category: "Migration" },
        );
        await this.dbResolver.destroyDatabases();
        this.location.reload();
      } else {
        Logging.debug(
          "Detected changed permissions for user. Resetting sync ...",
        );
        await this.dbResolver.resetSync();
      }
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

    return (
      [...subjects]
        .map((subj) => this.entities.get(subj))
        // TODO: there is some problem doing this for NotificationEvents (but those are not relevant for permissions anyway)
        .filter((subj) => !!subj && subj.DATABASE === Entity.DATABASE)
    );
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

  private async purgeEntitiesWithoutPermissions(
    subjects: EntityConstructor[],
  ): Promise<void> {
    // wait for config service to be ready before using the entity mapper
    await firstValueFrom(this.configService.configUpdates);
    for (const subject of subjects) {
      const entities = await this.entityMapper.loadType(subject);
      for (const entity of entities) {
        if (this.ability.cannot("read", entity)) {
          await this.dbResolver.purgeLocalDoc(entity.getId());
          Logging.debug(
            `Purged locally inaccessible entity: ${entity.getId()}`,
          );
        }
      }
    }
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
