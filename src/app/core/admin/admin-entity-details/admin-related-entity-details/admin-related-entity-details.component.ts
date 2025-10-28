import { Component, inject, OnInit } from "@angular/core";
import { EntityConstructor } from "../../../entity/model/entity";
import { AdminEntityFormComponent } from "../admin-entity-form/admin-entity-form.component";
import { FormConfig } from "../../../entity-details/form/form.component";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";

/**
 * Data interface for AdminRelatedEntityDetailsComponent dialog
 */
export interface AdminRelatedEntityDetailsData {
  entityConstructor: EntityConstructor;
  currentColumns: string[];
}

export interface AdminRelatedEntityDetailsResult {
  fieldIds: string[];
  schemaChanged: boolean;
}

/**
 * Dialog component for editing the related entity's column selection and order.
 * Shows currently selected columns as "active fields" in the drag-and-drop area,
 * and all available schema fields as "available fields" in the sidebar.
 *
 * When Apply is clicked, returns the updated list of column IDs to the parent.
 * The parent updates its config.columns, which gets saved when the main form saves.
 */
@Component({
  selector: "app-admin-related-entity-details",
  imports: [
    AdminEntityFormComponent,
    MatDialogModule,
    DialogCloseComponent,
    MatButtonModule,
    HintBoxComponent,
  ],
  templateUrl: "./admin-related-entity-details.component.html",
  styleUrls: [
    "./admin-related-entity-details.component.scss",
    "../../../common-components/hint-box/hint-box.component.scss",
  ],
})
export class AdminRelatedEntityDetailsComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AdminRelatedEntityDetailsComponent>);
  private data = inject<AdminRelatedEntityDetailsData>(MAT_DIALOG_DATA);

  entityConstructor: EntityConstructor;
  currentColumns: string[] = [];
  private originalSchema: Map<string, any>;

  formConfig: FormConfig = { fieldGroups: [] };

  ngOnInit(): void {
    this.entityConstructor = this.data.entityConstructor;
    this.currentColumns = this.data.currentColumns;

    // Create a deep copy of the original schema to restore on cancel
    this.originalSchema = new Map(
      JSON.parse(
        JSON.stringify(Array.from(this.entityConstructor.schema.entries())),
      ),
    );

    // Use the current columns from the panel component as active fields
    // Available fields will be shown from entityConstructor.schema automatically
    if (this.currentColumns && this.currentColumns.length > 0) {
      this.formConfig = {
        fieldGroups: [{ fields: this.currentColumns }],
      };
    } else {
      this.formConfig = { fieldGroups: [] };
    }
  }

  onConfigChange(config: FormConfig): void {
    this.formConfig = config;
  }

  cancelChanges(): void {
    // Restore the original schema when canceling
    this.entityConstructor.schema.clear();
    for (const [key, value] of this.originalSchema.entries()) {
      this.entityConstructor.schema.set(key, value);
    }
    this.dialogRef.close();
  }

  applyChanges(): void {
    // Get the current field order from the form config
    const updatedFieldIds: string[] = [];
    if (this.formConfig.fieldGroups) {
      for (const group of this.formConfig.fieldGroups) {
        if (group.fields) {
          for (const field of group.fields) {
            const fieldId = typeof field === "string" ? field : field.id;
            updatedFieldIds.push(fieldId);
          }
        }
      }
    }

    const schemaChanged = this.hasSchemaChanged();

    this.dialogRef.close({
      fieldIds: updatedFieldIds,
      schemaChanged: schemaChanged,
    } as AdminRelatedEntityDetailsResult);
  }

  /**
   * Check if the entity's schema has been modified compared to the original state.
   */
  private hasSchemaChanged(): boolean {
    const currentSchema = this.entityConstructor.schema;
    // Check if any field was modified
    for (const [fieldId, fieldSchema] of currentSchema.entries()) {
      const originalFieldSchema = this.originalSchema.get(fieldId);
      if (
        !originalFieldSchema ||
        JSON.stringify(fieldSchema) !== JSON.stringify(originalFieldSchema)
      ) {
        return true;
      }
    }
    return false;
  }
}
