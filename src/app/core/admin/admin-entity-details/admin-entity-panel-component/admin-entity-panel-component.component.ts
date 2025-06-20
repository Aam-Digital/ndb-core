import { Component, Input } from "@angular/core";
import { PanelComponent } from "../../../entity-details/EntityDetailsConfig";
import { EntityConstructor } from "../../../entity/model/entity";

@Component({
  selector: "app-admin-entity-panel-component",
  imports: [],
  templateUrl: "./admin-entity-panel-component.component.html",
  styleUrl: "./admin-entity-panel-component.component.scss",
})
export class AdminEntityPanelComponentComponent {
  @Input() config: PanelComponent;
  @Input() entityType: EntityConstructor;
}
