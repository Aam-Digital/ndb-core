import {
  Component,
  Input,
  OnChanges,
  Optional,
  SimpleChange,
  SimpleChanges,
} from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ChildrenService } from "../children.service";
import { Child } from "../model/child";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { NgIf } from "@angular/common";
import { ChildrenModule } from "../children.module";

@DynamicComponent("ChildBlock")
@Component({
  selector: "app-child-block",
  templateUrl: "./child-block.component.html",
  styleUrls: ["./child-block.component.scss"],
  imports: [NgIf, ChildrenModule],
  standalone: true,
})
export class ChildBlockComponent implements OnInitDynamicComponent, OnChanges {
  @Input() entity: Child;
  @Input() entityId: string;

  /** prevent clicks on the component to navigate to the details page */
  @Input() linkDisabled: boolean;

  /** prevent additional details to be displayed in a tooltip on mouse over */
  @Input() tooltipDisabled: boolean;

  constructor(@Optional() private childrenService: ChildrenService) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("entityId")) {
      this.entity = await this.childrenService.getChild(this.entityId);
    }
  }

  onInitFromDynamicConfig(config: any) {
    this.entity = config.entity;
    if (config.hasOwnProperty("entityId")) {
      this.entityId = config.entityId;
      this.ngOnChanges({
        entityId: new SimpleChange(undefined, config.entityId, true),
      });
    }
    this.linkDisabled = config.linkDisabled;
    this.tooltipDisabled = config.tooltipDisabled;
  }
}
