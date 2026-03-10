import { Injectable, inject } from "@angular/core";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";

/**
 * @deprecated
 * Group-based participant resolution — loading participants via linked school groups.
 * Use direct `participants` field on activity entities instead.
 */
@Injectable({
  providedIn: "root",
})
export class GroupParticipantResolverService {
  private childrenService = inject(ChildrenService);
  private entityMapper = inject(EntityMapperService);

  /**
   * Load all participant IDs for the given list of group entities (e.g. schools).
   * @deprecated Use direct participants field on activity entities.
   */
  async loadParticipantsOfGroups(
    linkedGroups: string[],
    date: Date,
  ): Promise<string[]> {
    const childIdPromises = linkedGroups.map((groupId) =>
      this.childrenService
        .queryActiveRelationsOf(groupId, date)
        .then((relations) =>
          relations.map((r) => r.childId).filter((id) => !!id),
        ),
    );
    const allParticipants = await Promise.all(childIdPromises);
    return Array.from(new Set([].concat(...allParticipants)));
  }

  /**
   * Resolve all active participants of an activity, expanding linked groups and removing excluded participants.
   * @deprecated Use direct participants field on activity entities.
   */
  async getActiveParticipantsOfActivity(
    activity: {
      participants: string[];
      linkedGroups: string[];
      excludedParticipants: string[];
    },
    date: Date,
  ): Promise<string[]> {
    const schoolParticipants = await this.loadParticipantsOfGroups(
      activity.linkedGroups,
      date,
    );
    return [
      ...new Set(activity.participants.concat(...schoolParticipants)),
    ].filter((p) => !activity.excludedParticipants.includes(p));
  }

  /**
   * Load activities linked to a participant via school group membership.
   * For each configured activity type, loads all entities and filters
   * to those whose `linkedGroups` include any of the participant's active schools.
   *
   * @deprecated Prefer adding participants directly to the activity.
   * @param participantId The entity ID of the participant.
   * @param recurringActivityTypes Activity type constructors to search.
   */
  async getActivitiesForParticipantViaGroups(
    participantId: string,
    recurringActivityTypes: EntityConstructor[],
  ): Promise<Entity[]> {
    const schoolRelations =
      await this.childrenService.queryActiveRelationsOf(participantId);
    const schoolIds = schoolRelations
      .map((r) => r.schoolId)
      .filter((id): id is string => !!id);

    const results = await Promise.all(
      recurringActivityTypes.map(async (activityType) => {
        const all = await this.entityMapper.loadType(activityType);
        return all.filter((a) =>
          (a["linkedGroups"] as string[])?.some((g) => schoolIds.includes(g)),
        );
      }),
    );
    return ([] as Entity[]).concat(...results);
  }

  /**
   * Filter out excluded participants from a participant list.
   *
   * Previously applied automatically in `AttendanceService.createEventForActivity`.
   * Now removed from the service — if you still need this filter, call it explicitly.
   *
   * @deprecated Manage participant membership directly via the `participants` field instead.
   */
  static filterExcludedParticipants(
    participants: string[],
    excludedParticipants: string[],
  ): string[] {
    return participants.filter((p) => !excludedParticipants.includes(p));
  }
}
