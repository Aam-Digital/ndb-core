import { Component, OnInit } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EntityBlockComponent } from "../../entity/entity-block/entity-block.component";
import { asArray } from "../../../../utils/utils";

@DynamicComponent("DisplayEntity")
@Component({
  selector: "app-display-entity",
  templateUrl: "./display-entity.component.html",
  styleUrls: ["./display-entity.component.scss"],
  imports: [EntityBlockComponent],
  standalone: true,
})
export class DisplayEntityComponent
  extends ViewDirective<string[] | string, string>
  implements OnInit
{
  readonly aggregationThreshold = 5;
  entityIds: string[];

  async ngOnInit() {
    this.entityIds = this.value ? asArray(this.value) : [];
  }
}
