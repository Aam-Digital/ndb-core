import {
  Component,
  ElementRef,
  NgZone,
  TemplateRef,
  inject,
  ChangeDetectionStrategy,
  input,
  output,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: TemplateTooltipComponent.SELECTOR,
  template:
    '<ng-container *ngTemplateOutlet="contentTemplate()"></ng-container>',
  styleUrls: ["./template-tooltip.component.scss"],
  animations: [
    trigger("appear", [
      state(
        "void",
        style({
          transform: "scale(0)",
        }),
      ),
      state(
        "*",
        style({
          transform: "scale(1)",
        }),
      ),
      transition(":enter", [animate("100ms")]),
    ]),
  ],
  host: {
    "[@appear]": "true",
  },
  imports: [NgTemplateOutlet],
})
export class TemplateTooltipComponent {
  static readonly SELECTOR = "app-template-tooltip";

  contentTemplate = input<TemplateRef<any>>();

  hide = output<void>();

  show = output<void>();

  constructor() {
    const zone = inject(NgZone);
    const el = inject<ElementRef<HTMLElement>>(ElementRef);

    zone.runOutsideAngular(() => {
      el.nativeElement.addEventListener("mouseenter", () => this.show.emit());
      el.nativeElement.addEventListener("mouseleave", () => this.hide.emit());
    });
  }
}
