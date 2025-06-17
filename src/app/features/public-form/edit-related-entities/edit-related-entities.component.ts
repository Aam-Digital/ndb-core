import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
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
  selector: "app-edit-related-entities",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatOptionModule,
  ],
  templateUrl: "./edit-related-entities.component.html",
  styleUrls: ["./edit-related-entities.component.scss"],
})
export class EditRelatedEntitiesComponent
  extends EditComponent<FormFieldConfig>
  implements OnInit
{
  entityConstructor: EntityConstructor;

  form: FormGroup;
  relatedRefFields: { id: string; label: string }[] = [];

  private entities = inject(EntityRegistry);

  private fb = inject(FormBuilder);

  override ngOnInit(): void {
    if (!this.entity) return;
    this.entityConstructor = this.entities.get(this.entity["entity"]);

    this.relatedRefFields = Array.from(this.entityConstructor.schema.entries())
      .filter(([_, schema]) => schema.dataType === EntityDatatype.dataType)
      .map(([id, schema]) => ({ id, label: schema.label || id }));

    this.form = this.fb.group({
      id: [null],
      hideFromForm: [true],
    });
    this.initializeLinkedEntity();

    this.form.get("id").valueChanges.subscribe((newId: string) => {
      this.formControl.setValue({
        id: newId,
        hideFromForm: true,
      });
      this.formControl.markAsDirty();
    });
  }

  private initializeLinkedEntity(): void {
    const raw = this.formControl.value as FormFieldConfig;
    this.form.patchValue({
      id: raw.id ?? null,
      hideFromForm: raw.hideFromForm ?? true,
    });
  }
}
