/**
 * Marks a class to be the target when routing.
 * Use this by adding the annotation `@RouteTarget("...")` to a component.
 * The name provided to the annotation can then be used in the configuration.
 *
 * IMPORTANT:
 *  The component also needs to be added to the `...Components` list of the respective module.
 */
export const RouteTarget = (_name: string) => (_) => undefined;
