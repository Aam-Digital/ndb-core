import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../../core/entity/model/entity";
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
  private entities: { [type: string]: { [id: string]: Entity } };
  private dataAvailableFrom: Date;

  constructor(
    private entityMapper: EntityMapperService,
    private childrenService: ChildrenService,
    private attendanceService: AttendanceService
  ) {}

  /**
   * Runs the query on the passed data object
   * @param query a string or array according to the json-query language (https://github.com/auditassistant/json-query)
   * @param from a date which can be accessed in the query using a ?.
   *             This will also affect the amount of data being loaded.
   * @param to a date which can be accessed in the query using another ?
   * @param data the data on which the query should run, default is all entities
   * @returns the results of the query on the data
   */
  public async queryData(
    query: string,
    from: Date = null,
    to: Date = null,
    data?: any
  ): Promise<any> {
    if (from === null) {
      from = new Date(0);
    }
    if (from < this.dataAvailableFrom || !this.dataAvailableFrom) {
      await this.loadData(from);
    }

    if (!data) {
      data = this.entities;
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
        addEntities: this.addEntities.bind(this),
      },
    }).value;
  }

  private async loadData(from: Date): Promise<void> {
    const entityClasses: [EntityConstructor<any>, () => Promise<Entity[]>][] = [
      [Child, () => this.entityMapper.loadType(Child)],
      [School, () => this.entityMapper.loadType(School)],
      [RecurringActivity, () => this.entityMapper.loadType(RecurringActivity)],
      [
        ChildSchoolRelation,
        () => this.entityMapper.loadType(ChildSchoolRelation),
      ],
      [Note, () => this.childrenService.getNotesInTimespan(from)],
      [
        EventNote,
        () => this.attendanceService.getEventsOnDate(from, new Date()),
      ],
    ];

    this.entities = {};

    const dataPromises = [];
    for (const entityLoader of entityClasses) {
      const promise = entityLoader[1]().then((loadedEntities) =>
        this.setEntities(entityLoader[0], loadedEntities)
      );
      dataPromises.push(promise);
    }

    await Promise.all(dataPromises);

    this.dataAvailableFrom = from;
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
   * Get the size of an array
   * @param data the data for which the length should be returned
   * @returns the length of the input array or 0 if no array is provided
   */
  count(data: any[]): number {
    return data ? data.length : 0;
  }

  /**
   * Turns a list of ids (with the entity prefix) into a list of entities
   * @param ids the array of ids with entity prefix
   * @param entityPrefix (Optional) entity type prefix that should be added to the given ids where prefix is still missing
   * @returns a list of entity objects
   */
  toEntities(ids: string[], entityPrefix?: string): Entity[] {
    if (!ids) {
      return [];
    }

    if (entityPrefix) {
      ids = this.addPrefix(ids, entityPrefix);
    }

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
   * Filters the data when the filter value is a object (e.g. configurable enum) rather than a simple value
   * @param objs the objects to be filtered
   * @param attr the attribute of the objects which is a object itself
   * @param key the key of the attribute-object which should be compared
   * @param value the value which will be compared with `obj[attr][key]` for each obj in objs.
   *              The value can be a simple value or list of values separated by `|` (e.g. SCHOOL_CLASS|LIFE_SKILLS).
   *              If it is a list of values, then the object is returned if its value matches any of the given values.
   * @returns the filtered objects
   */
  filterByObjectAttribute(
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

  /**
   * Returns a list of IDs held by each object (e.g. the children-IDs held by an array of notes)
   * @param objs the objects which each holds a list of IDs
   * @param key the key on which each object holds a list of IDs
   * @returns a one dimensional string array holding all IDs which are held by the objects.
   *            This list may contain duplicate IDs. If this is not desired, use `:unique` afterwards.
   */
  getIds(objs: any[], key: string): string[] {
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
   * Adds all entities of the given type to the input array
   * @param entities the array before
   * @param entityType the type of entities which should be added
   * @returns the input array concatenated with all entities of the entityType
   */
  addEntities(entities: Entity[], entityType: string): Entity[] {
    return entities.concat(...this.toArray(this.entities[entityType]));
  }
}
