import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * Button to open the editor for a display condition of a field or field group in the admin UI.
 *
 * Highlighted in the accent color while a condition is configured.
 * The parent handles the `(click)` event on this component to open the editor.
 */
@Component({
  selector: "app-admin-display-condition-button",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FaIconComponent, MatButtonModule, MatTooltipModule],
  // inline-block so that parents can apply vertical margins to the button
  styles: `
    :host {
      display: inline-block;
    }
  `,
  template: `
    @if (showLabel()) {
      <button
        mat-stroked-button
        type="button"
        [color]="color()"
        [matTooltip]="tooltip()"
      >
        <fa-icon icon="filter" class="standard-icon-with-text"></fa-icon>
        <span i18n>Display Condition</span>
      </button>
    } @else {
      <button
        mat-icon-button
        type="button"
        [color]="color()"
        i18n-aria-label
        aria-label="Display Condition"
        [matTooltip]="tooltip()"
      >
        <fa-icon icon="filter"></fa-icon>
      </button>
    }
  `,
})
export class AdminDisplayConditionButtonComponent {
  /** Whether a display condition is currently configured. */
  readonly configured = input(false);

  /** What the condition applies to, used to describe it in the tooltip. */
  readonly target = input.required<"field" | "fieldGroup">();

  /** Show a text label next to the icon instead of an icon-only button. */
  readonly showLabel = input(false);

  protected readonly color = computed(() =>
    this.configured() ? "accent" : undefined,
  );

  protected readonly tooltip = computed(() => {
    const isGroup = this.target() === "fieldGroup";
    if (this.configured()) {
      return isGroup
        ? $localize`Condition configured: this field group is only shown while the record matches it.`
        : $localize`Condition configured: this field is only shown while the record matches it.`;
    }
    return isGroup
      ? $localize`Only show this field group in forms if the record currently matches a condition, based on the values of other fields.`
      : $localize`Only show this field in forms if the record currently matches a condition, based on the values of other fields.`;
  });
}
