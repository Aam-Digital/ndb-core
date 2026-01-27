import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatOptionModule } from "@angular/material/core";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntityDatatype } from "app/core/basic-datatypes/entity/entity.datatype";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";

@DynamicComponent("EditPublicFormRelatedEntitiesComponent")
@Component({
  selector: "app-edit-public-form-related-entities",
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
  extends CustomFormControlDirective<string[]>
  implements OnInit, EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;
  @Input() entity?: Entity;
  entityConstructor: EntityConstructor;
  relatedRefFields: FormFieldConfig[] = [];

  private entities = inject(EntityRegistry);

  get formControl(): FormControl<string[]> {
    return this.ngControl.control as FormControl<string[]>;
  }

  get selectedFieldIds(): string[] {
    return this.formControl.value || [];
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
    this.formControl.patchValue(selectedIds);
    this.formControl.markAsDirty();
  }

  clearSelectedEntities() {
    this.formControl.setValue([]);
    this.formControl.markAsDirty();
  }
}
