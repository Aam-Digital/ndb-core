import { Component, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { EntityConstructor } from "app/core/entity/model/entity";
import { EntityDatatype } from "app/core/basic-datatypes/entity/entity.datatype";
import { EditComponent } from "app/core/entity/default-datatype/edit-component";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
  selector: "app-edit-public-form-related-entities",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    FontAwesomeModule,
    MatTooltipModule,
  ],
  templateUrl: "./edit-public-form-related-entities.component.html",
  styleUrls: ["./edit-public-form-related-entities.component.scss"],
})
export class EditPublicFormRelatedEntitiesComponent
  extends EditComponent<FormFieldConfig | FormFieldConfig[]>
  implements OnInit
{
  entityConstructor: EntityConstructor;
  relatedRefFields: FormFieldConfig[] = [];
  fieldIdsControl: FormControl;

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

    this.initializeLinkedEntities();
  }

  private initializeLinkedEntities(): void {
    const rawArray = (this.formControl.value as FormFieldConfig[]) || [];
    const selectedIds = rawArray.map((field) => field.id).filter((id) => id);

    this.fieldIdsControl = new FormControl({
      value: selectedIds,
      disabled: this.formControl.disabled,
    });

    this.fieldIdsControl.valueChanges.subscribe((newIds: string[]) => {
      const newLinkedEntities: FormFieldConfig[] = newIds.map((id) => {
        const match = this.relatedRefFields.find((f) => f.id === id);
        return {
          id,
          hideFromForm: true,
          additional: match?.additional,
        };
      });
      this.formControl.patchValue(newLinkedEntities);
      this.formControl.markAsDirty();
    });

    this.formControl.statusChanges.subscribe(() => {
      this.formControl.disabled
        ? this.fieldIdsControl.disable({ emitEvent: false })
        : this.fieldIdsControl.enable({ emitEvent: false });
    });
  }

  clearSelectedEntities() {
    this.fieldIdsControl.setValue([]);
    this.formControl.setValue([]);
  }
}
