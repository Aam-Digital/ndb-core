import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  NgZone,
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
import { NgTemplateOutlet } from "@angular/common";

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
  template: '<ng-container *ngTemplateOutlet="contentTemplate"></ng-container>',
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
  standalone: true,
  imports: [NgTemplateOutlet],
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

  constructor(zone: NgZone, el: ElementRef<HTMLElement>) {
    zone.runOutsideAngular(() => {
      el.nativeElement.addEventListener("mouseenter", () => this.show.emit());
      el.nativeElement.addEventListener("mouseleave", (ev) => this.hide.emit());
    });
  }

  @HostBinding("@appear") animation = true;
}
