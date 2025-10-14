import { Component, computed, inject, input, output } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Entity } from "../../entity/model/entity";
import { EntityActionsMenuService } from "../entity-actions-menu/entity-actions-menu.service";
import { EntityAction } from "../entity-actions-menu/entity-action.interface";
import {
  BasicAutocompleteComponent,
  BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
} from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-entity-bulk-actions",
  templateUrl: "./entity-bulk-actions.component.html",
  styleUrls: ["./entity-bulk-actions.component.scss"],
  standalone: true,
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    BasicAutocompleteComponent,
    ...BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
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
  actionControl = new FormControl();
  actionToString = (action: EntityAction) => action?.label || "";

  constructor() {
    this.actionControl.valueChanges.subscribe((action) => {
      if (action) this.onActionSelected(action);
    });
  }

  onActionSelected(action: EntityAction) {
    this.actionTriggered.emit(action);
    this.actionControl.setValue(null, { emitEvent: false });
  }
}
