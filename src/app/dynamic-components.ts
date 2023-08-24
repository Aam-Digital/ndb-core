import { Type } from "@angular/core";
import { Registry } from "./core/config/registry/dynamic-registry";

export type AsyncComponent = () => Promise<Type<any>>;

/**
 * This registry hold all the loading functions for components that can be used dynamically with lazy loading.
 */
export class ComponentRegistry extends Registry<AsyncComponent> {}

// TODO make a build script that looks for annotations and creates this
export const componentRegistry = new ComponentRegistry();

export type ComponentTuple = [string, AsyncComponent];
