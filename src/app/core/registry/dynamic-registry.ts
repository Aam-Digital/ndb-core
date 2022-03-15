import { Entity, EntityConstructor } from "../entity/model/entity";
import { InjectionToken } from "@angular/core";
import { ComponentType } from "@angular/cdk/overlay";

export class Registry<T> extends Map<string, T> {
  constructor(private beforeAddCheck?: (key: string, mapping: T) => void) {
    super();
  }

  public add(key: string, mapping: T) {
    this.beforeAddCheck?.(key, mapping);
    if (this.has(key)) {
      throw Error(
        `Duplicate entity definition: ${key} is already registered with constructor ${this.get(
          key
        )}`
      );
    }
    this.set(key, mapping);
  }

  public addAliases(keys: string[], mapping: T) {
    keys.forEach((key) => {
      this.add(key, mapping);
    });
  }

  public get(key: string): T | undefined {
    if (!this.has(key)) {
      console.warn(`Requested item is not registered`);
    }
    return super.get(key);
  }
}

export type EntityRegistry = Registry<EntityConstructor>;
export const ENTITIES = new InjectionToken<EntityRegistry>(
  "app.registries.entities"
);
export const entityRegistry = new Registry<EntityConstructor>(
  (key, constructor) => {
    if (!(new constructor() instanceof Entity)) {
      throw Error(
        `Tried to register an entity-type that is not a subclass of Entity\n` +
          `type: ${key}; constructor: ${constructor}`
      );
    }
  }
);

export type RouteRegistry = Registry<ComponentType<any>>;
export const ROUTES = new InjectionToken<RouteRegistry>(
  "app.registries.routes"
);
export const routesRegistry = new Registry<ComponentType<any>>();
