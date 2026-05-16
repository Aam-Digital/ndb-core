import {
  Component,
  ElementRef,
  Renderer2,
  TemplateRef,
  effect,
  inject,
  input,
  viewChild,
  ChangeDetectionStrategy,
} from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgTemplateOutlet } from "@angular/common";

/**
 * This component is used to display a tooltip when a element is elementDisabled.
 * Normally, tooltips are not shown on elementDisabled elements, therefore this component creates the tooltip on a wrapping
 * div.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-disabled-wrapper",
  template: ` <div
    [matTooltip]="text()"
    [matTooltipDisabled]="!elementDisabled()"
    style="display: inline"
    #wrapper
  >
    <ng-container [ngTemplateOutlet]="template()"></ng-container>
  </div>`,
  imports: [MatTooltipModule, NgTemplateOutlet],
})
export class DisabledWrapperComponent {
  private renderer = inject(Renderer2);

  /**
   * A template of an HTMLElement that can be disabled.
   * See https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled
   * for a list of HTML element with the disabled attribute.
   */
  template = input.required<TemplateRef<HTMLElement>>();

  /**
   * The text which should be displayed in the tooltip
   */
  text = input<string>("");

  /**
   * Whether the element should be disabled.
   */
  elementDisabled = input(false);

  wrapper = viewChild<ElementRef<HTMLDivElement>>("wrapper");

  private readonly syncButtonState = effect(() => {
    this.template();
    const wrapper = this.wrapper();
    const elementDisabled = this.elementDisabled();

    if (!wrapper) {
      return;
    }

    const buttonElement =
      wrapper.nativeElement.getElementsByTagName("button")[0];

    if (!buttonElement) {
      return;
    }

    if (elementDisabled) {
      this.disable(buttonElement);
    } else {
      this.enable(buttonElement);
    }
  });

  private enable(buttonElement: HTMLButtonElement) {
    this.renderer.setProperty(buttonElement, "disabled", false);
    this.renderer.removeAttribute(buttonElement, "disabled");
    this.renderer.removeClass(buttonElement, "mat-button-disabled");
    this.renderer.removeClass(buttonElement, "mat-mdc-button-disabled");
  }

  private disable(buttonElement: HTMLButtonElement) {
    this.renderer.setProperty(buttonElement, "disabled", true);
    this.renderer.addClass(buttonElement, "mat-mdc-button-disabled");
    this.renderer.addClass(buttonElement, "mat-button-disabled");
    this.renderer.setAttribute(buttonElement, "disabled", "true");
  }
}
