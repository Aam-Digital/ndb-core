import { Component, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PanelComponent } from "../../../entity-details/EntityDetailsConfig";
import { EntityConstructor } from "../../../entity/model/entity";
import { ColumnConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { ReorderableListComponent } from "app/utils/reorderable-list/reorderable-list.component";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import {
  RELATED_ENTITIES_DEFAULT_CONFIGS,
  RELATED_ENTITY_OVERRIDES,
} from "app/utils/related-entities-default-config";
import { FormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import {
  ConfirmationDialogComponent,
  YesNoButtons,
} from "app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { lastValueFrom } from "rxjs";
import { RelatedEntityConfig } from "#src/app/core/entity-details/related-entity-config";

@Component({
  selector: "app-admin-entity-panel-component",
  imports: [
    CommonModule,
    ReorderableListComponent,
    EntityTypeSelectComponent,
    MatFormFieldModule,
    FormsModule,
  ],
  templateUrl: "./admin-entity-panel-component.component.html",
  styleUrl: "./admin-entity-panel-component.component.scss",
})
export class AdminEntityPanelComponentComponent implements OnInit {
  @Input() config: PanelComponent;
  @Input() entityType: EntityConstructor;

  allFields: ColumnConfig[] = [];
  /** Stores the currently active/selected field IDs to be shown in the panel */
  activeFields: string[];
  // Represents the entity type that current panel is linked to
  targetEntityType: EntityConstructor;

  entityTypeModel: string;
  isDialogOpen = false;

  constructor(
    private entities: EntityRegistry,
    private dialog: MatDialog,
  ) {}
  ngOnInit(): void {
    if (!this.config.config?.entityType) return;
    this.entityTypeModel = this.config.config.entityType;
    this.targetEntityType = this.entities.get(this.entityTypeModel);
    this.initializeFields();
  }

  private initializeFields(): void {
    console.log(this.config);
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

  async onEntityTypeChange(newType: string | string[]) {
    if (
      Array.isArray(newType) ||
      newType === this.config.config.entityType ||
      this.isDialogOpen
    )
      return;

    this.isDialogOpen = true;
    const confirmed = await this.confirmEntityTypeChange();
    this.isDialogOpen = false;

    if (!confirmed) {
      this.entityTypeModel = this.config.config.entityType;
      return;
    }

    this.updateConfigForNewEntityType(newType);
    this.applyCustomOverrides(newType);

    this.activeFields = [];
    this.initializeFields();
  }

  private async confirmEntityTypeChange(): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: "Change Entity Type",
        text: "Changing the entity type will discard selected fields. Continue?",
        buttons: YesNoButtons,
        closeButton: true,
      },
      width: "400px",
    });

    return await lastValueFrom(dialogRef.afterClosed());
  }

  /**
   * Updates the configuration and component reference based on the newly selected entity type.
   * This resets the target entity type, sets the new entity type in the config,
   * and applies default column configurations if available.
   *
   * @param newType - The new entity type selected.
   */
  private updateConfigForNewEntityType(newType: string) {
    this.entityTypeModel = newType;
    this.config.config.entityType = newType;
    this.targetEntityType = this.entities.get(newType);

    const matchingEntry = Object.entries(RELATED_ENTITIES_DEFAULT_CONFIGS).find(
      ([_, value]) => value.entityType === newType,
    );

    if (matchingEntry) {
      const [componentKey, defaults] = matchingEntry;
      this.config.component = componentKey;
      this.config.config.columns = [...(defaults.columns ?? [])];
    } else {
      this.config.config.columns = [];
    }
  }

  /**
   * Applies custom configuration overrides for specific entity types.
   * This is used to customize properties such as component name, loader method, or additional config values.
   *
   * @param newType - The new entity type being configured.
   */
  private applyCustomOverrides(newType: string) {
    delete this.config.config.loaderMethod;
    delete this.config.config.property;
    const overrideRelatedConfig: RelatedEntityConfig =
      RELATED_ENTITY_OVERRIDES[newType];

    if (overrideRelatedConfig) {
      this.config.component = overrideRelatedConfig.component;
      this.config.config = {
        ...this.config.config,
        ...overrideRelatedConfig,
      };
    }
  }
}
