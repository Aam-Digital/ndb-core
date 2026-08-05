import { Component, ChangeDetectionStrategy } from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DisplayDateComponent } from "../../date/display-date/display-date.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-month",
  template: `<!-- eslint-disable @angular-eslint/template/i18n -- "config" is a date format pattern, not prose -->
    <app-display-date
      [value]="value()"
      config="MMM y"
      [displayAsAnonymized]="isPartiallyAnonymized()"
    ></app-display-date>
    <!-- eslint-enable @angular-eslint/template/i18n -->`,
  imports: [DisplayDateComponent],
})
export class DisplayMonthComponent extends ViewDirective<Date> {}
