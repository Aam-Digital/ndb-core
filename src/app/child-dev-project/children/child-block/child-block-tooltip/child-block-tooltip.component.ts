import { Component, Input } from "@angular/core";
import { Child } from "../../model/child";

/**
 * Tooltip that is shown when hovering over a child block and the tooltip is enabled.
 */
@Component({
  selector: "app-child-block-tooltip",
  templateUrl: "./child-block-tooltip.component.html",
  styleUrls: ["./child-block-tooltip.component.scss"],
})
export class ChildBlockTooltipComponent {
  /** The entity to show the tooltip for */
  @Input() entity: Child;
}
