import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
} from "@angular/core";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";

/**
 * This is the component that the tooltip is shown. It serves the following purposes:
 *
 * - Rendering the actual tooltip
 * - Animating when the tooltip appears
 * - giving each tooltip the same border and background
 *
 * Usage is intended for internal use only. To display a custom tooltip,
 * refer to the {@link ./template-tooltip.directive.ts Template Tooltip Directive}
 */
@Component({
  selector: TemplateTooltipComponent.SELECTOR,
  templateUrl: "./template-tooltip.component.html",
  styleUrls: ["./template-tooltip.component.scss"],
  animations: [
    trigger("appear", [
      state(
        "void",
        style({
          transform: "scale(0)",
        })
      ),
      state(
        "*",
        style({
          transform: "scale(1)",
        })
      ),
      transition(":enter", [animate("100ms")]),
    ]),
  ],
})
export class TemplateTooltipComponent {
  static readonly SELECTOR = "app-template-tooltip";
  /**
   * This provides finer control on the content to be visible on the tooltip
   * This template will be injected in ToolTipRenderer directive in the consumer template
   * <ng-template #template>
   *  content.....
   * </ng-template>
   */
  @Input() contentTemplate: TemplateRef<any>;

  @Output() hide = new EventEmitter<void>();

  @Output() show = new EventEmitter<void>();
}
