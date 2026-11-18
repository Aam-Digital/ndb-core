import { AdminListManagerComponent } from "#src/app/core/admin/admin-list-manager/admin-list-manager.component";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import {
  ColumnConfig,
  FormFieldConfig,
} from "#src/app/core/common-components/entity-form/FormConfig";
import { RelatedEntitiesComponentConfig } from "#src/app/core/entity-details/related-entity-config";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import {
  EMBEDDED_FIELD_ID_SEPARATOR,
  EmbeddedFieldRef,
  getEmbeddedFieldId,
  getEmbeddedFieldLabel,
  getEmbeddedFieldRefs,
  resolveEmbeddedField,
} from "#src/app/core/entity/schema/embedded-schema-field.util";
import { EntityDatatype } from "#src/app/core/basic-datatypes/entity/entity.datatype";
import { asArray } from "#src/app/utils/asArray";
import { AdminEntityService } from "#src/app/core/admin/admin-entity.service";
import { toSignal } from "@angular/core/rxjs-interop";

import {
  Component,
  input,
  inject,
  computed,
  linkedSignal,
  output,
  ChangeDetectionStrategy,
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
import { IconButtonComponent } from "#src/app/core/common-components/icon-button/icon-button.component";
import {
  AdminEntityFieldComponent,
  AdminEntityFieldData,
} from "#src/app/core/admin/admin-entity-details/admin-entity-field/admin-entity-field.component";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { resolveLocaleText } from "#src/app/core/language/active-locale";
import type { EmbeddedArrayDataConfig } from "#src/app/core/entity-details/embedded-array-data/embedded-array-data.component";
import { lastValueFrom } from "rxjs";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-entity-panel-component",
  imports: [
    AdminListManagerComponent,
    MatFormFieldModule,
    FormsModule,
    MatOptionModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    IconButtonComponent,
    MatDialogModule,
  ],
  templateUrl: "./admin-entity-panel-component.component.html",
  styleUrl: "./admin-entity-panel-component.component.scss",
})
export class AdminEntityPanelComponentComponent {
  private entities = inject(EntityRegistry);
  private confirmation = inject(ConfirmationDialogService);
  private entityRelationsService = inject(EntityRelationsService);
  private readonly dialog = inject(MatDialog);
  private readonly schemaService = inject(EntitySchemaService);
  private readonly adminEntityService = inject(AdminEntityService);
  // every (void) event must count as a change, so that it recomputes the dependent signals
  private readonly schemaUpdated = toSignal(
    this.adminEntityService.entitySchemaUpdated,
    { equal: () => false },
  );

  config = input.required<PanelComponent>();

  /**
   * The parent entity type being configured in this panel.
   * This is provided by the parent component and does not change.
   * Example: When configuring details for a "Child" entity.
   */
  entityType = input.required<EntityConstructor>();

  /**
   * emitted when a related entity's schema has been modified.
   */
  relatedEntityModified = output<EntityConstructor>();

  selectedEntityType = linkedSignal(
    () => this.config()?.config?.entityType ?? "",
  );

  /**
   * The related entity type currently selected in the dropdown.
   * Automatically derived from selectedEntityType; updates whenever the user selects a different related entity type.
   * Example: When the user selects "EducationalMaterial" or "Note" from the dropdown.
   */
  entityConstructor = computed(() => {
    const type = this.selectedEntityType();
    return type ? this.entities.get(type) : undefined;
  });

  isDialogOpen = false;

  /** Stores the currently active/selected field IDs to be shown in the panel */
  activeFields = linkedSignal<ColumnConfig[]>(() =>
    (this.config()?.config?.columns ?? []).map((col) =>
      typeof col === "string" ? col : col.id,
    ),
  );

  /**
   * Inner fields of the embedded entries that link a record to the current entity type
   * (e.g. "contactPersons.role"), offered as additional columns.
   * The related entities table shows them for the linking entries only,
   * i.e. for the embedded fields named in the section's `property`, if one is configured.
   */
  embeddedFieldColumns = computed<FormFieldConfig[]>(() => {
    this.schemaUpdated(); // the schema can be edited in place through the "Edit data structure" dialog
    const relatedType = this.entityConstructor();
    if (!relatedType) {
      return [];
    }
    const parentType = this.entityType().ENTITY_TYPE;
    const linksParent = (ref: EmbeddedFieldRef) =>
      ref.innerSchema.dataType === EntityDatatype.dataType &&
      asArray(ref.innerSchema.additional).includes(parentType);

    const refs = getEmbeddedFieldRefs(this.schemaService, relatedType);
    const property = this.config()?.config?.property;
    const linkingFields = new Set(
      property
        ? asArray(property).map((p) => p.split(EMBEDDED_FIELD_ID_SEPARATOR)[0])
        : refs.filter(linksParent).map((ref) => ref.outerProp),
    );
    return refs
      .filter((ref) => linkingFields.has(ref.outerProp) && !linksParent(ref))
      .map((ref) => ({
        id: getEmbeddedFieldId(ref),
        label: getEmbeddedFieldLabel(ref),
      }));
  });

  /**
   * The field of the entity type that this section displays on its own
   * (e.g. a `schema-embed-array` field shown as an "EmbeddedArrayData" section),
   * so that its schema can be configured from the section.
   */
  sectionField = computed<{ id: string; label: string } | undefined>(() => {
    this.schemaUpdated(); // the label can change through the "configure field" dialog
    if (this.config()?.component !== "EmbeddedArrayData") {
      return undefined;
    }
    const id = (this.config().config as EmbeddedArrayDataConfig)?.property;
    const field = id ? this.entityType().schema.get(id) : undefined;
    if (!field) {
      return undefined;
    }
    return { id, label: resolveLocaleText(field.label) || id };
  });

  /**
   * List of entity types that reference the current entity type.
   */
  availableRelatedEntities = computed(() =>
    this.entityRelationsService
      .getEntityTypesReferencingType(this.entityType().ENTITY_TYPE)
      .map((refType) => ({
        label: refType.entityType.label || refType.entityType.ENTITY_TYPE,
        entityType: refType.entityType.ENTITY_TYPE,
      })),
  );

  /**
   * Computed signal to determine if the "Edit data structure" button should be shown.
   * Hidden for Note and Todo entities as they have custom detail views.
   */
  showEditStructureButton = computed(() => {
    const entityType = this.selectedEntityType();
    return entityType !== "Note" && entityType !== "Todo";
  });

  /**
   * Updates the active fields and synchronizes the config columns accordingly.
   * @param activeFields - selected list of active field IDs to be displayed.
   */
  updateFields(activeFields: ColumnConfig[]) {
    if (!Array.isArray(activeFields)) {
      activeFields = [];
    }
    // Ensure config.config.columns is initialized for new related entity sections
    if (!this.config().config.columns) {
      this.config().config.columns = [];
    }

    this.activeFields.set([...activeFields]);
    this.config().config.columns = this.activeFields().map(
      (fieldId) =>
        this.config().config.columns.find(
          (existingFields) => existingFields.id === fieldId,
        ) ?? { id: fieldId },
    );
  }

  async onEntityTypeChange(newType: string | string[]) {
    if (
      Array.isArray(newType) ||
      newType === this.config().config.entityType ||
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
      this.selectedEntityType.set(this.config().config.entityType);
      return;
    }

    this.updateConfigForNewEntityType(newType);
    this.applyCustomOverrides(newType);

    this.activeFields.set([]);
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
    this.config().config.entityType = newType;

    const matchingEntry = Object.entries(RELATED_ENTITIES_DEFAULT_CONFIGS).find(
      ([_, value]) => value.entityType === newType,
    );

    if (matchingEntry) {
      const [componentKey, defaults] = matchingEntry;
      this.config().component = componentKey;
      this.config().config.columns = [...(defaults.columns ?? [])];
    } else {
      this.config().config.columns = [];
    }
  }

  /**
   * Applies custom configuration overrides for specific entity types.
   * This is used to customize properties such as component name, loader method, or additional config values.
   *
   * @param newType - The new entity type being configured.
   */
  private applyCustomOverrides(newType: string) {
    delete this.config().config.loaderMethod;
    delete this.config().config.property;
    const overrideRelatedConfig: Partial<RelatedEntitiesComponentConfig> =
      RELATED_ENTITY_OVERRIDES[newType];

    if (overrideRelatedConfig) {
      this.config().component = overrideRelatedConfig.component;
      this.config().config = {
        ...this.config().config,
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
    const entityConstructor = this.entityConstructor();
    if (!entityConstructor) {
      return;
    }

    const columnIds = this.activeFields().map((col) =>
      typeof col === "string" ? col : col.id,
    );
    // columns of embedded entries (e.g. "contactPersons.role") are not fields of the record type
    // and therefore cannot be edited in the dialog
    const embeddedColumns = columnIds.filter((id) =>
      resolveEmbeddedField(this.schemaService, entityConstructor, id),
    );

    const dialogRef = this.dialog.open(AdminRelatedEntityDetailsComponent, {
      // using 76vh height making it clear that there are multiple dialog layers open
      // e.g., when edit field structure dialog opens this dialog remains partially visible in the background,
      width: "90vw",
      minHeight: "76vh",
      data: {
        entityConstructor,
        currentColumns: columnIds.filter((id) => !embeddedColumns.includes(id)),
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: AdminRelatedEntityDetailsResult) => {
        if (result) {
          const fieldIds = [...result.fieldIds];
          for (const id of embeddedColumns) {
            // the dialog may have removed the embedded field or its inner field
            if (
              !resolveEmbeddedField(this.schemaService, entityConstructor, id)
            ) {
              continue;
            }
            // put it back behind the column it followed before, if that is still shown
            const previousColumn = columnIds
              .slice(0, columnIds.indexOf(id))
              .findLast((columnId) => fieldIds.includes(columnId));
            fieldIds.splice(
              previousColumn ? fieldIds.indexOf(previousColumn) + 1 : 0,
              0,
              id,
            );
          }
          this.config().config.columns = fieldIds;
          this.activeFields.set(fieldIds);

          if (result.schemaChanged) {
            this.relatedEntityModified.emit(this.entityConstructor());
          }
        }
      });
  }

  /**
   * Open the dialog to edit the schema of the field displayed by this section
   * and update the entity type's schema with the result
   * (saved together with the entity's config).
   */
  async openSectionFieldConfig(): Promise<void> {
    const field = this.sectionField();
    if (!field) {
      return;
    }

    const dialogRef = this.dialog.open(AdminEntityFieldComponent, {
      width: "99%",
      maxHeight: "90vh",
      data: {
        entitySchemaField: {
          ...this.entityType().schema.get(field.id),
          id: field.id,
        },
        entityType: this.entityType(),
        overwriteLocally: false,
      } as AdminEntityFieldData,
    });

    const updatedField: EntitySchemaField | undefined = await lastValueFrom(
      dialogRef.afterClosed(),
    );
    if (!updatedField || typeof updatedField !== "object") {
      return;
    }
    this.adminEntityService.updateSchemaField(
      this.entityType(),
      updatedField.id,
      updatedField,
    );
  }
}
