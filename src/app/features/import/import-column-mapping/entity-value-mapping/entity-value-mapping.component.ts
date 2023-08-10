import { Component, Inject } from "@angular/core";
import { AbstractValueMappingComponent } from "../abstract-value-mapping-component";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MappingDialogData } from "../import-column-mapping.component";
import { ConfirmationDialogService } from "../../../../core/confirmation-dialog/confirmation-dialog.service";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { FormBuilder, FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { NgForOf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { EntityConstructor } from "../../../../core/entity/model/entity";
import { ColumnMapping } from "../../column-mapping";

@Component({
  selector: "app-entity-value-mapping",
  standalone: true,
  templateUrl: "./entity-value-mapping.component.html",
  styleUrls: ["./entity-value-mapping.component.scss"],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    NgForOf,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
})
export class EntityValueMappingComponent extends AbstractValueMappingComponent {
  static getIncompleteAdditionalConfigBadge(col: ColumnMapping) {
    return col.additional ? undefined : "?";
  }
  entity: EntityConstructor;
  propertyForm = new FormControl("");
  availableProperties: { property: string; label: string }[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MappingDialogData,
    private confirmation: ConfirmationDialogService,
    private dialog: MatDialogRef<any>,
    private fb: FormBuilder,
    private entities: EntityRegistry,
  ) {
    super();
    const propertyName = this.data.col.propertyName;
    const entityName = this.data.entityType.schema.get(propertyName).additional;
    this.entity = this.entities.get(entityName);
    this.availableProperties = [...this.entity.schema.entries()]
      .filter(([_, schema]) => !!schema.label)
      .map(([prop, schema]) => ({ label: schema.label, property: prop }));
    this.propertyForm.setValue(this.data.col.additional?.property);
  }

  async save() {
    const confirmed =
      this.propertyForm.value ||
      (await this.confirmation.getConfirmation(
        $localize`Cancel?`,
        $localize`If not property is selected, no import will be done.`,
      ));
    if (confirmed) {
      this.data.col.additional = this.propertyForm.value;
      this.dialog.close();
    }
  }
}
