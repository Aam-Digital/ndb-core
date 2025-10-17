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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entity) {
      this.filterAvailableActions();
    }
  }

  private async filterAvailableActions() {
    if (!this.entity) {
      this.actions = [];
      return;
    }

    const allActions: EntityAction[] =
      this.entityActionsMenuService.getActionsForSingle(this.entity);

    // check each action’s `visible` property to hide actions not applicable to the current entity
    const visibleActions = (
      await Promise.all(
        allActions.map(async (action) => {
          const isVisible = action.visible
            ? await action.visible(this.entity)
            : true;
          return isVisible ? action : null;
        }),
      )
    ).filter(Boolean) as EntityAction[];

    this.actions = visibleActions;
  }

  async executeAction(action: EntityAction) {
    const result = await action.execute(
      this.entity,
      this.navigateOnDelete && !this.viewContext?.isDialog,
    );
    if (result) {
      this.actionTriggered.emit(action.action);
    }
    setTimeout(() => this.filterAvailableActions());
  }
}
