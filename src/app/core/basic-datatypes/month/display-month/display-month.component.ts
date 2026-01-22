import { Component } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DisplayDateComponent } from "../../date/display-date/display-date.component";

@Component({
  selector: "app-display-month",
  template: `<app-display-date
    [value]="value"
    config="MMM y"
    [displayAsAnonymized]="isPartiallyAnonymized"
  ></app-display-date>`,
  imports: [DisplayDateComponent],
})
export class DisplayMonthComponent extends ViewDirective<Date> {}
