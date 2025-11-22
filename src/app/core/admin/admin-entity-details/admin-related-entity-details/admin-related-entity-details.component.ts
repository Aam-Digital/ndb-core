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
})
export class AdminRelatedEntityDetailsComponent implements OnInit {
  private readonly dialogRef = inject(
    MatDialogRef<AdminRelatedEntityDetailsComponent>,
  );
  private readonly data =
    inject<AdminRelatedEntityDetailsData>(MAT_DIALOG_DATA);

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
    // If no columns are configured yet, show all available schema fields by default
    if (this.currentColumns && this.currentColumns.length > 0) {
      this.formConfig = {
        fieldGroups: [{ fields: this.currentColumns }],
      };
    } else {
      const allSchemaFields = Array.from(
        this.entityConstructor.schema.keys(),
      ).filter((fieldId) => {
        const field = this.entityConstructor.schema.get(fieldId);
        return !field?.isInternalField;
      });

      this.formConfig = {
        fieldGroups:
          allSchemaFields.length > 0 ? [{ fields: allSchemaFields }] : [],
      };
    }
  }

  onConfigChange(config: FormConfig): void {
    this.formConfig = config;
  }

  cancelChanges(): void {
    this.entityConstructor.schema.clear();
    for (const [key, value] of this.originalSchema.entries()) {
      this.entityConstructor.schema.set(key, value);
    }
    this.dialogRef.close();
  }

  applyChanges(): void {
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
