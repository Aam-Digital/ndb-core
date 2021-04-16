import { Entity, EntityConstructor } from "./entity";
import { EntityMapperService } from "./entity-mapper.service";
import { UpdatedEntity } from "./entity-update";
import { NEVER, Observable } from "rxjs";

export function mockEntityMapper(withData: Entity[] = []): EntityMapperService {
  const ems = new MockEntityMapperService();
  const data = new Map<string, Entity[]>();
  withData.forEach((e) => {
    if (!data.get(e.getType())) {
      data.set(e.getType(), []);
    }
    data.get(e.getType()).push(e);
  });
  ems.data = data;
  return ems;
}

export class MockEntityMapperService extends EntityMapperService {
  data: Map<string, Entity[]> = new Map();
  constructor() {
    super(null, null);
  }

  public async load<T extends Entity>(
    entityType: EntityConstructor<T>,
    id: string
  ): Promise<T> {
    const type = new entityType().getType();
    return this.data.get(type)?.find((e) => e.getId() === id) as T;
  }

  async loadType<T extends Entity>(
    entityType: EntityConstructor<T>
  ): Promise<T[]> {
    const type = new entityType().getType();
    return [...this.data.get(type)] as T[];
  }

  async save<T extends Entity>(
    entity: T,
    forceUpdate: boolean = false
  ): Promise<any> {
    if (!this.data.get(entity.getType())) {
      this.data.set(entity.getType(), []);
    }
    this.data.get(entity.getType()).push(entity);
  }

  remove<T extends Entity>(entity: T): Promise<any> {
    const entities = this.data.get(entity.getType());
    if (entities) {
      const index = entities.findIndex((e) => e.getId() === entity.getId());
      if (index !== -1) {
        entities.splice(index, 1);
      }
    }
    return Promise.resolve();
  }

  receiveUpdates<T extends Entity>(
    entityType: EntityConstructor<T>
  ): Observable<UpdatedEntity<T>> {
    return NEVER;
  }
}
