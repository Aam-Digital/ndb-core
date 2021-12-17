import { Entity, EntityConstructor } from "./model/entity";
import { EntityMapperService } from "./entity-mapper.service";
import { UpdatedEntity } from "./model/entity-update";
import { NEVER, Observable } from "rxjs";

export function mockEntityMapper(
  withData: Entity[] = []
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
  constructor() {
    super(null, null);
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
    this.data.get(type).set(entity.getId(), entity);
  }

  /**
   * returns whether or not the given entity is known
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
    const result = this.data.get(entityType)?.get(id);
    if (!result) {
      throw { status: 404 };
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
    }
  }

  public async load<T extends Entity>(
    entityType: EntityConstructor<T>,
    id: string
  ): Promise<T> {
    const type = new entityType().getType();
    return this.get(type, id) as T;
  }

  async loadType<T extends Entity>(
    entityType: EntityConstructor<T>
  ): Promise<T[]> {
    const type = new entityType().getType();
    return this.getAll(type) as T[];
  }

  async save<T extends Entity>(
    entity: T,
    forceUpdate: boolean = false
  ): Promise<any> {
    this.add(entity);
    return Promise.resolve();
  }

  remove<T extends Entity>(entity: T): Promise<any> {
    this.delete(entity);
    return Promise.resolve();
  }

  receiveUpdates<T extends Entity>(
    entityType: EntityConstructor<T>
  ): Observable<UpdatedEntity<T>> {
    return NEVER;
  }
}
