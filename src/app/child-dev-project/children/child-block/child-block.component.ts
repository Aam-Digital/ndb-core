import {
  Component,
  Input,
  OnChanges,
  Optional,
  SimpleChanges,
} from "@angular/core";
import { ChildrenService } from "../children.service";
import { Entity } from "../../../core/entity/model/entity";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { NgIf } from "@angular/common";
import { TemplateTooltipDirective } from "../../../core/common-components/template-tooltip/template-tooltip.directive";
import { ChildBlockTooltipComponent } from "./child-block-tooltip/child-block-tooltip.component";
import { DisplayImgComponent } from "../../../features/file/display-img/display-img.component";

@DynamicComponent("ChildBlock")
@Component({
  selector: "app-child-block",
  templateUrl: "./child-block.component.html",
  styleUrls: ["./child-block.component.scss"],
  imports: [
    NgIf,
    TemplateTooltipDirective,
    ChildBlockTooltipComponent,
    DisplayImgComponent,
  ],
  standalone: true,
})
export class ChildBlockComponent implements OnChanges {
  @Input() entity: Entity;
  @Input() entityId: string;

  /** prevent clicks on the component to navigate to the details page */
  @Input() linkDisabled: boolean;

  /** prevent additional details to be displayed in a tooltip on mouse over */
  @Input() tooltipDisabled: boolean;

  icon: string;

  constructor(@Optional() private childrenService: ChildrenService) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("entityId")) {
      this.entity = await this.childrenService.getChild(this.entityId);
      this.icon = this.entity?.getConstructor().icon;
    }
  }
}
