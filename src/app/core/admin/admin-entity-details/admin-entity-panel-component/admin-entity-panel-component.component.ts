import { Component, Input, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PanelComponent } from "../../../entity-details/EntityDetailsConfig";
import { EntityConstructor } from "../../../entity/model/entity";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import {
  RELATED_ENTITIES_DEFAULT_CONFIGS,
  RELATED_ENTITY_OVERRIDES,
} from "app/utils/related-entities-default-config";
import { FormsModule } from "@angular/forms";
import { YesNoButtons } from "app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { RelatedEntitiesComponentConfig } from "#src/app/core/entity-details/related-entity-config";
import { AdminListManagerComponent } from "#src/app/core/admin/admin-list-manager/admin-list-manager.component";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";

@Component({
  selector: "app-admin-entity-panel-component",
  imports: [
    CommonModule,
    AdminListManagerComponent,
    MatFormFieldModule,
    FormsModule,
    MatOptionModule,
    MatSelectModule,
  ],
  templateUrl: "./admin-entity-panel-component.component.html",
  styleUrl: "./admin-entity-panel-component.component.scss",
})
export class AdminEntityPanelComponentComponent implements OnInit {
  private entities = inject(EntityRegistry);
  private confirmation = inject(ConfirmationDialogService);
  private entityRelationsService = inject(EntityRelationsService);

  @Input() config: PanelComponent;
  @Input() entityType: EntityConstructor;

  entityConstructor: EntityConstructor;
  selectedEntityType: string;
  isDialogOpen = false;

  /** Stores the currently active/selected field IDs to be shown in the panel */
  activeFields: string[];

  /**
   * List of entity types that reference the current entity type.
   */
  availableRelatedEntities: {
    label: string;
    entityType: string;
  }[];

  ngOnInit(): void {
    if (!this.config.config?.entityType) return;
    this.availableRelatedEntities = this.entityRelationsService
      .getEntityTypesReferencingType(this.entityType.ENTITY_TYPE)
      .map((refType) => ({
        label: refType.entityType.label || refType.entityType.ENTITY_TYPE,
        entityType: refType.entityType.ENTITY_TYPE,
      }));
    this.selectedEntityType = this.config.config.entityType;
    this.entityConstructor = this.entities.get(this.selectedEntityType);
    this.activeFields = (this.config.config.columns ?? []).map((col) =>
      typeof col === "string" ? col : col.id,
    );
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
    const confirmed = await this.confirmation.getConfirmation(
      $localize`Change Entity Type`,
      $localize`Changing the entity type will discard selected fields. Continue?`,
      YesNoButtons,
    );
    this.isDialogOpen = false;

    if (!confirmed) {
      this.selectedEntityType = this.config.config.entityType;
      return;
    }

    this.updateConfigForNewEntityType(newType);
    this.applyCustomOverrides(newType);

    this.activeFields = [];
  }

  /**
   * Updates the configuration and component reference based on the newly selected entity type.
   * This resets the target entity type, sets the new entity type in the config,
   * and applies default column configurations if available.
   *
   * @param newType - The new entity type selected.
   */
  private updateConfigForNewEntityType(newType: string) {
    this.selectedEntityType = newType;
    this.config.config.entityType = newType;
    this.entityConstructor = this.entities.get(newType);

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
    const overrideRelatedConfig: RelatedEntitiesComponentConfig =
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
