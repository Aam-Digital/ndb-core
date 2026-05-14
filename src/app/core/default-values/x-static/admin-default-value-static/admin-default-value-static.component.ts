import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";
import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  computed,
  input,
} from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { Entity } from "app/core/entity/model/entity";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { DefaultValueConfigStatic } from "../default-value-config-static";

/**
 * UI to edit a static default value in the Admin UI.
 * Note that the Input/Output of values is in database-format (not entity-format)
 * as this is the format how it should be saved in the config.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  entitySchemaField = input<EntitySchemaField>();

  /** mapped from the entitySchemaField to use for the entity-field-edit field */
  readonly targetFieldConfig = computed<FormFieldConfig | undefined>(() => {
    const field = this.entitySchemaField();
    if (!field) {
      return undefined;
    }
    return {
      ...field,
      id: "defaultValueId", // overwrite the id with a static temporary one for our isolated form control here
    };
  });

  formControl: FormControl<string>;
  staticvalueForm: EntityForm<Entity>;

  private readonly entitySchemaService = inject(EntitySchemaService);

  ngOnInit() {
    this.formControl = new FormControl(this.getInternalValue(this.value));
    this.formControl.valueChanges.subscribe((v) => this.emitNewValue(v));
    const targetFieldConfig = this.targetFieldConfig();
    if (!targetFieldConfig) {
      return;
    }

    const formGroup = new FormGroup({
      [targetFieldConfig.id]: this.formControl,
    });
    this.staticvalueForm = {
      formGroup,
    } as unknown as EntityForm<Entity>;

    this.ngControl?.valueChanges.subscribe(
      (newValue: DefaultValueConfigStatic) => {
        this.formControl.setValue(this.getInternalValue(newValue), {
          emitEvent: false,
        });
        setTimeout(() => this.formControl.updateValueAndValidity(), 0);
      },
    );
  }

  private getInternalValue(defaultValueConfig: DefaultValueConfigStatic) {
    let value = defaultValueConfig?.value ?? null;
    if (value) {
      value = this.entitySchemaService.valueToEntityFormat(
        value,
        this.entitySchemaField(),
      );
    }
    return value;
  }

  /**
   * Set the CustomFormControl value as output (after transforming it to desired format).
   * @param newValue
   * @private
   */
  private emitNewValue(newValue: any) {
    // to the outside we want to set the value in the database format for simplified storing in the config object
    if (newValue) {
      newValue = this.entitySchemaService.valueToDatabaseFormat(
        newValue,
        this.entitySchemaField(),
      );
    }

    this.value = { value: newValue };
  }
}
