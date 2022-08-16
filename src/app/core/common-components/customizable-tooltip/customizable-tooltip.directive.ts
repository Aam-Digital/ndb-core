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
import { CustomizableTooltipComponent } from "./customizable-tooltip.component";

@Directive({
  selector: "[appCustomizableTooltip]",
})
export class CustomizableTooltipDirective implements OnInit, OnDestroy {
  @Input() tooltipDisabled: boolean = false;

  @Input() tooltipShown: boolean = true;

  @Input() delayShow: number = 1000;

  @Input() delayHide: number = 150;

  @Input("appCustomizableTooltip") contentTemplate!: TemplateRef<any>;

  private overlayRef!: OverlayRef;

  private tooltipTimeout?: any;

  constructor(
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder,
    private element: ElementRef
  ) {}

  ngOnInit(): void {
    if (!this.tooltipShown) {
      return;
    }
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

  @HostListener("mouseleave")
  onMouseLeave() {
    this.hide();
  }

  private show() {
    if (this.tooltipDisabled) {
      return;
    }
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
    this.tooltipTimeout = setTimeout(() => {
      //attach the component if it has not already attached to the overlay
      if (!this.overlayRef.hasAttached()) {
        const tooltipRef = this.overlayRef.attach(
          new ComponentPortal(CustomizableTooltipComponent)
        );
        tooltipRef.instance.contentTemplate = this.contentTemplate;
        tooltipRef.instance.hide.subscribe(() => this.hide());
        tooltipRef.instance.show.subscribe(() => this.show());
      }
    }, this.delayShow);
  }

  private hide() {
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
    this.tooltipTimeout = setTimeout(
      () => this.overlayRef.detach(),
      this.delayHide
    );
  }
}
