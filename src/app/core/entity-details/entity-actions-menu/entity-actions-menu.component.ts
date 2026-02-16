import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { Angulartics2Module } from "angulartics2";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ViewComponentContext } from "../../ui/abstract-view/view-component-context";
import { EntityActionsMenuService } from "./entity-actions-menu.service";
import { EntityAction } from "./entity-action.interface";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: "app-entity-actions-menu",
  templateUrl: "./entity-actions-menu.component.html",
  styleUrls: ["./entity-actions-menu.component.scss"],
  imports: [
    MatButtonModule,
    FontAwesomeModule,
    MatMenuModule,
    Angulartics2Module,
    DisableEntityOperationDirective,
    MatTooltipModule,
  ],
})
export class EntityActionsMenuComponent implements OnChanges {
  private entityActionsMenuService = inject(EntityActionsMenuService);
  protected viewContext = inject(ViewComponentContext, { optional: true });
  private readonly dialogRef = inject(MatDialogRef, { optional: true });

  @Input() entity: Entity;

  /**
   * whether the "delete" action will trigger a navigation back to the parent list.
   * This is useful when the entity is deleted from a fullscreen detail view but not for an overlay.
   */
  @Input() navigateOnDelete: boolean = false;

  @Output() actionTriggered = new EventEmitter<string>();

  /**
   * The actions being displayed as menu items.
   */
  actions: EntityAction[];

  /**
   * Whether some buttons should be displayed directly, outside the three-dot menu in dialog views.
   */
  @Input() showExpanded?: boolean;

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes.entity) {
      await this.filterAvailableActions();
    }
  }

  private async filterAvailableActions() {
    if (!this.entity) {
      this.actions = [];
      return;
    }

    const allActions = await this.entityActionsMenuService.getActionsForSingle(
      this.entity,
    );
    this.actions = allActions;
  }

  async executeAction(action: EntityAction) {
    const result = await action.execute(
      this.entity,
      this.navigateOnDelete && !this.viewContext?.isDialog,
    );
    if (result) {
      this.actionTriggered.emit(action.action);

      // Close dialog after successful delete action
      if (
        action.action === "delete" &&
        this.viewContext?.isDialog &&
        this.dialogRef
      ) {
        this.dialogRef.close();
      }
    }
    setTimeout(() => this.filterAvailableActions());
  }
}
