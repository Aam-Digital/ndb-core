import { EntityMapperService } from "./entity-mapper.service";
import { Observable, Subject } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { Entity, EntityConstructor } from "../model/entity";
import { UpdatedEntity } from "../model/entity-update";
import { entityRegistry } from "../database-entity.decorator";
import { TEST_USER } from "../../user/demo-user-generator.service";

export function mockEntityMapper(
  withData: Entity[] = [],
): MockEntityMapperService {
  const ems = new MockEntityMapperService();
  ems.addAll(withData);
  return ems;
}

/**
 * Mocked entity mapper. Can/should only be used whenever some data should be saved
 * and loaded. This is not to be used to mock database/anything related to the Schema-service.
 */
export class MockEntityMapperService extends EntityMapperService {
  private data: Map<string, Map<string, Entity>> = new Map();
  private observables: Map<string, Subject<UpdatedEntity<any>>> = new Map();

  constructor() {
    super(
      null,
      null,
      { getCurrentUser: () => ({ name: TEST_USER }) } as any,
      entityRegistry,
    );
  }

  private publishUpdates(type: string, update: UpdatedEntity<any>) {
    const subj = this.observables.get(type);
    if (subj !== undefined) {
      subj.next(update);
    }
  }

  /**
   * like {@link save}, but synchronous
   * @param entity The entity to add
   */
  public add(entity: Entity) {
    const type = entity.getType();
    if (!this.data.get(type)) {
      this.data.set(type, new Map());
    }
    super.setEntityMetadata(entity);
    const alreadyExists = this.contains(entity);
    this.data.get(type).set(entity.getId(), entity);
    this.publishUpdates(
      entity.getType(),
      alreadyExists ? { type: "update", entity } : { type: "new", entity },
    );
  }

  /**
   * returns whether the given entity is known
   * @param entity
   */
  public contains(entity: Entity): boolean {
    return (
      this.data.has(entity.getType()) &&
      this.data.get(entity.getType()).has(entity.getId())
    );
  }

  /**
   * Add a bunch of entities
   * @param entities The entities to add
   */
  public addAll(entities: Entity[]) {
    entities.forEach((e) => this.add(e));
  }

  /**
   * like {@link load} but synchronous
   * @param entityType
   * @param id
   */
  public get(entityType: string, id: string): Entity {
    const entityId = Entity.createPrefixedId(entityType, id);
    const result = this.data.get(entityType)?.get(entityId);
    if (!result) {
      throw new HttpErrorResponse({ status: 404 });
    }
    return result;
  }

  /**
   * like {@link loadType} but synchronous
   * @param entityType
   */
  public getAll<T extends Entity>(entityType: string): T[] {
    return [...(this.data.get(entityType)?.values() || [])] as T[];
  }

  /**
   * like {@link remove} but synchronous
   * @param entity
   */
  public delete(entity: Entity) {
    const entities = this.data.get(entity.getType());
    if (entities) {
      entities.delete(entity.getId());
      this.publishUpdates(entity.getType(), { type: "remove", entity });
    }
  }

  public async load<T extends Entity>(
    entityType: EntityConstructor<T> | string,
    id: string,
  ): Promise<T> {
    const ctor = this.resolveConstructor(entityType);
    const type = new ctor().getType();
    const entity = this.get(type, id) as T;
    if (!entity) {
      throw Error(`Entity ${id} does not exist in MockEntityMapper`);
    } else {
      return entity;
    }
  }

  async loadType<T extends Entity>(
    entityType: EntityConstructor<T> | string,
  ): Promise<T[]> {
    const ctor = this.resolveConstructor(entityType);
    const type = new ctor().getType();
    return this.getAll(type);
  }

  async save<T extends Entity>(
    entity: T,
    forceUpdate: boolean = false,
  ): Promise<any> {
    this.add(entity);
  }

  async saveAll(entities: Entity[]): Promise<any> {
    this.addAll(entities);
  }

  remove<T extends Entity>(entity: T): Promise<any> {
    this.delete(entity);
    return Promise.resolve();
  }

  receiveUpdates<T extends Entity>(
    entityType: EntityConstructor<T> | string,
  ): Observable<UpdatedEntity<T>> {
    let name =
      typeof entityType === "string" ? entityType : entityType.ENTITY_TYPE;
    if (!this.observables.has(name)) {
      this.observables.set(name, new Subject());
    }
    return this.observables.get(name);
  }

  /**
   * Get a flat array of all entities in the database overall
   * for testing and debugging.
   */
  public getAllData() {
    const allData: Entity[] = [];
    for (const type of this.data.values()) {
      for (const entity of type.values()) {
        allData.push(entity);
      }
    }
    return allData;
  }
}
