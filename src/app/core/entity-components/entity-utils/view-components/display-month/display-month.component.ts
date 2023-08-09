import { Component } from "@angular/core";
import { DatePipe } from "@angular/common";
import { ViewDirective } from "../view.directive";

@Component({
  selector: "app-display-month",
  standalone: true,
  template: `{{ value | date: "YYYY-MM" }}`,
  imports: [DatePipe],
})
export class DisplayMonthComponent extends ViewDirective<Date> {}
