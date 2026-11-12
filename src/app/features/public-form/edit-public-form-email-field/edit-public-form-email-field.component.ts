import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { CustomFormControlDirective } from "../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityFieldSelectComponent } from "../../../core/entity/entity-field-select/entity-field-select.component";
import { EditComponent } from "../../../core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { Entity } from "../../../core/entity/model/entity";

/** Picks the field of the submitted record that holds the address the confirmation is sent to. */
@DynamicComponent("EditPublicFormEmailField")
@Component({
  selector: "app-edit-public-form-email-field",
  standalone: true,
  imports: [ReactiveFormsModule, EntityFieldSelectComponent],
  templateUrl: "./edit-public-form-email-field.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditPublicFormEmailFieldComponent,
    },
  ],
})
export class EditPublicFormEmailFieldComponent
  extends CustomFormControlDirective<string>
  implements EditComponent
{
  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  private readonly entities = inject(EntityRegistry);

  /** not set before the record type is saved, nor for configs in the multi form format */
  protected readonly entityType = computed(() => {
    const configuredType = this.entity()?.["entity"];
    return configuredType ? this.entities.get(configuredType) : undefined;
  });

  protected readonly hideNonEmailFields = (option: FormFieldConfig): boolean =>
    option.dataType !== "email";
}
