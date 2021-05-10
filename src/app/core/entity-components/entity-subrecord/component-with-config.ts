import { Entity } from "../../entity/entity";
import { ComponentType } from "@angular/cdk/overlay";
import { ShowsEntity } from "../../form-dialog/shows-entity.interface";

/**
 * Settings for the popup details view of a EntitySubrecordComponent.
 */
export interface ComponentWithConfig<T extends Entity> {
  /**
   * The component to be used for displaying a single Entity instance's details.
   */
  component: ComponentType<ShowsEntity<T>>;

  /**
   * Optionally include an object to pass any values into the component,
   * which has to implement the OnInitDynamicComponent interface to receive this config.
   */
  componentConfig?: any;
}
