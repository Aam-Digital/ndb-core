import { ChangeDetectionStrategy, Component } from "@angular/core";
import { AsyncPipe } from "@angular/common";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { CustomDatePipe } from "../../../core/basic-datatypes/date/custom-date.pipe";
import { NotificationTimePipe } from "../../notification/notification-time.pipe";

/**
 * When a change happened: the date, with how long ago underneath.
 *
 * Both readings earn their place in a log - the elapsed time is what makes
 * "recent" obvious at a glance, while the date is what someone reports or
 * cross-references. The shared date display shows only the absolute date, so
 * the two are composed here.
 */
@DynamicComponent("DisplayAuditTimestamp")
@Component({
  selector: "app-display-audit-timestamp",
  imports: [AsyncPipe, CustomDatePipe, NotificationTimePipe],
  template: `
    @if (value()) {
      <div class="flex-column">
        <span>{{ value() | customDate: "short" }}</span>
        <!-- quieter than the date, so the two read apart rather than as one -->
        <span class="elapsed text-secondary">{{
          value() | notificationTime | async
        }}</span>
      </div>
    }
  `,
  styles: [
    `
      .elapsed {
        font-size: 12px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayAuditTimestampComponent extends ViewDirective<Date> {}
