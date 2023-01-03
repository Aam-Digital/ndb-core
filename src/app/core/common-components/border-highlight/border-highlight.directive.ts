import { Directive, HostBinding, Input } from "@angular/core";

/**
 * A directive that applies a colored border to the left side of an element.
 * The color can either be supplied directly via the primary input, i.e.
 * ```html
 * <div appBorderHighlight="red">Highlight me!</div>
 * ```
 * or via a class with a name:
 * ```html
 * <div appBorderHighlight borderClass="some-class">Highlight me!</div>
 * ```
 */
@Directive({
  selector: "[appBorderHighlight]",
  standalone: true,
})
export class BorderHighlightDirective {
  readonly CLASS_NAME = "border-left-highlight";

  @HostBinding("class")
  elementClass = this.CLASS_NAME;

  @HostBinding("style.border-color")
  borderColor: string | boolean = "transparent";

  @Input("appBorderHighlight") set color(value: string | undefined) {
    if (value) {
      this.borderColor = value;
      this.elementClass = this.CLASS_NAME;
    }
  }

  @Input() set borderClass(value: string | undefined) {
    if (value) {
      this.elementClass = this.CLASS_NAME + " " + value;
      this.borderColor = false;
    }
  }
}
