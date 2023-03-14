import { Component, Input } from "@angular/core";
import { Child } from "../../model/child";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NgForOf, NgIf } from "@angular/common";
import { SchoolBlockComponent } from "../../../schools/school-block/school-block.component";

/**
 * Tooltip that is shown when hovering over a child block and the tooltip is enabled.
 */
@Component({
  selector: "app-child-block-tooltip",
  templateUrl: "./child-block-tooltip.component.html",
  styleUrls: ["./child-block-tooltip.component.scss"],
  imports: [FontAwesomeModule, NgIf, SchoolBlockComponent, NgForOf],
  standalone: true,
})
export class ChildBlockTooltipComponent {
  /** The entity to show the tooltip for */
  @Input() entity: Child;
}
