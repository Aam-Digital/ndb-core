import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { BASELINE_NOTE, ChangeOperation } from "../change-history.types";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";

/** Display metadata for one {@link ChangeOperation} badge. */
interface OperationMeta {
  /** FontAwesome (solid) icon name, resolved via app-fa-dynamic-icon */
  icon: string;
  label: string;
  /** badge background color */
  background: string;
  /** badge text/icon color */
  color: string;
  /** optional hover tooltip explaining the action */
  tooltip?: string;
}

/**
 * Display metadata per operation. The labels are past tense while the keys are
 * the backend's own operation names, so the wording stays a label rather than a
 * second vocabulary the rest of the feature has to map back and forth.
 *
 * Orange is reserved for app chrome, so even `imported` would use an
 * orange-tint background with deep-orange text — never the brand primary fill.
 */
const OPERATION_META: Record<ChangeOperation, OperationMeta> = {
  baseline: {
    icon: "clock-rotate-left",
    label: $localize`:Change action badge:Initial snapshot`,
    background: "#ECEFF1",
    color: "#4a525c",
    tooltip: BASELINE_NOTE,
  },
  create: {
    icon: "circle-plus",
    label: $localize`:Change action badge:Created`,
    background: "#E6F4EA",
    color: "#1E6C33",
  },
  update: {
    icon: "pen-to-square",
    label: $localize`:Change action badge:Updated`,
    background: "#CCEFFF",
    color: "#1565C0",
  },
  delete: {
    icon: "trash",
    label: $localize`:Change action badge:Deleted`,
    background: "#FBE2DE",
    color: "#B23A2C",
  },
};

/**
 * A small colored pill showing the icon + label of a change action
 * (Created / Updated / Deleted / Baseline / ...).
 */
@DynamicComponent("ChangeHistoryActionBadge")
@Component({
  selector: "app-change-history-action-badge",
  standalone: true,
  imports: [FaDynamicIconComponent, MatTooltipModule],
  template: `<span
    class="badge"
    [style.background-color]="meta().background"
    [style.color]="meta().color"
    [matTooltip]="meta().tooltip ?? ''"
  >
    <app-fa-dynamic-icon [icon]="meta().icon"></app-fa-dynamic-icon>
    <span class="label">{{ meta().label }}</span>
  </span>`,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeHistoryActionBadgeComponent extends ViewDirective<ChangeOperation> {
  /**
   * The operation to display, for the callers that have one to hand.
   * As a table column it comes through `value` instead.
   */
  readonly operation = input<ChangeOperation>();

  /** display metadata, falling back to `update` for any unknown operation */
  readonly meta = computed(
    () =>
      OPERATION_META[this.operation() ?? this.value()] ?? OPERATION_META.update,
  );
}
