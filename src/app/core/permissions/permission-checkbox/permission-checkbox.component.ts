import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatTooltipModule } from "@angular/material/tooltip";

import { EntityActionPermission } from "../permission-types";

/**
 * What a permission grid has to tell this component about one checkbox.
 * The grids extend it with the state they need for their own editing.
 */
export interface PermissionCellState {
  /** shown as granted, either by an own rule of this row or by a broader one */
  allowed: boolean;
  /** whether the checkbox may be changed on this row */
  editable: boolean;
  /** why the checkbox cannot be changed; empty when it is editable */
  lockTooltip: string;
  /**
   * id of the hidden element repeating {@link lockTooltip} for screen readers,
   * which do not announce the tooltip of a checkbox they cannot change.
   * Empty when the cell is editable.
   */
  lockDescriptionId: string;
}

/**
 * Stable id of the hidden element describing why a cell's checkbox is locked.
 * Derived from the row and action rather than a row index, so it stays the same
 * when rows are added or removed.
 */
export function lockDescriptionId(
  row: string,
  action: EntityActionPermission,
): string {
  return `perm-lock-${row}-${action}`;
}

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
         available to screen readers -->
    <mat-checkbox
      [checked]="state().allowed"
      [disabled]="disabled() || !state().editable"
      [disabledInteractive]="!!state().lockTooltip"
      [matTooltip]="state().lockTooltip"
      [matTooltipDisabled]="!state().lockTooltip"
      [attr.aria-label]="ariaLabel()"
      [aria-describedby]="state().lockDescriptionId || null"
      (change)="toggled.emit($event.checked)"
    ></mat-checkbox>
    @if (state().lockTooltip) {
      <span class="visually-hidden" [id]="state().lockDescriptionId">{{
        state().lockTooltip
      }}</span>
    }
  `,
})
export class PermissionCheckboxComponent {
  readonly state = input.required<PermissionCellState>();

  /** disabled for a reason outside the cell itself, e.g. a view-only grid */
  readonly disabled = input(false);

  readonly ariaLabel = input.required<string>();

  readonly toggled = output<boolean>();
}
