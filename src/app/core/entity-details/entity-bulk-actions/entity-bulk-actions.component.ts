import { Component, computed, inject, input, output } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Entity } from "../../entity/model/entity";
import { AlertService } from "../../alerts/alert.service";
import { EntityActionsMenuService } from "../entity-actions-menu/entity-actions-menu.service";
import { EntityAction } from "../entity-actions-menu/entity-action.interface";
import {
  BasicAutocompleteComponent,
  BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
} from "../../common-components/basic-autocomplete/basic-autocomplete.component";

@Component({
  selector: "app-entity-bulk-actions",
  templateUrl: "./entity-bulk-actions.component.html",
  standalone: true,
  imports: [
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
  private readonly alertService = inject(AlertService);

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
    if (!this.entities() || this.entities().length === 0) {
      this.alertService.addInfo(
        $localize`Please select at least one record before performing a bulk action.`,
      );
      this.actionControl.setValue(null, { emitEvent: false });
      return;
    }
    this.actionTriggered.emit(action);
    this.actionControl.setValue(null, { emitEvent: false });
  }
}
