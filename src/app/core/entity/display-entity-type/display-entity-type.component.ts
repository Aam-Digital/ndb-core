import { Component, OnInit } from "@angular/core";
import { EntityTypeLabelPipe } from "app/core/common-components/entity-type-label/entity-type-label.pipe";
import { ViewDirective } from "../default-datatype/view.directive";
import { asArray } from "app/utils/asArray";
import { CommonModule, NgFor } from "@angular/common";

@Component({
  selector: "app-display-entity-type",
  standalone: true,
  imports: [EntityTypeLabelPipe, CommonModule],
  templateUrl: "./display-entity-type.component.html",
  styleUrls: ["./display-entity-type.component.scss"],
})
export class DisplayEntityTypeComponent
  extends ViewDirective<string[] | string, string>
  implements OnInit
{
  readonly aggregationThreshold = 5;
  entityIds: string[] = [];

  async ngOnInit() {
    this.entityIds = this.value ? asArray(this.value) : [];
  }
}
