import { Component } from "@angular/core";
import { DatePipe, NgIf } from "@angular/common";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DisplayDateComponent } from "../../date/display-date/display-date.component";

@Component({
  selector: "app-display-month",
  standalone: true,
  template: `<app-display-date
    [value]="value"
    [config]="'YYYY-MM'"
    [displayAsAnonymized]="isPartiallyAnonymized"
  ></app-display-date>`,
  imports: [DatePipe, NgIf, DisplayDateComponent],
})
export class DisplayMonthComponent extends ViewDirective<Date> {}
