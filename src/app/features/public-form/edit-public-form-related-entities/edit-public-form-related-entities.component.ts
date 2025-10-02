import {
  Component,
  OnInit,
  inject,
  Input,
  ChangeDetectionStrategy,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { MatFormFieldControl } from "@angular/material/form-field";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityDatatype } from "app/core/basic-datatypes/entity/entity.datatype";
import { EditComponent } from "app/core/common-components/entity-field-edit/dynamic-edit/edit-component.interface";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";

@DynamicComponent("EditPublicFormRelatedEntitiesComponent")
@Component({
  selector: "app-edit-public-form-related-entities",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    FontAwesomeModule,
    MatTooltipModule,
  ],
  templateUrl: "./edit-public-form-related-entities.component.html",
  styleUrls: ["./edit-public-form-related-entities.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditPublicFormRelatedEntitiesComponent,
    },
  ],
})
export class EditPublicFormRelatedEntitiesComponent
  extends CustomFormControlDirective<FormFieldConfig[]>
  implements OnInit, EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;
  @Input() entity?: Entity;
  entityConstructor: EntityConstructor;
  relatedRefFields: FormFieldConfig[] = [];

  private entities = inject(EntityRegistry);

  get formControl(): FormControl<FormFieldConfig[]> {
    return this.ngControl.control as FormControl<FormFieldConfig[]>;
  }

  get selectedFieldIds(): string[] {
    const currentValue = this.formControl.value || [];
    return currentValue.map((field) => field.id).filter((id) => id);
  }

  ngOnInit(): void {
    if (!this.entity) return;

    this.entityConstructor = this.entities.get(this.entity["entity"]);

    this.relatedRefFields = Array.from(this.entityConstructor.schema.entries())
      .filter(([_, schema]) => schema.dataType === EntityDatatype.dataType)
      .map(([id, schema]) => ({
        id,
        label: schema.label,
        additional: schema.additional,
      }));
  }

  onSelectionChange(selectedIds: string[]): void {
    const newLinkedEntities: FormFieldConfig[] = selectedIds.map((id) => {
      const match = this.relatedRefFields.find((f) => f.id === id);
      return {
        id,
        hideFromForm: true,
        additional: match?.additional,
      };
    });
    this.formControl.patchValue(newLinkedEntities);
    this.formControl.markAsDirty();
  }

  clearSelectedEntities() {
    this.formControl.setValue([]);
  }
}
