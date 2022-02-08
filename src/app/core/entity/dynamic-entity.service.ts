import { Entity, EntityConstructor } from "./model/entity";
import { Inject, Injectable } from "@angular/core";
import { EntityMapperService } from "./entity-mapper.service";
import { EntitySchemaService } from "./schema/entity-schema.service";
import { Registries, REGISTRY } from "../registry/DynamicRegistry";

/**
 * A service that can be used to get the entity-constructors (see {@link EntityConstructor})
 * from their string-types.
 * This also contains utility methods that deal with creating, loading,
 * checking on the existence and instantiating entities based on the string-types
 */
@Injectable({
  providedIn: "root",
})
export class DynamicEntityService {
  constructor(
    private entityMapper: EntityMapperService,
    private entitySchemaService: EntitySchemaService,
    @Inject(REGISTRY) private registry: Registries
  ) {}

  /**
   * returns the entity-constructor for a given string-name (i.e. the type)
   * of the entity. If the name is not registered, this method throws an error
   * @param entityType The type to get the entity from
   */
  getEntityConstructor<E extends Entity = any>(
    entityType: string
  ): EntityConstructor<E> {
    const ctor = this.registry.ENTITY.lookup(entityType);
    if (!ctor) {
      throw new Error(`Entity-type ${entityType} does not exist!`);
    }
    return ctor as EntityConstructor<E>;
  }

  /**
   * Utility method to instantiate an entity using initial, raw parameters as they
   * would appear in the database
   * @param entityType The type to instantiate an entity by
   * @param id The id that the entity should have
   * @param initialParameters The initial parameters as they would appear in the database
   */
  instantiateEntity<E extends Entity = Entity>(
    entityType: string,
    id?: string,
    initialParameters?: object
  ): E {
    const ctor = this.getEntityConstructor<E>(entityType);
    const entity = id ? new ctor(id) : new ctor();
    if (initialParameters) {
      this.entitySchemaService.loadDataIntoEntity(entity, initialParameters);
    }
    return entity;
  }

  /**
   * returns {@code true}, when the entity is registered and could thus be
   * instantiated. Use this method when you don't want to use the throwing
   * {@link getEntityConstructor} or similar throwing methods
   * @param entityType The type to look up
   */
  isRegisteredEntity(entityType: string): boolean {
    return this.registry.ENTITY.has(entityType);
  }

  /**
   * returns {@code true}, when any of the given entities are registered
   * and could be instantiated
   * @param entityTypes The types of entities to look up
   */
  hasAnyRegisteredEntity(...entityTypes: string[]): boolean {
    return entityTypes.some((type) => this.isRegisteredEntity(type));
  }

  /**
   * Load an entity dynamically using the name instead of the constructor
   * like one would in the {@link EntityMapperService}
   * @param entityType The type of the entity to load
   * @param entityId The id of the entity to load
   */
  async loadEntity<E extends Entity = any>(
    entityType: string,
    entityId: string
  ): Promise<E> {
    const ctor = this.getEntityConstructor(entityType);
    return this.entityMapper.load<E>(ctor, entityId);
  }

  /**
   * Load all entities of a certain type using the name of the entity-type
   * instead of the constructor
   * @param entityType The entity-type to load
   */
  async loadType<E extends Entity = any>(entityType: string): Promise<E[]> {
    const ctor = this.getEntityConstructor(entityType);
    return this.entityMapper.loadType<E>(ctor);
  }
}
