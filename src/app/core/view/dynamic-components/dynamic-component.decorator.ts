import { OnInitDynamicComponent } from "./on-init-dynamic-component.interface";
import { Registry } from "../../registry/dynamic-registry";
import { ComponentType } from "@angular/cdk/overlay";

export class ViewRegistry extends Registry<
  ComponentType<OnInitDynamicComponent>
> {}
export const viewRegistry = new ViewRegistry();

/**
 * Decorator to annotate a class that serves as dynamic component
 * A dynamic component can be referenced from the config.
 * The name to reference the component from is the name of the class without the
 * `Component`, or one of the registered aliases
 * @example
 * ```
 * @DynamicComponent()
 * @Component(...)
 * class DoSomethingComponent {
 *   // Component definition
 * }
 *
 * // Later in some config:
 *
 * {
 *   view: "DoSomething"
 * }
 * ```
 * @param aliases Aliases that the component is also known under
 * @constructor
 */
export function DynamicComponent(...aliases: string[]) {
  return (ctor: ComponentType<OnInitDynamicComponent>) => {
    viewRegistry.add(ctor.name.replace("Component", ""), ctor);
    viewRegistry.addAliases(aliases, ctor);
  };
}
