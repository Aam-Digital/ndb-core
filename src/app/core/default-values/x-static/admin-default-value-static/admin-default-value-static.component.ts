import { Component, OnInit, Input, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { DefaultValueConfigStatic } from "../default-value-config-static";
import { MatFormFieldControl } from "@angular/material/form-field";
import { EntityFieldEditComponent } from "app/core/common-components/entity-field-edit/entity-field-edit.component";
import { EntityForm } from "app/core/common-components/entity-form/entity-form.service";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";

@Component({
  selector: "app-admin-default-value-static",
  imports: [ReactiveFormsModule, EntityFieldEditComponent],
  templateUrl: "./admin-default-value-static.component.html",
  styleUrl: "./admin-default-value-static.component.scss",
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: AdminDefaultValueStaticComponent,
    },
  ],
})
export class AdminDefaultValueStaticComponent
  extends CustomFormControlDirective<DefaultValueConfigStatic>
  implements OnInit
{
  @Input() fieldId: string;
  @Input() entityType: EntityConstructor;

  entity: Entity;
  formControl: FormControl<string>;
  staticvalueForm: EntityForm<Entity>;

  private readonly entitySchemaService = inject(EntitySchemaService);

  ngOnInit() {
    this.formControl = new FormControl(this.value?.value);
    this.formControl.valueChanges.subscribe((v) => (this.value = { value: v }));
    const formGroup = new FormGroup({
      [this.fieldId]: this.formControl,
    });
    this.entity = new this.entityType();
    this.staticvalueForm = {
      formGroup,
    } as unknown as EntityForm<Entity>;
    this.staticvalueForm.formGroup.valueChanges.subscribe((v) => {
      if (this.staticvalueForm.formGroup.valid) {
        const field = this.staticvalueForm.formGroup.get(
          this.fieldId.toString(),
        );
        const value = this.entitySchemaService.valueToDatabaseFormat(
          field.value,
          this.entityType.schema.get(this.fieldId.toString()),
        );
        if (value) {
          const valueControl = formGroup.get("value");
          if (valueControl) {
            valueControl.setValue(value);
          }
        }
      }
    });
  }
}
