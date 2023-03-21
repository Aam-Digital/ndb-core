import { ComponentType } from "@angular/cdk/overlay";

/**
 * Decorator to annotate a class that serves as dynamic component
 * A dynamic component can be referenced from the config with the name defined on the decorator.
 *
 * IMPORTANT:
 *  The component also needs to be added to the `...Components` list of the respective module.
 *
 * @example
 * ```javascript
 * @DynamicComponent("DoSomething")
 * @Component(...)
 * class DoSomethingComponent {
 *   // Component definition
 * }
 *
 * // Later in some config:
 * {
 *   view: "DoSomething"
 * }
 * ```
 * @param _name with which the component can be accessed
 */
export const DynamicComponent = (_name: string) => (_: ComponentType<any>) =>
  undefined;
