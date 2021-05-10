import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../../core/entity/entity";
import { Child } from "../../child-dev-project/children/model/child";
import { School } from "../../child-dev-project/schools/model/school";
import { RecurringActivity } from "../../child-dev-project/attendance/model/recurring-activity";
import { Note } from "../../child-dev-project/notes/model/note";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { ChildrenService } from "../../child-dev-project/children/children.service";
import { AttendanceService } from "../../child-dev-project/attendance/attendance.service";
const jsonQuery = require("json-query");

/**
 * A query service which uses the json-query library (https://github.com/auditassistant/json-query).
 */
@Injectable({
  providedIn: "root",
})
export class QueryService {
  private entities: { [type: string]: { [id: string]: Entity } } = {};
  private dataLoaded: Promise<any>;
  constructor(
    private entityMapper: EntityMapperService,
    private childrenService: ChildrenService,
    private attendanceService: AttendanceService
  ) {}

  private loadData(from?: Date): void {
    const entityClasses: typeof Entity[] = [
      Child,
      School,
      RecurringActivity,
      ChildSchoolRelation,
    ];
    const dataPromises = [];
    if (from) {
      dataPromises.push(
        this.childrenService
          .getNotesInTimespan(from)
          .then((notes) => this.setEntities(Note, notes))
      );
      dataPromises.push(
        this.attendanceService
          .getEventsOnDate(from, new Date())
          .then((events) => this.setEntities(EventNote, events))
      );
    } else {
      entityClasses.push(EventNote, Note);
    }
    dataPromises.push(
      ...entityClasses.map((entityClass) =>
        this.entityMapper
          .loadType(entityClass)
          .then((loadedEntities) =>
            this.setEntities(entityClass, loadedEntities)
          )
      )
    );
    this.dataLoaded = Promise.all(dataPromises);
  }

  private setEntities<T extends Entity>(
    entityClass: EntityConstructor<T>,
    entities: T[]
  ) {
    this.entities[entityClass.ENTITY_TYPE] = {};
    entities.forEach(
      (entity) => (this.entities[entityClass.ENTITY_TYPE][entity._id] = entity)
    );
  }

  /**
   * Runs the query on the passed data object
   * @param query a string or array according to the json-query language (https://github.com/auditassistant/json-query)
   * @param from a date which can be accessed in the query using a ?. This will also affect how much data is loaded.
   * @param to a date which can be accessed in the query using another ?
   * @param data the data on which the query should run, default is all entities
   * @returns the results of the query on the data
   */
  public async queryData(
    query: string,
    from: Date = null,
    to: Date = null,
    data: any = this.entities
  ): Promise<any> {
    if (!this.dataLoaded) {
      this.loadData();
      await this.dataLoaded;
    }
    return jsonQuery([query, from, to], {
      data: data,
      locals: {
        toArray: this.toArray,
        unique: this.unique,
        count: this.count,
        addPrefix: this.addPrefix,
        toEntities: this.toEntities.bind(this),
        getRelated: this.getRelated.bind(this),
        filterByObjectAttribute: this.filterByObjectAttribute,
        getIds: this.getIds,
        getParticipantsWithAttendance: this.getParticipantsWithAttendance,
        getActive: this.getActive,
      },
    }).value;
  }

  /**
   * Adds the prefix and a colon (":") to each string in a array. Does nothing if the string already starts with the prefix.
   * @param ids a string of ids
   * @param prefix the prefix which should be added to the string
   * @returns a list where every string has the prefix
   */
  private addPrefix(ids: string[], prefix: string): string[] {
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
  private toArray(obj): any[] {
    return Object.values(obj);
  }

  /**
   * Returns a copy of the input array without duplicates
   * @param data the array where duplicates should be removed
   * @returns a list without duplicates
   */
  private unique(data: any[]): any[] {
    return new Array(...new Set(data));
  }

  private count(data: any[]): number {
    return data ? data.length : 0;
  }

  /**
   * Turns a list of ids (with the entity prefix) into a list of entities
   * @param ids the array of ids with entity prefix
   * @returns a list of entity objects
   */
  private toEntities(ids: string[]): Entity[] {
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
   * @returns a list of the related unique entities
   */
  private getRelated(
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

  private filterByObjectAttribute(
    objs: any[],
    attr: string,
    key: string,
    value: string
  ): any[] {
    const values = value.replace(new RegExp(" ", "g"), "").split("|");
    return objs.filter((obj) => {
      if (obj?.hasOwnProperty(attr)) {
        return values.includes(obj[attr][key]?.toString());
      }
      return false;
    });
  }

  private getIds(objs: any[], key: string): string[] {
    const ids: string[] = [];
    objs.forEach((obj) => {
      if (obj.hasOwnProperty(key)) {
        ids.push(...obj[key]);
      }
    });
    return ids;
  }

  /**
   * Return the ids of all the participants of the passed events with the defined attendance status using the `countAs`
   * attribute. The list may contain duplicates and the id does not necessarily have the entity prefix.
   * @param events the array of events
   * @param attendanceStatus the status for which should be looked for
   * @returns the ids of children which have the specified attendance in an event
   */
  private getParticipantsWithAttendance(
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
   * Returns the active child school relations from the input array
   * @param relations an array of child school relations
   * @returns an array of active child school relations
   */
  private getActive(relations: ChildSchoolRelation[]): ChildSchoolRelation[] {
    return relations.filter((relation) => relation.isActive());
  }
}
