import { Component, Inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MappingDialogData } from "../../../import/import-column-mapping/import-column-mapping.component";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { NgForOf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { EntityConstructor } from "../../../entity/model/entity";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

/**
 * Configuration UI for the EntityDatatype's import mapping function.
 */
@DynamicComponent("EntityImportConfig")
@Component({
  selector: "app-entity-import-config",
  standalone: true,
  templateUrl: "./entity-import-config.component.html",
  styleUrls: ["./entity-import-config.component.scss"],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    NgForOf,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    HelpButtonComponent,
  ],
})
export class EntityImportConfigComponent {
  entity: EntityConstructor;
  propertyForm = new FormControl("");
  availableProperties: { property: string; label: string }[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MappingDialogData,
    private confirmation: ConfirmationDialogService,
    private dialog: MatDialogRef<any>,
    private entities: EntityRegistry,
  ) {
    const propertyName = this.data.col.propertyName;
    const entityName = this.data.entityType.schema.get(propertyName).additional;
    this.entity = this.entities.get(entityName);
    this.availableProperties = [...this.entity.schema.entries()]
      .filter(([_, schema]) => !!schema.label)
      .map(([prop, schema]) => ({ label: schema.label, property: prop }));
    this.propertyForm.setValue(this.data.col.additional);
  }

  async save() {
    const confirmed =
      this.propertyForm.value ||
      (await this.confirmation.getConfirmation(
        $localize`Ignore for import?`,
        $localize`If no property is selected, this column will be skipped during import. Are you sure to keep it unmapped?`,
      ));
    if (confirmed) {
      this.data.col.additional = this.propertyForm.value;
      this.dialog.close();
    }
  }
}
