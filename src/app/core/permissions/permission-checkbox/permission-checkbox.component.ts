import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * What {@link PermissionCheckboxComponent} renders for one cell of a permission
 * grid: the display state only, not the rules it was derived from. Each grid
 * extends it with the state it needs for its own editing - such as the row's
 * own grant, which this component never reads.
 */
export interface PermissionCellState {
  /**
   * Whether the checkbox is shown as ticked. Each grid resolves this for
   * itself, so it may well include access that a broader or inherited rule
   * grants on top of what the row itself stores.
   */
  allowed: boolean;
  /** whether the checkbox may be changed on this row */
  editable: boolean;
  /** why the checkbox cannot be changed; empty when it is editable */
  lockTooltip: string;
}

let nextLockDescriptionId = 0;

/**
 * One checkbox of a permission grid, which may be locked by a rule the grid
 * cannot change - explaining that through a tooltip that stays reachable while
 * the checkbox is disabled.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-permission-checkbox",
  imports: [MatCheckboxModule, MatTooltipModule],
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
    }
  `,
  template: `
    <!-- the tooltip sits on the checkbox itself (not a wrapper), so
         "disabledInteractive" keeps it hoverable and focusable while
         disabled; the hidden description makes the same reason
         available to screen readers.
         "aria-label" binds the checkbox's own input rather than the
         attribute, which it nulls on its host to avoid a duplicate label -->
    <mat-checkbox
      [checked]="state().allowed"
      [disabled]="disabled() || !state().editable"
      [disabledInteractive]="!!state().lockTooltip"
      [matTooltip]="state().lockTooltip"
      [matTooltipDisabled]="!state().lockTooltip"
      [aria-label]="ariaLabel()"
      [aria-describedby]="state().lockTooltip ? lockDescriptionId : null"
      (change)="toggled.emit($event.checked)"
    ></mat-checkbox>
    @if (state().lockTooltip) {
      <span class="visually-hidden" [id]="lockDescriptionId">{{
        state().lockTooltip
      }}</span>
    }
  `,
})
export class PermissionCheckboxComponent {
  readonly state = input.required<PermissionCellState>();

  /**
   * Ties the checkbox to its hidden lock description. Unique per instance, as
   * the two elements only ever have to find each other within this component.
   */
  protected readonly lockDescriptionId = `perm-lock-${nextLockDescriptionId++}`;

  /** disabled for a reason outside the cell itself, e.g. a view-only grid */
  readonly disabled = input(false);

  readonly ariaLabel = input.required<string>();

  readonly toggled = output<boolean>();
}
