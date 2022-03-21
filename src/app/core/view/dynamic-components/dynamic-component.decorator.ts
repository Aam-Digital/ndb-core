import { OnInitDynamicComponent } from "./on-init-dynamic-component.interface";
import { Registry } from "../../registry/dynamic-registry";
import { ComponentType } from "@angular/cdk/overlay";

export class ViewRegistry extends Registry<
  ComponentType<OnInitDynamicComponent>
> {}
export const viewRegistry = new ViewRegistry();

/**
 * Decorator to annotate a class that serves as dynamic component
 * A dynamic component can be referenced from the config with the name defined on the decorator.
 *
 * IMPORTANT:
 *  Angular ignores all components without references in the code in a production build.
 *  Dynamic components should therefore be added to a static array in the module where they are declared.
 *
 * @example
 * ```
 * @DynamicComponent("DoSomething")
 * @Component(...)
 * class DoSomethingComponent {
 *   // Component definition
 * }
 *
 * // In the module
 * @NgModule({declaration: [DoSomethingComponent]})
 * export class DoSomethingModule {
 *   static dynamicComponents = [DoSomethingComponent];
 * }
 *
 * // Later in some config:
 *
 * {
 *   view: "DoSomething"
 * }
 * ```
 * @param name with which the component can be accessed
 */
export function DynamicComponent(name: string) {
  return (ctor: ComponentType<OnInitDynamicComponent>) => {
    viewRegistry.add(name, ctor);
  };
}
