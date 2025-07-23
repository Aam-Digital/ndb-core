import { Component, Input, inject } from "@angular/core";
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
  imports: [MatCardModule, MatButtonModule, FontAwesomeModule],
  templateUrl: "./entity-archived-info.component.html",
  styleUrls: ["./entity-archived-info.component.scss"],
})
export class EntityArchivedInfoComponent {
  entityActionsService = inject(EntityActionsService);

  @Input() entity: Entity;
}
