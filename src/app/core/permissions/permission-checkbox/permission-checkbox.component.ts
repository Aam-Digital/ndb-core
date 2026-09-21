import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * The state of one cell of a permission grid, as far as the grids have it in
 * common. They extend it with what they need for their own editing.
 */
export interface PermissionCellState {
  /** shown as granted, either by an own rule of this row or by a broader one */
  allowed: boolean;
  /**
   * Granted by an own rule of this row, ignoring what a broader or inherited
   * rule adds on top. This is the row's own intent: what a condition can be
   * attached to, and what is written back when the row is saved.
   */
  ownAllowed: boolean;
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
