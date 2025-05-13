import {
  Component,
  OnInit,
  Input,
  inject,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { DefaultValueConfigStatic } from "../default-value-config-static";
import { MatFormFieldControl } from "@angular/material/form-field";
import { EntityFieldEditComponent } from "app/core/common-components/entity-field-edit/entity-field-edit.component";
import { EntityForm } from "app/core/common-components/entity-form/entity-form.service";
import { Entity } from "app/core/entity/model/entity";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";

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
  implements OnInit, OnChanges
{
  @Input() entitySchemaField: EntitySchemaField;

  targetFieldConfig: FormFieldConfig;

  formControl: FormControl<string>;
  staticvalueForm: EntityForm<Entity>;

  private readonly entitySchemaService = inject(EntitySchemaService);

  ngOnInit() {
    let initialValue = this.value?.value ?? null;

    if (initialValue) {
      initialValue = this.entitySchemaService.valueToEntityFormat(
        initialValue,
        this.entitySchemaField,
      );
    }
    this.formControl = new FormControl(initialValue);

    this.formControl.valueChanges.subscribe((v) => (this.value = { value: v }));

    this.updateTargetFieldConfig();

    const formGroup = new FormGroup({
      [this.targetFieldConfig.id]: this.formControl,
    });
    this.staticvalueForm = {
      formGroup,
    } as unknown as EntityForm<Entity>;
    this.ngControl?.valueChanges.subscribe(
      (newValue: DefaultValueConfigStatic) => {
        this.formControl.setValue(newValue?.value, { emitEvent: false });
      },
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entitySchemaField) {
      if (!this.targetFieldConfig) {
        this.updateTargetFieldConfig();
      } else {
        Object.assign(this.targetFieldConfig, this.entitySchemaField);
      }
    }
  }
  private updateTargetFieldConfig() {
    const newConfig = {
      id: "defaultValueId",
      ...this.entitySchemaField,
    };

    if (JSON.stringify(this.targetFieldConfig) !== JSON.stringify(newConfig)) {
      this.targetFieldConfig = newConfig;
    }
  }
}
