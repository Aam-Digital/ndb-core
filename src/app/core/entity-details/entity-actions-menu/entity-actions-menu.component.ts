import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Optional,
  Output,
  SimpleChanges,
} from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { NgForOf, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { Angulartics2Module } from "angulartics2";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ViewComponentContext } from "../../ui/abstract-view/abstract-view.component";
import { EntityActionsMenuService } from "./entity-actions-menu.service";
import { EntityAction } from "./entity-action.interface";

@Component({
  selector: "app-entity-actions-menu",
  templateUrl: "./entity-actions-menu.component.html",
  styleUrls: ["./entity-actions-menu.component.scss"],
  standalone: true,
  imports: [
    NgIf,
    MatButtonModule,
    FontAwesomeModule,
    MatMenuModule,
    Angulartics2Module,
    DisableEntityOperationDirective,
    NgForOf,
    MatTooltipModule,
  ],
})
export class EntityActionsMenuComponent implements OnChanges {
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

  constructor(
    private entityActionsMenuService: EntityActionsMenuService,
    @Optional() protected viewContext: ViewComponentContext,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entity) {
      this.filterAvailableActions();
    }
  }

  private filterAvailableActions() {
    this.actions = this.entityActionsMenuService
      .getActions()
      .filter((action) => {
        if (!this.entity) {
          return false;
        }

        switch (action.action) {
          case "archive":
            return this.entity.isActive && !this.entity.anonymized;
          case "anonymize":
            return (
              !this.entity.anonymized && this.entity.getConstructor().hasPII
            );
          default:
            return true;
        }
      });
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
