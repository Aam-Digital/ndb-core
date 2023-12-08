import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PanelComponent } from "../../../entity-details/EntityDetailsConfig";
import { EntityConstructor } from "../../../entity/model/entity";

@Component({
  selector: "app-admin-entity-panel-component",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./admin-entity-panel-component.component.html",
  styleUrl: "./admin-entity-panel-component.component.scss",
})
export class AdminEntityPanelComponentComponent {
  @Input() config: PanelComponent;
  @Input() entityType: EntityConstructor;
}
