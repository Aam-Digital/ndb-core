import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { Entity } from "../../core/entity/entity";
import { Child } from "../children/model/child";
import { School } from "../schools/model/school";
import { Note } from "../notes/model/note";
import { RecurringActivity } from "../attendance/model/recurring-activity";
import { EventNote } from "../attendance/model/event-note";

export interface PropertyQuery {
  [key: string]: any;
}

@Injectable({
  providedIn: "root",
})
export class AggregationService {
  private static readonly ENTITY_CLASSES: typeof Entity[] = [
    Child,
    School,
    RecurringActivity,
    Note,
    EventNote,
  ];

  private entities = new Map<typeof Entity, Entity[]>();
  private dataLoaded: Promise<any>;
  constructor(private entityMapper: EntityMapperService) {}

  public loadData(): void {
    this.dataLoaded = Promise.all(
      AggregationService.ENTITY_CLASSES.map((entityClass) =>
        this.entityMapper
          .loadType(entityClass)
          .then((entities) => this.entities.set(entityClass, entities))
      )
    ).then(() => this.resolveRelations());
  }

  private resolveRelations() {
    const schoolMap = new Map(
      this.entities
        .get(School)
        .map((school) => [school.getId(), school as School])
    );
    this.entities
      .get(RecurringActivity)
      .forEach((activity: RecurringActivity) =>
        this.addSchoolToActivity(activity, schoolMap)
      );
    const activityMap = new Map(
      this.entities
        .get(RecurringActivity)
        .map((activity) => [activity._id, activity as RecurringActivity])
    );
    this.entities.get(EventNote).forEach((event: EventNote) => {
      this.addActivityToEvent(event, activityMap);
    });
  }

  private addSchoolToActivity(
    activity: RecurringActivity,
    schoolMap: Map<string, School>
  ) {
    if (
      activity.linkedGroups &&
      activity.linkedGroups.length === 1 &&
      schoolMap.has(activity.linkedGroups[0])
    ) {
      activity[School.ENTITY_TYPE] = schoolMap.get(activity.linkedGroups[0]);
    }
  }

  private addActivityToEvent(
    event: EventNote,
    activityMap: Map<string, RecurringActivity>
  ) {
    if (event.relatesTo && activityMap.has(event.relatesTo)) {
      event[RecurringActivity.ENTITY_TYPE] = activityMap.get(event.relatesTo);
    }
  }

  public async countEntitiesByProperties(
    entityClass: typeof Entity,
    propertyQuery: PropertyQuery
  ): Promise<number> {
    await this.dataLoaded;
    let count = 0;
    for (const entity of this.entities.get(entityClass)) {
      if (this.entitySatisfiesQuery(entity, propertyQuery)) {
        count++;
      }
    }
    return count;
  }

  private entitySatisfiesQuery(
    entity: Entity,
    propertyQuery: PropertyQuery
  ): boolean {
    const entityTypes = AggregationService.ENTITY_CLASSES.map(
      (type) => type.ENTITY_TYPE
    );
    return Object.keys(propertyQuery).every((key) => {
      if (entity[key] && entityTypes.includes(key)) {
        return this.entitySatisfiesQuery(entity[key], propertyQuery[key]);
      } else if (typeof propertyQuery[key] === "object") {
        return this.evaluateObjectQuery(entity, key, propertyQuery[key]);
      } else {
        return entity[key] === propertyQuery[key];
      }
    });
  }

  private evaluateObjectQuery(
    entity: Entity,
    key: string,
    query: any
  ): boolean {
    return Object.keys(query).every((check) => {
      switch (check) {
        case "gte":
          return entity[key] >= query[check];
        case "not":
          const notQuery = {};
          notQuery[key] = query[check];
          return !this.entitySatisfiesQuery(entity, notQuery);
        default:
          return false;
      }
    });
  }
}
