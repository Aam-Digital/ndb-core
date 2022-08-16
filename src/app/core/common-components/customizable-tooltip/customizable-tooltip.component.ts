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
 * This is the component that the tooltip is shown.
 * Usage is intended for internal use only. To display a custom tooltip,
 * refer to the {@link ./customizable-tooltip.directive.ts Customizable Tooltip Directive}
 */
@Component({
  selector: "app-customizable-tooltip",
  templateUrl: "./customizable-tooltip.component.html",
  styleUrls: ["./customizable-tooltip.component.scss"],
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
export class CustomizableTooltipComponent {
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
