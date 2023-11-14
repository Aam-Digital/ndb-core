import { Component, OnInit } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { DateWithAge } from "../dateWithAge";

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
  standalone: true,
})
export class DisplayAgeComponent
  extends ViewDirective<any, string>
  implements OnInit
{
  date: DateWithAge;

  ngOnInit() {
    this.date = this.entity[this.config];
  }
}
