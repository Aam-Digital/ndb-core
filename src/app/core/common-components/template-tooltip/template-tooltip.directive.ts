import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
} from "@angular/core";
import {
  Overlay,
  OverlayPositionBuilder,
  OverlayRef,
} from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { TemplateTooltipComponent } from "./template-tooltip.component";

/**
 * A directive that can be used to render a custom tooltip that may contain HTML code.
 * When a tooltip is only a string, the {@code MatTooltip} should be used instead.
 *
 * The Tooltip to render is provided as a template. This template is also the main argument
 * to this directive. Place the directive on the HTML-Element where the tooltip should pop out
 * when hovered over.
 *
 * @example
 * <div [appTemplateTooltip]="tooltip">Hover here to show the tooltip</div>
 * <ng-template #tooltip>
 *   Custom tooltip <i>with</i> HTML-Elements
 * </ng-template>
 *
 * @see contentTemplate
 */
@Directive({
  selector: "[appTemplateTooltip]",
  standalone: true,
})
export class TemplateTooltipDirective implements OnInit, OnDestroy {
  /**
   * Whether to disable the tooltip, so it won't ever be shown
   */
  @Input() tooltipDisabled: boolean = false;

  /**
   * The amount of time in milliseconds that the user has to hover over the element before the tooltip
   * is shown
   */
  @Input() delayShow: number = 1000;

  /**
   * The amount of time in milliseconds that the user's mouse has to leave the tooltip before it will
   * be hidden
   */
  @Input() delayHide: number = 150;

  /**
   * The template that is shown in the tooltip.
   * You can get the template ref of an HTML-Element by using the `#<template name>` syntax.
   * An `<ng-template>` Element won't be shown to the user by default. Therefore, it is the most commonly
   * used element.
   *
   * @example
   * <div [appTemplateTooltip]="tooltip">Hover here to show the tooltip</div>
   * <ng-template #tooltip>
   *   Custom tooltip <i>with</i> HTML-Elements
   * </ng-template>
   */
  @Input("appTemplateTooltip") contentTemplate!: TemplateRef<any>;

  /**
   * Reference to the overlay (the Tooltip) to control the visibility of the tooltip
   * @private
   */
  private overlayRef!: OverlayRef;

  /**
   * The timeout used to deal both with the show-delay and the hide-delay
   * @see delayHide
   * @see delayShow
   * @private
   */
  private timeoutRef?: ReturnType<typeof setTimeout>;

  constructor(
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder,
    private element: ElementRef
  ) {}

  ngOnInit(): void {
    // Create a position strategy that determines where the overlay is positioned.
    // In this case, it should be positioned at the bottom-center of the element.
    const positionStrategy = this.overlayPositionBuilder
      .flexibleConnectedTo(this.element)
      .withPositions([
        {
          originX: "center",
          originY: "bottom",
          overlayX: "center",
          overlayY: "top",
          offsetY: 5,
        },
      ]);

    this.overlayRef = this.overlay.create({ positionStrategy });
  }

  ngOnDestroy() {
    this.hide();
  }

  @HostListener("mouseenter")
  onMouseEnter() {
    this.show();
  }

  @HostListener("mouseleave", ["$event.relatedTarget"])
  onMouseLeave(relatedTarget: HTMLElement) {
    // This ensures that `hide` is not called when the popup overlaps the element that this directive is on.
    // If the method was called, the popup would flicker; disappearing (because of this method) and then
    // re-appearing because of the `mouseenter` method.
    if (
      relatedTarget?.tagName !== TemplateTooltipComponent.SELECTOR.toUpperCase()
    )
      this.hide();
  }

  /**
   * Show the tooltip unless
   * - it is disabled or
   * - it is already shown
   * @private
   */
  private show() {
    if (this.tooltipDisabled) {
      return;
    }
    // clear the timeout so that when the user hovers twice the last hover action is used.
    // Also clears the timeout from `hide`
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }
    // show the tooltip after `delayShown` milliseconds when it is not already shown
    this.timeoutRef = setTimeout(() => {
      //attach the component if it has not already attached to the overlay
      if (!this.overlayRef.hasAttached()) {
        const tooltipRef = this.overlayRef.attach(
          new ComponentPortal(TemplateTooltipComponent)
        );
        tooltipRef.instance.contentTemplate = this.contentTemplate;
        tooltipRef.instance.hide.subscribe(() => this.hide());
        tooltipRef.instance.show.subscribe(() => this.show());
      }
    }, this.delayShow);
  }

  /**
   * Hide the tooltip unconditionally
   * When the tooltip is already hidden, this operation is a noop
   * @private
   */
  private hide() {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }
    this.timeoutRef = setTimeout(
      () => this.overlayRef.detach(),
      this.delayHide
    );
  }
}
