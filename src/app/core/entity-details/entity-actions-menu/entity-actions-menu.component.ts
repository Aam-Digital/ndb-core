import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { EntityRemoveService } from "../../entity/entity-remove.service";
import { Entity } from "../../entity/model/entity";
import { NgForOf, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { Angulartics2Module } from "angulartics2";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { EntityAction } from "../../permissions/permission-types";
import { MatTooltipModule } from "@angular/material/tooltip";

export type EntityMenuAction = "archive" | "anonymize" | "delete";

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

  @Output() actionTriggered = new EventEmitter<EntityMenuAction>();

  /**
   * The default actions being displayed as menu items.
   */
  actions: {
    action: EntityMenuAction;
    permission?: EntityAction;
    icon: IconProp;
    label: string;
    tooltip?: string;
  }[] = [
    {
      action: "archive",
      permission: "update",
      icon: "box-archive",
      label: $localize`:entity context menu:Archive`,
      tooltip: $localize`:entity context menu tooltip:Mark the record as inactive, hiding it from lists by default while keeping the data.`,
    },
    {
      action: "anonymize",
      permission: "update", // TODO: add permission
      icon: "user-secret",
      label: $localize`:entity context menu:Anonymize`,
      tooltip: $localize`:entity context menu tooltip:Remove all personal data and keep an archived basic record for statistical reporting.`,
    },
    {
      action: "delete",
      permission: "delete",
      icon: "trash",
      label: $localize`:entity context menu:Delete`,
      tooltip: $localize`:entity context menu tooltip:Remove the record completely from the database.`,
    },
  ];

  constructor(private entityRemoveService: EntityRemoveService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entity) {
      this.filterAvailableActions();
    }
  }

  private filterAvailableActions() {
    this.actions = this.actions.filter((action) => {
      if (this.entity?.anonymized) {
        return action.action !== "anonymize" && action.action !== "archive";
      }
      if (!this.entity?.isActive) {
        return action.action !== "archive";
      }
      return true;
    });
  }

  async executeAction(action: EntityMenuAction) {
    const result = await this.entityRemoveService[action](this.entity);
    if (result) {
      this.actionTriggered.emit(action);
    }
  }
}
