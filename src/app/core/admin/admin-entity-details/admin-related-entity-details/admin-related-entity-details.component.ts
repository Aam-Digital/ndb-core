import { Component, inject, Input, OnInit } from "@angular/core";
import { EntityConstructor } from "../../../entity/model/entity";
import { AdminEntityFormComponent } from "../admin-entity-form/admin-entity-form.component";
import { FormConfig } from "../../../entity-details/form/form.component";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";

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
  ],
  templateUrl: "./admin-related-entity-details.component.html",
  styleUrls: [
    "./admin-related-entity-details.component.scss",
    "../../../common-components/hint-box/hint-box.component.scss",
  ],
})
export class AdminRelatedEntityDetailsComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AdminRelatedEntityDetailsComponent>);

  @Input() entityConstructor: EntityConstructor;

  /**
   * Currently selected columns from the panel component.
   * These are shown as "active fields" in the dialog.
   */
  @Input() currentColumns: string[] = [];

  formConfig: FormConfig = { fieldGroups: [] };

  ngOnInit(): void {
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

    this.dialogRef.close(updatedFieldIds);
  }
}
