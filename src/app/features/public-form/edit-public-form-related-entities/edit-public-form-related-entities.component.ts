import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatOptionModule } from "@angular/material/core";
import { EntityConstructor } from "app/core/entity/model/entity";
import { EntityDatatype } from "app/core/basic-datatypes/entity/entity.datatype";
import { EditComponent } from "app/core/entity/default-datatype/edit-component";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";

@Component({
  selector: "app-edit-public-form-related-entities",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatOptionModule,
  ],
  templateUrl: "./edit-public-form-related-entities.component.html",
  styleUrls: ["./edit-public-form-related-entities.component.scss"],
})
export class EditPublicFormRelatedEntitiesComponent
  extends EditComponent<FormFieldConfig>
  implements OnInit
{
  entityConstructor: EntityConstructor;
  relatedRefFields: FormFieldConfig[] = [];
  fieldIdControl: FormControl;

  private entities = inject(EntityRegistry);

  override ngOnInit(): void {
    if (!this.entity) return;

    this.entityConstructor = this.entities.get(this.entity["entity"]);

    this.relatedRefFields = Array.from(this.entityConstructor.schema.entries())
      .filter(([_, schema]) => schema.dataType === EntityDatatype.dataType)
      .map(([id, schema]) => ({
        id,
        label: schema.label,
        additional: schema.additional,
      }));

    this.initializeLinkedEntity();
  }

  private initializeLinkedEntity(): void {
    const raw = this.formControl.value as FormFieldConfig;

    this.fieldIdControl = new FormControl({
      value: raw?.id ?? null,
      disabled: this.formControl.disabled,
    });

    this.fieldIdControl.valueChanges.subscribe((newId: string) => {
      const match = this.relatedRefFields.find((f) => f.id === newId);
      this.formControl.patchValue({
        id: newId,
        hideFromForm: true,
        additional: match?.additional,
      });
      this.formControl.markAsDirty();
    });
    this.formControl.statusChanges.subscribe(() => {
      this.formControl.disabled
        ? this.fieldIdControl.disable({ emitEvent: false })
        : this.fieldIdControl.enable({ emitEvent: false });
    });
  }
}
