import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  Renderer2,
  TemplateRef,
  ViewChild,
} from "@angular/core";

/**
 * This component is used to display a tooltip when a element is elementDisabled.
 * Normally, tooltips are not shown on elementDisabled elements, therefore this component creates the tooltip on a wrapping
 * div.
 */
@Component({
  selector: "app-disabled-wrapper",
  template: ` <div
    [matTooltip]="text"
    [matTooltipDisabled]="!elementDisabled"
    style="display: inline-block"
    #wrapper
  >
    <ng-container *ngTemplateOutlet="template"></ng-container>
  </div>`,
})
export class DisabledWrapperComponent implements AfterViewInit {
  /**
   * A template of an HTMLElement that can be disabled.
   * See https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled
   * for a list of HTML element with the disabled attribute.
   */
  @Input() template: TemplateRef<HTMLElement>;

  /**
   * The text which should be displayed in the tooltip
   */
  @Input() text: string;

  /**
   * Whether the element should be disabled.
   */
  @Input() elementDisabled: boolean;

  @ViewChild("wrapper") wrapper: ElementRef<HTMLDivElement>;
  constructor(private renderer: Renderer2) {}

  ngAfterViewInit() {
    if (this.wrapper) {
      // Disable the element that is rendered inside the div
      const innerElement = this.wrapper.nativeElement.children[0];

      if (this.elementDisabled && innerElement) {
        this.renderer.addClass(innerElement, "mat-button-disabled");
        this.renderer.setAttribute(innerElement, "disabled", "true");
      } else {
        this.renderer.removeAttribute(innerElement, "disabled");
        this.renderer.removeClass(innerElement, "mat-button-disabled");
      }
    }
  }
}
