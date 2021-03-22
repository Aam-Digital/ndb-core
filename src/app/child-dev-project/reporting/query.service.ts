import { Injectable } from "@angular/core";
import { Entity } from "../../core/entity/entity";
import { Child } from "../children/model/child";
import { School } from "../schools/model/school";
import { RecurringActivity } from "../attendance/model/recurring-activity";
import { Note } from "../notes/model/note";
import { EventNote } from "../attendance/model/event-note";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
const jsonQuery = require("json-query");

/**
 * A query service which uses the json-query library (https://github.com/auditassistant/json-query).
 */
@Injectable({
  providedIn: "root",
})
export class QueryService {
  private static readonly ENTITY_CLASSES: typeof Entity[] = [
    Child,
    School,
    RecurringActivity,
    Note,
    EventNote,
  ];

  private entities: { [type: string]: { [id: string]: Entity } } = {};
  private dataLoaded: Promise<any>;
  constructor(private entityMapper: EntityMapperService) {}

  /**
   * Loads all data objects of the `QueryService.ENTITY_CLASSES` array.
   * The method should only be called once and before a query is used.
   */
  public loadData(): void {
    this.dataLoaded = Promise.all(
      QueryService.ENTITY_CLASSES.map((entityClass) =>
        this.entityMapper.loadType(entityClass).then((loadedEntities) => {
          this.entities[entityClass.ENTITY_TYPE] = {};
          loadedEntities.forEach(
            (entity) =>
              (this.entities[entityClass.ENTITY_TYPE][entity._id] = entity)
          );
        })
      )
    );
  }

  /**
   * Adds the prefix and a colon (":") to each string in a array. Does nothing if the string already starts with the prefix.
   * @param ids a string of ids
   * @param prefix the prefix which should be added to the string
   * @returns a list where every string has the prefix
   */
  addPrefix(ids: string[], prefix: string): string[] {
    return ids.map((id) => (id.startsWith(prefix) ? id : prefix + ":" + id));
  }

  /**
   * Creates an array containing the value of each key of the object.
   * e.g. `{a: 1, b: 2} => [1,2]`
   * This should be used when iterating over all documents of a given entity type because they are stored as
   * `"{entity._id}": {entity}`
   * @param obj the object which should be transformed to an array
   * @returns the values of the input object as a list
   */
  toArray(obj): any[] {
    return Object.values(obj);
  }

  /**
   * Returns a copy of the input array without duplicates
   * @param data the array where duplicates should be removed
   * @returns a list without duplicates
   */
  unique(data: any[]): any[] {
    return new Array(...new Set(data));
  }

  /**
   * Turns a list of ids (with the entity prefix) into a list of entities
   * @param ids the array of ids with entity prefix
   * @returns a list of entity objects
   */
  toEntities(ids: string[]): Entity[] {
    return ids.map((id) => {
      const prefix = id.split(":")[0];
      return this.entities[prefix][id];
    });
  }

  /**
   * Returns all entities which reference a entity from the passed list of entities (by their id)
   * @param srcEntities the entities for which relations should be found
   * @param entityType the type of entities where relations should be looked for
   * @param relationKey the name of the attribute that holds the reference.
   *                    The attribute can be a string or a list of strings
   * @returns a list of the related entities
   */
  getRelated(
    srcEntities: Entity[],
    entityType: string,
    relationKey: string
  ): Entity[] {
    const targetEntities = this.toArray(this.entities[entityType]);
    const srcIds = srcEntities.map((entity) => entity.getId());
    if (
      targetEntities.length > 0 &&
      Array.isArray(targetEntities[0][relationKey])
    ) {
      return targetEntities.filter((entity) =>
        (entity[relationKey] as Array<string>).some((id) =>
          srcIds.includes(id.split(":").pop())
        )
      );
    } else {
      return targetEntities.filter((entity) =>
        entity[relationKey]
          ? srcIds.includes(entity[relationKey].split(":").pop())
          : false
      );
    }
  }

  /**
   * Returns the ids of all the participants of the passed events.
   * This list may contain duplicates and the id does not necessarily have the entity prefix
   * @param events the array of events
   * @returns the ids of children which are listed as participants at the events
   */
  getParticipants(events: EventNote[]): string[] {
    const participants: string[] = [];
    events.forEach((ev) => participants.push(...ev.children));
    return participants;
  }

  /**
   * Return the ids of all the participants of the passed events with the defined attendance status using the `countAs`
   * attribute. The list may contain duplicates and the id does not necessarily have the entity prefix.
   * @param events the array of events
   * @param attendanceStatus the status for which should be looked for
   * @returns the ids of children which have the specified attendance in an event
   */
  getParticipantsWithAttendance(
    events: EventNote[],
    attendanceStatus: string
  ): string[] {
    const attendedChildren: string[] = [];
    events.forEach((e) =>
      e.children.forEach((childId) => {
        if (e.getAttendance(childId).status.countAs === attendanceStatus) {
          attendedChildren.push(childId);
        }
      })
    );
    return attendedChildren;
  }

  /**
   * Query the loaded data using the json-query language (https://github.com/auditassistant/json-query)
   * @param query the query string and optionally additional arguments
   * @returns the results of the query
   */
  public async queryData(query: string | any[]): Promise<any> {
    await this.dataLoaded;
    return jsonQuery(query, {
      data: this.entities,
      locals: {
        toArray: this.toArray,
        unique: this.unique,
        addPrefix: this.addPrefix,
        toEntities: this.toEntities.bind(this),
        getRelated: this.getRelated.bind(this),
        getParticipants: this.getParticipants,
        getParticipantsWithAttendance: this.getParticipantsWithAttendance,
      },
    }).value;
  }
}
