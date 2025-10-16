import { Component, inject, input, output, resource } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Entity } from "../../entity/model/entity";
import { EntityActionsMenuService } from "../entity-actions-menu/entity-actions-menu.service";
import { EntityAction } from "../entity-actions-menu/entity-action.interface";
import {
  BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  BasicAutocompleteComponent,
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
  /**
   * List of selected entities for bulk actions
   */
  entities = input.required<Entity[]>();

  /**
   * Event emitted when the bulk action mode should be exited
   * after an action was executed or the user cancelled the bulk actions.
   */
  resetBulkActionMode = output();

  private readonly actionsService = inject(EntityActionsMenuService);
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Available bulk actions for the current selection
   */
  bulkActions = resource({
    params: () => ({ entities: this.entities() }),
    loader: async ({ params }) => {
      const bulkActions = await this.actionsService.getActionsForBulk(
        params.entities,
      );
      return bulkActions
        .map((action) => {
          if (action.action === "merge") {
            return {
              ...action,
              disabled: !this.entities() || this.entities().length !== 2,
            };
          }
          return action;
        })
        .filter((action) => !!action);
    },
    defaultValue: [],
  });

  actionControl = new FormControl();
  actionToString = (action: EntityAction) => action?.label || "";

  constructor() {
    this.actionControl.valueChanges.subscribe((action) => {
      if (action) this.onActionSelected(action);
    });
  }

  async onActionSelected(action: EntityAction) {
    if (
      action.action === "merge" &&
      (!this.entities() || this.entities().length !== 2)
    ) {
      this.snackBar.open(
        $localize`:bulk merge error:Please select exactly two records to perform merge.`,
        undefined,
        { duration: 4000 },
      );
      this.actionControl.setValue(null, { emitEvent: false });
      return;
    }

    // If the action has an execute method, call it with selectedRows
    if (action && typeof action.execute === "function") {
      await action.execute(this.entities());
    }

    this.resetBulkActionMode.emit();
    this.actionControl.setValue(null, { emitEvent: false });
  }

  cancel() {
    this.resetBulkActionMode.emit();
  }
}
