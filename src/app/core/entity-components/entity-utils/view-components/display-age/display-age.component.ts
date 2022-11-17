import { Component } from "@angular/core";
import { ViewDirective } from "../view.directive";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { DateOfBirth } from "../../../../../child-dev-project/children/model/dateOfBirth";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";

/**
 * A component which displays the age of an entity with a DateOfBirth property.
 * The name of the property where the DateOfBirth is defined has to be passed as config.
 * e.g. show age of a child
 * ```json
 * {
 *   "id": "age",
 *   "label": "Age",
 *   "view": "DisplayAge",
 *   "config": "dateOfBirth"
 * }
 * ```
 */
@DynamicComponent("DisplayAge")
@Component({
  selector: "app-display-age",
  template: "{{ date?.age }}",
})
export class DisplayAgeComponent extends ViewDirective<any> {
  date: DateOfBirth;

  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.date = this.entity[config.config];
  }
}
