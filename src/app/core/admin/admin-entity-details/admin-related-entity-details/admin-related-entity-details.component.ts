import { Component, inject, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityConstructor } from "../../../entity/model/entity";
import { AdminEntityFormComponent } from "../admin-entity-form/admin-entity-form.component";
import { FormConfig } from "../../../entity-details/form/form.component";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";
import { AdminEntityService } from "../../admin-entity.service";

/**
 * Dialog component for editing the entity's field configuration.
 * Loads fields from the entity's attributes in the Config database.
 * Shows configured attributes as "active fields" in the drag-and-drop area,
 * and all other schema fields as "available fields" in the sidebar.
 */
@Component({
  selector: "app-admin-related-entity-details",
  imports: [
    CommonModule,
    AdminEntityFormComponent,
    MatDialogModule,
    DialogCloseComponent,
    MatButtonModule,
  ],
  templateUrl: "./admin-related-entity-details.component.html",
  styleUrls: [
    "./admin-related-entity-details.component.scss",
    "../../admin-entity/admin-entity-styles.scss",
  ],
})
export class AdminRelatedEntityDetailsComponent implements OnInit {
  private adminEntityService = inject(AdminEntityService);
  private dialogRef = inject(MatDialogRef<AdminRelatedEntityDetailsComponent>);

  @Input() entityConstructor: EntityConstructor;

  formConfig: FormConfig = { fieldGroups: [] };
  private originalFieldIds: string[] = [];
  private originalSchema: Map<string, any>;

  async ngOnInit(): Promise<void> {
    // Create a deep copy of the schema to restore if user cancels
    this.originalSchema = new Map(
      Array.from(this.entityConstructor.schema.entries()).map(
        ([key, value]) => [key, { ...value }],
      ),
    );

    await this.loadEntityAttributesConfig();
  }

  /**
   * Load the entity's field configuration from the entity's schema.
   * This shows all fields currently in the entity's schema (including recently added ones).
   * Only shows fields that have a label (user-facing fields, not technical/internal fields).
   * AdminEntityFormComponent will show these as "active fields" in the drag-and-drop area,
   * and any other potential fields as "available fields" in the sidebar.
   */
  private async loadEntityAttributesConfig(): Promise<void> {
    const fieldIds = Array.from(this.entityConstructor.schema.entries())
      .filter(([key, field]) => field.label) // Only include fields with labels
      .map(([key]) => key);

    // Store original field IDs to detect new fields later
    this.originalFieldIds = [...fieldIds];

    if (fieldIds.length > 0) {
      this.formConfig = {
        fieldGroups: [{ fields: fieldIds }],
      };
    } else {
      this.formConfig = { fieldGroups: [] };
    }
  }

  /**
   * Called when "Cancel" button is clicked.
   * Restores the original schema state before any changes were made.
   */
  cancelChanges(): void {
    // Restore the original schema
    this.entityConstructor.schema.clear();
    this.originalSchema.forEach((value, key) => {
      this.entityConstructor.schema.set(key, value);
    });

    this.dialogRef.close();
  }

  /**
   * Called when "Apply" button is clicked.
   * Detects newly added fields (with labels) and returns them to the parent component.
   * New fields will be added to dropdown options (not automatically selected).
   */
  async applyChanges(): Promise<void> {
    // Get current field IDs from entity's schema that have labels (filter out technical fields)
    const currentFieldIds = Array.from(this.entityConstructor.schema.entries())
      .filter(([key, field]) => field.label)
      .map(([key]) => key);

    // Find new fields that weren't in the original list
    const newFieldIds = currentFieldIds.filter(
      (fieldId) => !this.originalFieldIds.includes(fieldId),
    );

    // Trigger schema update event to refresh all components that listen to it
    // This ensures AdminListManagerComponent refreshes its available fields dropdown
    if (newFieldIds.length > 0) {
      this.adminEntityService.entitySchemaUpdated.next();
    }

    this.dialogRef.close(newFieldIds);
  }
}
