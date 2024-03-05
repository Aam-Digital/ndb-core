import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Entity } from "../../entity/model/entity";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";

/**
 * Informs users that the entity is inactive (or anonymized) and provides options to change the status.
 */
@Component({
  selector: "app-entity-archived-info",
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, FontAwesomeModule],
  templateUrl: "./entity-archived-info.component.html",
  styleUrls: ["./entity-archived-info.component.scss"],
})
export class EntityArchivedInfoComponent {
  @Input() entity: Entity;

  constructor(public entityActionsService: EntityActionsService) {}
}
