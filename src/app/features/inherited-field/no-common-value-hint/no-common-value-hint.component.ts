import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { NoCommonValueReason } from "#src/app/core/default-values/default-value-service/default-value.service";

/**
 * Explains why the linked records provide no value to inherit (see {@link NoCommonValueReason}).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-no-common-value-hint",
  template: `
    @if (reason() === "unavailable") {
      <span i18n>
        Some linked records could not be loaded (e.g. no access), so nothing is
        inherited. The current value is kept.
      </span>
    } @else {
      <span i18n>
        The linked records have no value in common, so nothing is inherited. The
        current value is kept.
      </span>
    }
  `,
})
export class NoCommonValueHintComponent {
  readonly reason = input.required<NoCommonValueReason>();
}
