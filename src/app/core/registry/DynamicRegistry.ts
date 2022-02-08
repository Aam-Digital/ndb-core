import { Entity, EntityConstructor } from "../entity/model/entity";
import { InjectionToken } from "@angular/core";

export class Registry<T> {
  private map = new Map<string, T>();

  constructor(private beforeAddCheck: (key: string, mapping: T) => void) {}

  public add(key: string, mapping: T) {
    this.beforeAddCheck(key, mapping);
    if (this.map.has(key)) {
      throw Error(
        `Duplicate entity definition: ${key} is already registered with constructor ${this.map.get(
          key
        )}`
      );
    }
    this.map.set(key, mapping);
  }

  public addAlias(key: string, mapping: T) {
    this.map.set(key, mapping);
  }

  public lookup(key: string) {
    return this.map.get(key);
  }

  public has(key: string) {
    return this.map.has(key);
  }
}

export interface Registries {
  ENTITY: Registry<EntityConstructor>;
}

export const REGISTRY = new InjectionToken<Registries>("app.registries");

/**
 * Contains all registries that exist.
 * You should commonly avoid using this directly, unless nothing else is possible.
 * Instead, use the {@link REGISTRY} injection token like so:
 * <pre>
 *   constructor(@Inject(REGISTRY) private registry: Registries) {...}
 * </pre>
 */
export const DynamicRegistry: Registries = {
  ENTITY: new Registry((key, constructor) => {
    if (!(new constructor() instanceof Entity)) {
      throw Error(
        `Tried to register an entity-type that is not a subclass of Entity\n` +
          `type: ${key}; constructor: ${constructor}`
      );
    }
  }),
};
