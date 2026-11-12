import { InjectionToken } from "@angular/core";

/**
 * Further settings for the admin editor of a list view, provided by feature modules
 * as the name of a component in the `ComponentRegistry`:
 * ```
 * { provide: ADMIN_ENTITY_LIST_SETTINGS, useValue: "MyFeatureListSettings", multi: true }
 * ```
 *
 * The editor shows each of them above the filters and sets these inputs of the component:
 * - `entityConstructor`: the record type of the list;
 * - `config`: the `EntityListConfig` of the list, which the component updates in place
 *   (as the other parts of the editor do).
 */
export const ADMIN_ENTITY_LIST_SETTINGS = new InjectionToken<string[]>(
  "AdminEntityListSettings",
);
