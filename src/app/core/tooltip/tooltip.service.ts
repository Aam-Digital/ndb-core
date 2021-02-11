import { ElementRef, Injectable } from "@angular/core";
import {
  Overlay,
  OverlayPositionBuilder,
  OverlayRef,
} from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { TooltipComponent } from "./tooltip/tooltip.component";

@Injectable({
  providedIn: "root",
})
export class TooltipService {
  constructor(
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder
  ) {}

  public createTooltip(elementRef: ElementRef): OverlayRef {
    const positionStrategy = this.overlayPositionBuilder
      .flexibleConnectedTo(elementRef)
      .withPositions([
        {
          originX: "center",
          originY: "top",
          overlayX: "center",
          overlayY: "bottom",
        },
      ]);
    return this.overlay.create({ positionStrategy });
  }

  public showTooltip(overlayRef: OverlayRef, text: string) {
    const tooltipPortal = new ComponentPortal(TooltipComponent);
    const tooltipRef = overlayRef.attach(tooltipPortal);
    tooltipRef.instance.text = text;
  }

  public hideTooltip(overlayRef: OverlayRef) {
    overlayRef.detach();
  }
}
