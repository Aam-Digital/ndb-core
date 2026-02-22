import { Component, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MappingDialogData } from "app/core/import/import-column-mapping/mapping-dialog-data";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
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
  templateUrl: "./entity-import-config.component.html",
  styleUrls: ["./entity-import-config.component.scss"],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    HelpButtonComponent,
  ],
})
export class EntityImportConfigComponent {
  data = inject<MappingDialogData>(MAT_DIALOG_DATA);
  private confirmation = inject(ConfirmationDialogService);
  private dialog = inject<MatDialogRef<any>>(MatDialogRef);
  private entities = inject(EntityRegistry);

  entity: EntityConstructor;
  propertyForm = new FormControl("");
  availableProperties: { property: string; label: string }[] = [];

  constructor() {
    const propertyName = this.data.col.propertyName;
    const entityName = this.data.entityType.schema.get(propertyName).additional;
    this.entity = this.entities.get(entityName);
    this.availableProperties = [...this.entity.schema.entries()]
      .filter(
        ([prop, schema]) =>
          (!!schema.label && !schema.isInternalField) || prop === "_id",
      )
      .map(([prop, schema]) => ({
        label: prop === "_id" ? $localize`ID (Internal UUID)` : schema.label,
        property: prop,
      }));
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
