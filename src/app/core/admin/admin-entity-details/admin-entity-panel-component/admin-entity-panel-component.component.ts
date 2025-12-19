import { AdminListManagerComponent } from "#src/app/core/admin/admin-list-manager/admin-list-manager.component";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { ColumnConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { RelatedEntitiesComponentConfig } from "#src/app/core/entity-details/related-entity-config";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";

import {
  Component,
  Input,
  OnInit,
  inject,
  computed,
  signal,
  Output,
  EventEmitter,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatOptionModule } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { YesNoButtons } from "app/core/common-components/confirmation-dialog/confirmation-dialog/confirmation-dialog.component";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import {
  RELATED_ENTITIES_DEFAULT_CONFIGS,
  RELATED_ENTITY_OVERRIDES,
} from "app/utils/related-entities-default-config";
import { PanelComponent } from "../../../entity-details/EntityDetailsConfig";
import { EntityConstructor } from "../../../entity/model/entity";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import {
  AdminRelatedEntityDetailsComponent,
  AdminRelatedEntityDetailsResult,
} from "../admin-related-entity-details/admin-related-entity-details.component";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@Component({
  selector: "app-admin-entity-panel-component",
  imports: [
    AdminListManagerComponent,
    MatFormFieldModule,
    FormsModule,
    MatOptionModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    FaIconComponent,
    MatDialogModule,
  ],
  templateUrl: "./admin-entity-panel-component.component.html",
  styleUrl: "./admin-entity-panel-component.component.scss",
})
export class AdminEntityPanelComponentComponent implements OnInit {
  private entities = inject(EntityRegistry);
  private confirmation = inject(ConfirmationDialogService);
  private entityRelationsService = inject(EntityRelationsService);
  private readonly dialog = inject(MatDialog);

  @Input() config: PanelComponent;
  @Input() entityType: EntityConstructor;

  /**
   * emitted when a related entity's schema has been modified.
   */
  @Output() relatedEntityModified = new EventEmitter<EntityConstructor>();

  entityConstructor: EntityConstructor;
  selectedEntityType = signal<string>("");

  isDialogOpen = false;

  /** Stores the currently active/selected field IDs to be shown in the panel */
  activeFields: ColumnConfig[];

  /**
   * List of entity types that reference the current entity type.
   */
  availableRelatedEntities: {
    label: string;
    entityType: string;
  }[];

  /**
   * Computed signal to determine if the "Edit data structure" button should be shown.
   * Hidden for Note and Todo entities as they have custom detail views.
   */
  showEditStructureButton = computed(() => {
    const entityType = this.selectedEntityType();
    return entityType !== "Note" && entityType !== "Todo";
  });

  ngOnInit(): void {
    if (!this.config.config?.entityType) return;
    this.availableRelatedEntities = this.entityRelationsService
      .getEntityTypesReferencingType(this.entityType.ENTITY_TYPE)
      .map((refType) => ({
        label: refType.entityType.label || refType.entityType.ENTITY_TYPE,
        entityType: refType.entityType.ENTITY_TYPE,
      }));
    this.selectedEntityType.set(this.config.config.entityType);
    this.entityConstructor = this.entities.get(this.selectedEntityType());
    this.activeFields = (this.config.config.columns ?? []).map((col) =>
      typeof col === "string" ? col : col.id,
    );
  }

  /**
   * Updates the active fields and synchronizes the config columns accordingly.
   * @param activeFields - selected list of active field IDs to be displayed.
   */
  updateFields(activeFields: ColumnConfig[]) {
    if (!Array.isArray(activeFields)) {
      activeFields = [];
    }
    // Ensure config.config.columns is initialized for new related entity sections
    if (!this.config.config.columns) {
      this.config.config.columns = [];
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
      this.selectedEntityType.set(this.config.config.entityType);
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
    this.selectedEntityType.set(newType);
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
    const overrideRelatedConfig: Partial<RelatedEntitiesComponentConfig> =
      RELATED_ENTITY_OVERRIDES[newType];

    if (overrideRelatedConfig) {
      this.config.component = overrideRelatedConfig.component;
      this.config.config = {
        ...this.config.config,
        ...overrideRelatedConfig,
      };
    }
  }

  /**
   * Opens a dialog showing the related entity's column selection and ordering.
   * When "Apply" is clicked, updates the columns in the config.
   * If the related entity's schema was modified, emits an event so the parent can save it.
   */
  openRelatedEntityDetailsConfig(): void {
    if (!this.entityConstructor) {
      return;
    }

    const dialogRef = this.dialog.open(AdminRelatedEntityDetailsComponent, {
      // using 76vh height making it clear that there are multiple dialog layers open
      // e.g., when edit field structure dialog opens this dialog remains partially visible in the background,
      width: "90vw",
      minHeight: "76vh",
      data: {
        entityConstructor: this.entityConstructor,
        currentColumns: this.activeFields.map((col) =>
          typeof col === "string" ? col : col.id,
        ),
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: AdminRelatedEntityDetailsResult) => {
        if (result) {
          this.config.config.columns = result.fieldIds;
          this.activeFields = result.fieldIds;

          if (result.schemaChanged) {
            this.relatedEntityModified.emit(this.entityConstructor);
          }
        }
      });
  }
}
