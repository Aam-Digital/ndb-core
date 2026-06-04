import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { actionMetaFor, ChangeAction } from "../change-history.types";

/**
 * A small colored pill showing the icon + label of a change action
 * (Created / Updated / Deleted / Baseline / ...).
 */
@Component({
  selector: "app-change-history-action-badge",
  standalone: true,
  imports: [FaDynamicIconComponent],
  template: `<span
    class="badge"
    [style.background-color]="meta().background"
    [style.color]="meta().color"
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
  readonly meta = computed(() => actionMetaFor(this.action()));
}
