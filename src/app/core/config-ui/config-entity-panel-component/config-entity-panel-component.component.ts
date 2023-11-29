import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PanelComponent } from "../../entity-details/EntityDetailsConfig";
import { EntityConstructor } from "../../entity/model/entity";

@Component({
  selector: "app-config-entity-panel-component",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./config-entity-panel-component.component.html",
  styleUrl: "./config-entity-panel-component.component.scss",
})
export class ConfigEntityPanelComponentComponent {
  @Input() config: PanelComponent;
  @Input() entityType: EntityConstructor;
}
