import { AfterViewInit, Component, ElementRef, Input, Renderer2, TemplateRef, ViewChild, inject } from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgTemplateOutlet } from "@angular/common";

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
    style="display: inline"
    #wrapper
  >
    <ng-container *ngTemplateOutlet="template"></ng-container>
  </div>`,
  imports: [MatTooltipModule, NgTemplateOutlet],
})
export class DisabledWrapperComponent implements AfterViewInit {
  private renderer = inject(Renderer2);

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

  ngAfterViewInit() {
    if (!this.wrapper) {
      return;
    }

    const buttonElement =
      this.wrapper.nativeElement.getElementsByTagName("button")[0];

    if (!buttonElement) {
      return;
    }

    if (this.elementDisabled) {
      this.disable(buttonElement);
    } else {
      this.enable(buttonElement);
    }
  }

  private enable(buttonElement: HTMLButtonElement) {
    this.renderer.removeAttribute(buttonElement, "disabled");
    this.renderer.removeClass(buttonElement, "mat-button-disabled");
  }

  private disable(buttonElement: HTMLButtonElement) {
    this.renderer.addClass(buttonElement, "mat-button-disabled");
    this.renderer.setAttribute(buttonElement, "disabled", "true");
  }
}
