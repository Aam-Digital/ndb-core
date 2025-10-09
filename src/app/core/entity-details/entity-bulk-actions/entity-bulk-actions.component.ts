import { Component, computed, inject, input, output } from "@angular/core";
import {
  FaIconComponent,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatIconModule } from "@angular/material/icon";
import { Entity } from "../../entity/model/entity";
import { EntityActionsMenuService } from "../entity-actions-menu/entity-actions-menu.service";
import { EntityAction } from "../entity-actions-menu/entity-action.interface";

@Component({
  selector: "app-entity-bulk-actions",
  templateUrl: "./entity-bulk-actions.component.html",
  standalone: true,
  imports: [
    FontAwesomeModule,
    FaIconComponent,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatIconModule,
  ],
})
export class EntityBulkActionsComponent {
  // List of selected entities for bulk actions
  entities = input.required<Entity[]>();
  actionTriggered = output<EntityAction>();

  private readonly actionsService = inject(EntityActionsMenuService);

  // Compute available bulk actions for the current selection
  bulkActions = computed(() =>
    this.actionsService.getBulkActions().filter((action) => !!action),
  );

  onActionClick(action: EntityAction) {
    this.actionTriggered.emit(action);
  }
}
