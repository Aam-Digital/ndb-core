import {
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  ChangeDetectionStrategy,
  input,
  output,
} from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FaDynamicIconComponent } from "../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { MatMenuModule } from "@angular/material/menu";
import { Angulartics2Module } from "angulartics2";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ViewComponentContext } from "../../ui/abstract-view/view-component-context";
import { EntityActionsMenuService } from "./entity-actions-menu.service";
import { EntityAction } from "./entity-action.interface";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    FaDynamicIconComponent,
  ],
})
export class EntityActionsMenuComponent {
  private entityActionsMenuService = inject(EntityActionsMenuService);
  protected viewContext = inject(ViewComponentContext, { optional: true });
  private readonly dialogRef = inject(MatDialogRef, { optional: true });
  private readonly cdr = inject(ChangeDetectorRef);

  entity = input<Entity>();

  /**
   * whether the "delete" action will trigger a navigation back to the parent list.
   * This is useful when the entity is deleted from a fullscreen detail view but not for an overlay.
   */
  navigateOnDelete = input<boolean>(false);

  actionTriggered = output<string>();

  /**
   * The actions being displayed as menu items.
   */
  actions: EntityAction[];

  /**
   * Whether some buttons should be displayed directly, outside the three-dot menu in dialog views.
   */
  showExpanded = input<boolean | undefined>();

  constructor() {
    effect((onCleanup) => {
      const entity = this.entity();
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      void this.filterAvailableActions(entity, () => cancelled);
    });
  }

  private async filterAvailableActions(
    entity: Entity | undefined,
    isCancelled: () => boolean,
  ) {
    if (!entity) {
      this.actions = [];
      this.cdr.markForCheck();
      return;
    }

    const allActions =
      await this.entityActionsMenuService.getActionsForSingle(entity);
    if (isCancelled()) {
      return;
    }
    this.actions = allActions;
    this.cdr.markForCheck();
  }

  async executeAction(action: EntityAction) {
    const entity = this.entity();
    if (!entity) {
      return;
    }
    const result = await action.execute(
      entity,
      this.navigateOnDelete() && !this.viewContext?.isDialog,
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
    setTimeout(() => {
      const currentEntity = this.entity();
      void this.filterAvailableActions(currentEntity, () => false);
    });
  }
}
