import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { BASELINE_NOTE, ChangeAction } from "../change-history.types";

/** Display metadata for one {@link ChangeAction} badge. */
interface ActionMeta {
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
 * Display metadata per action. Orange is reserved for app chrome, so even
 * `imported` uses an orange-tint background with deep-orange text — never the
 * brand primary fill.
 */
const ACTION_META: Record<ChangeAction, ActionMeta> = {
  baseline: {
    icon: "clock-rotate-left",
    label: $localize`:Change action badge:Initial snapshot`,
    background: "#ECEFF1",
    color: "#4a525c",
    tooltip: BASELINE_NOTE,
  },
  created: {
    icon: "circle-plus",
    label: $localize`:Change action badge:Created`,
    background: "#E6F4EA",
    color: "#1E6C33",
  },
  updated: {
    icon: "pen-to-square",
    label: $localize`:Change action badge:Updated`,
    background: "#CCEFFF",
    color: "#1565C0",
  },
  deleted: {
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
export class ChangeHistoryActionBadgeComponent {
  readonly action = input.required<ChangeAction>();
  /** display metadata, falling back to `updated` for any unknown action */
  readonly meta = computed(
    () => ACTION_META[this.action()] ?? ACTION_META.updated,
  );
}
