import { Injectable } from "@angular/core";
import { Entity, EntityConstructor } from "../entity/model/entity";
import { Note } from "../../child-dev-project/notes/model/note";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { ChildrenService } from "../../child-dev-project/children/children.service";
import { AttendanceService } from "../../child-dev-project/attendance/attendance.service";
import { EventAttendance } from "../../child-dev-project/attendance/model/event-attendance";
import jsonQuery from "json-query";
import { EntityRegistry } from "../entity/database-entity.decorator";

/**
 * A query service which uses the json-query library (https://github.com/auditassistant/json-query).
 */
@Injectable({
  providedIn: "root",
})
export class QueryService {
  private entities: { [type: string]: { [id: string]: Entity } } = {};

  /**
   * A map of information about the loading state of the different entity types
   * @private
   */
  private entityInfo: {
    [type: string]: {
      /**
       * A optional function which can be used to load this entity that might use a start and end date
       * @param form
       * @param to
       */
      dataFunction?: (form, to) => Promise<Entity[]>;
      /**
       * Whether already all entities of this type have been loaded
       */
      allLoaded?: boolean;
      /**
       * A certain range in which entities of this type have been loaded
       */
      rangeLoaded?: { from: Date; to: Date };
      /**
       * Whether updates of this entity are listened to
       */
      updating?: boolean;
    };
  } = {
    Note: {
      dataFunction: (from, to) =>
        this.childrenService.getNotesInTimespan(from, to),
    },
    EventNote: {
      dataFunction: (from, to) =>
        this.attendanceService.getEventsOnDate(from, to),
    },
  };

  /**
   * A list of further aliases for which a certain entity needs to be loaded.
   * This can be necessary if a function requires a certain entity to be present.
   * @private
   */
  private queryStringMap: [string, EntityConstructor][] = [
    ["getAttendanceArray\\(true\\)", ChildSchoolRelation],
  ];

  constructor(
    private entityMapper: EntityMapperService,
    private childrenService: ChildrenService,
    private attendanceService: AttendanceService,
    entityRegistry: EntityRegistry
  ) {
    entityRegistry.forEach((entity, name) =>
      this.queryStringMap.push([name, entity])
    );
  }

  /**
   * Runs the query on the passed data object
   * @param query a string or array according to the json-query language (https://github.com/auditassistant/json-query)
   * @param from a date which can be accessed in the query using a ?.
   *             This will also affect the amount of data being loaded.
   * @param to a date which can be accessed in the query using another ?
   * @param data the data on which the query should run, default is all entities
   * @returns the results of the query on the data
   */
  public queryData(query: string, from?: Date, to?: Date, data?: any): any {
    from = from ?? new Date(0);
    to = to ?? new Date();

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
        getAttendanceArray: this.getAttendanceArray.bind(this),
        getAttendanceReport: this.getAttendanceReport,
        addEntities: this.addEntities.bind(this),
        setString: this.setString,
      },
    }).value;
  }

  async cacheRequiredData(query: string, from: Date, to: Date) {
    from = from ?? new Date(0);
    to = to ?? new Date();
    const uncachedEntities = this.getUncachedEntities(query, from, to);
    const dataPromises = uncachedEntities.map((entity) => {
      const info = this.entityInfo[entity.ENTITY_TYPE];
      if (info?.dataFunction) {
        return info.dataFunction(from, to).then((loadedEntities) => {
          this.setEntities(entity, loadedEntities);
          info.rangeLoaded = { from, to };
        });
      } else {
        return this.entityMapper.loadType(entity).then((loadedEntities) => {
          this.setEntities(entity, loadedEntities);
          this.entityInfo[entity.ENTITY_TYPE] = { allLoaded: true };
        });
      }
    });
    await Promise.all(dataPromises);
    this.applyEntityUpdates(uncachedEntities);
  }

  private applyEntityUpdates(uncachedEntities: EntityConstructor[]) {
    uncachedEntities
      .filter(({ ENTITY_TYPE }) => !this.entityInfo[ENTITY_TYPE].updating)
      .forEach(({ ENTITY_TYPE }) => {
        this.entityInfo[ENTITY_TYPE].updating = true;
        this.entityMapper
          .receiveUpdates(ENTITY_TYPE)
          .subscribe(({ entity, type }) => {
            if (type === "remove") {
              delete this.entities[ENTITY_TYPE][entity.getId(true)];
            } else {
              this.entities[ENTITY_TYPE][entity.getId(true)] = entity;
            }
          });
      });
  }

  /**
   * Get entities that are referenced in the query string and are not sufficiently cached.
   * @param query
   * @param from
   * @param to
   * @private
   */
  private getUncachedEntities(query: string, from: Date, to: Date) {
    return this.queryStringMap
      .filter(([matcher]) =>
        // matches query string without any alphanumeric characters before or after (e.g. so Child does not match ChildSchoolRelation)
        query?.match(new RegExp(`(^|\\W)${matcher}(\\W|$)`))
      )
      .map(([_, entity]) => entity)
      .filter((entity) => {
        const info = this.entityInfo[entity.ENTITY_TYPE];
        return (
          info === undefined ||
          !(
            info.allLoaded ||
            (info.rangeLoaded?.from <= from && info.rangeLoaded?.to >= to)
          )
        );
      });
  }

  private setEntities<T extends Entity>(
    entityClass: EntityConstructor<T>,
    entities: T[]
  ) {
    this.entities[entityClass.ENTITY_TYPE] = {};
    entities.forEach(
      (entity) =>
        (this.entities[entityClass.ENTITY_TYPE][entity.getId(true)] = entity)
    );
  }

  /**
   * Adds the prefix and a colon (":") to each string in a array. Does nothing if the string already starts with the prefix.
   * @param ids a string of ids
   * @param prefix the prefix which should be added to the string
   * @returns a list where every string has the prefix
   */
  private addPrefix(ids: string[], prefix: string): string[] {
    return ids.map((id) => Entity.createPrefixedId(prefix, id));
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

  /**
   * Get the size of an array
   * @param data the data for which the length should be returned
   * @returns the length of the input array or 0 if no array is provided
   */
  private count(data: any[]): number {
    return data ? data.length : 0;
  }

  /**
   * Turns a list of ids (with the entity prefix) into a list of entities
   * @param ids the array of ids with entity prefix
   * @param entityPrefix (Optional) entity type prefix that should be added to the given ids where prefix is still missing
   * @returns a list of entity objects
   */
  private toEntities(ids: string[], entityPrefix?: string): Entity[] {
    if (!ids) {
      return [];
    }

    if (entityPrefix) {
      ids = this.addPrefix(ids, entityPrefix);
    }

    return ids
      .map((id) => {
        const prefix = id.split(":")[0];
        return this.entities[prefix][id];
      })
      .filter((entity) => !!entity);
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
    const srcIds = srcEntities
      .filter((entity) => typeof entity.getId === "function") // skip empty placeholder objects
      .map((entity) => entity.getId());
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

  /**
   * Returns a list of IDs held by each object (e.g. the children-IDs held by an array of notes)
   * @param objs the objects which each holds a list of IDs
   * @param key the key on which each object holds a list of IDs
   * @returns a one dimensional string array holding all IDs which are held by the objects.
   *            This list may contain duplicate IDs. If this is not desired, use `:unique` afterwards.
   */
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
   * Transforms a list of notes or event-notes into a flattened list of participants and their attendance for each event.
   * @param events the input list of type Note or EventNote
   * @param includeSchool (optional) also include the school to which a participant belongs
   * @returns AttendanceInfo[] a list holding information about the attendance of a single participant
   */
  private getAttendanceArray(
    events: Note[],
    includeSchool = false
  ): AttendanceInfo[] {
    const attendances: AttendanceInfo[] = [];
    for (const event of events) {
      const linkedRelations = includeSchool
        ? this.getMembersOfGroupsForEvent(event)
        : [];

      for (const child of event.children) {
        const attendance: AttendanceInfo = {
          participant: child,
          status: event.getAttendance(child),
        };

        const relation = linkedRelations.find((rel) => rel.childId === child);
        if (relation) {
          attendance.school = relation.schoolId;
        }

        attendances.push(attendance);
      }
    }
    return attendances;
  }

  private getMembersOfGroupsForEvent(event: Note) {
    return this.toArray(this.entities[ChildSchoolRelation.ENTITY_TYPE]).filter(
      (relation) =>
        event.schools.includes(relation.schoolId) &&
        relation.isActiveAt(event.date)
    );
  }

  /**
   * Transforms a list of attendances infos into an aggregated report for each participant
   * @param attendances an array of AttendanceInfo objects
   * @returns AttendanceReport[] for each participant the ID, the number of present and total absences as well as the attendance percentage.
   */
  private getAttendanceReport(
    attendances: AttendanceInfo[]
  ): AttendanceReport[] {
    const participantMap: { [key in string]: AttendanceReport } = {};
    attendances.forEach((attendance) => {
      if (!participantMap.hasOwnProperty(attendance.participant)) {
        participantMap[attendance.participant] = {
          participant: attendance.participant,
          total: 0,
          present: 0,
          percentage: "",
          detailedStatus: {},
        };
      }
      const report = participantMap[attendance.participant];
      report.detailedStatus[attendance.status.status.id] = report
        .detailedStatus[attendance.status.status.id]
        ? report.detailedStatus[attendance.status.status.id] + 1
        : 1;
      if (attendance.status.status.countAs === "PRESENT") {
        report.present++;
      }
      if (attendance.status.status.countAs !== "IGNORE") {
        report.total++;
      }
      if (report.total > 0) {
        report.percentage = (report.present / report.total).toFixed(2);
      }
    });
    return Object.values(participantMap);
  }

  /**
   * Adds all entities of the given type to the input array
   * @param entities the array before
   * @param entityType the type of entities which should be added
   * @returns the input array concatenated with all entities of the entityType
   */
  private addEntities(entities: Entity[], entityType: string): Entity[] {
    return entities.concat(...this.toArray(this.entities[entityType]));
  }

  /**
   * Replaces all input values by the string provided
   * @param data the data which will be replaced
   * @param value the string which should replace initial data
   * @returns array of same length as data where every input is value
   */
  private setString(data: any[], value: string): string[] {
    return data.map(() => value);
  }
}

export interface AttendanceInfo {
  participant: string;
  status: EventAttendance;
  school?: string;
}

export interface AttendanceReport {
  participant: string;
  total: number;
  present: number;
  percentage: string;

  /** counts by all custom configured status **/
  detailedStatus?: { [key: string]: number };
}
