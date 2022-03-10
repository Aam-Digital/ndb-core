import { Entity, EntityConstructor } from "../entity/model/entity";
import { InjectionToken } from "@angular/core";
import { ComponentType } from "@angular/cdk/overlay";
import { OnInitDynamicComponent } from "../view/dynamic-components/on-init-dynamic-component.interface";

export class Registry<T> {
  private map = new Map<string, T>();

  constructor(private beforeAddCheck?: (key: string, mapping: T) => void) {}

  public add(key: string, mapping: T) {
    this.beforeAddCheck?.(key, mapping);
    if (this.map.has(key)) {
      throw Error(
        `Duplicate entity definition: ${key} is already registered with constructor ${this.map.get(
          key
        )}`
      );
    }
    this.map.set(key, mapping);
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
    return this.map.get(key);
  }

  public has(key: string) {
    return this.map.has(key);
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

export type ViewRegistry = Registry<ComponentType<OnInitDynamicComponent>>;
export const VIEWS = new InjectionToken<ViewRegistry>("app.registries.views");
export const viewRegistry = new Registry<
  ComponentType<OnInitDynamicComponent>
>();

export type RouteRegistry = Registry<ComponentType<any>>;
export const ROUTES = new InjectionToken<RouteRegistry>(
  "app.registries.routes"
);
export const routesRegistry = new Registry<ComponentType<any>>();
