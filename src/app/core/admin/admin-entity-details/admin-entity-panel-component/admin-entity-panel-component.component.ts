import { Component, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PanelComponent } from "../../../entity-details/EntityDetailsConfig";
import { EntityConstructor } from "../../../entity/model/entity";
import { ColumnConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityFieldsMenuComponent } from "app/core/common-components/entity-fields-menu/entity-fields-menu.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { ReorderableListComponent } from "app/utils/reorderable-list/reorderable-list.component";
import { EntityFieldLabelComponent } from "app/core/common-components/entity-field-label/entity-field-label.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
  selector: "app-admin-entity-panel-component",
  imports: [
    CommonModule,
    EntityFieldsMenuComponent,
    ReorderableListComponent,
    EntityFieldLabelComponent,
    FontAwesomeModule,
  ],
  templateUrl: "./admin-entity-panel-component.component.html",
  styleUrls: [
    "./admin-entity-panel-component.component.scss",
    "../../admin-entity-list/admin-entity-list.component.scss",
  ],
})
export class AdminEntityPanelComponentComponent implements OnInit {
  @Input() config: PanelComponent;
  @Input() entityType: EntityConstructor;

  allFields: ColumnConfig[] = [];
  /** Stores the currently active/selected field IDs to be shown in the panel */
  activeFields: string[];
  // Represents the entity type that current panel is linked to
  targetEntityType: EntityConstructor;

  constructor(private entities: EntityRegistry) {}

  ngOnInit(): void {
    if (!this.config.config?.entityType) return;
    this.targetEntityType = this.entities.get(this.config.config?.entityType);
    this.initializeFields();
  }

  private initializeFields(): void {
    if (!this.targetEntityType) return;
    const targetEntitySchemaFields = Array.from(
      this.targetEntityType.schema.keys(),
    );
    this.activeFields = (this.config.config.columns ?? []).map((col) =>
      typeof col === "string" ? col : col.id,
    );
    this.allFields = [...this.activeFields, ...targetEntitySchemaFields];
  }

  /**
   * Updates the active fields and synchronizes the config columns accordingly.
   * @param activeFields - selected list of active field IDs to be displayed.
   */
  updateFields(activeFields: string[]) {
    if (!Array.isArray(activeFields)) {
      activeFields = [];
    }

    this.activeFields = [...activeFields];
    this.config.config.columns = this.activeFields.map(
      (fieldId) =>
        this.config.config.columns.find(
          (existingFields) => existingFields.id === fieldId,
        ) ?? { id: fieldId },
    );
  }
}
