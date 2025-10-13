import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityConstructor } from "../../../entity/model/entity";
import { AdminEntityFormComponent } from "../admin-entity-form/admin-entity-form.component";
import { FormConfig } from "../../../entity-details/form/form.component";
import { FieldGroup } from "../../../entity-details/form/field-group";
import { ColumnConfig } from "../../../common-components/entity-form/FormConfig";
import { MatDialogModule } from "@angular/material/dialog";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";

/**
 * Admin component for configuring related entity details popup forms.
 * Allows users to configure which fields are displayed in the popup details view
 * when clicking on a related entity from a related-entities table.
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
  @Input() columns: ColumnConfig[] = [];
  @Input() entityConstructor: EntityConstructor;
  @Output() columnsChange = new EventEmitter<ColumnConfig[]>();

  formConfig: FormConfig = { fieldGroups: [] };

  ngOnInit(): void {
    this.initializeFormConfig();
  }

  private initializeFormConfig(): void {
    // Convert columns array to FormConfig with a single field group
    const fieldGroup: FieldGroup = {
      fields: this.columns.map((col) =>
        typeof col === "string" ? col : col.id,
      ),
      header: $localize`Fields for popup form`,
    };

    this.formConfig = {
      fieldGroups: [fieldGroup],
    };
  }

  onFormConfigChange(formConfig: FormConfig): void {
    this.formConfig = formConfig;
    
    // Extract fields from the form config and convert back to columns
    const updatedColumns: ColumnConfig[] = [];
    
    formConfig.fieldGroups.forEach((group) => {
      if (Array.isArray(group.fields)) {
        group.fields.forEach((field) => {
          const fieldId = typeof field === "string" ? field : field.id;
          
          // Try to preserve existing column config if it exists
          const existingColumn = this.columns.find(
            (col) => (typeof col === "string" ? col : col.id) === fieldId,
          );
          
          if (existingColumn && typeof existingColumn !== "string") {
            updatedColumns.push(existingColumn);
          } else {
            updatedColumns.push({ id: fieldId });
          }
        });
      }
    });

    this.columns = updatedColumns;
    this.columnsChange.emit(this.columns);
  }
}
