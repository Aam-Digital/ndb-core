import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  AbstractControl,
  ReactiveFormsModule,
  ValidationErrors,
} from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { CustomFormControlDirective } from "../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import {
  FormFieldConfig,
  toFormFieldConfig,
} from "../../../core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { FieldGroup } from "../../../core/entity-details/form/field-group";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityFieldSelectComponent } from "../../../core/entity/entity-field-select/entity-field-select.component";
import { EditComponent } from "../../../core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { Entity } from "../../../core/entity/model/entity";

/** A recipient field is needed while confirmations are switched on; reads the toggle from the sibling control. */
const requiredWhenConfirmationEnabled = (
  control: AbstractControl,
): ValidationErrors | null =>
  control.parent?.get("sendConfirmationEmail")?.value && !control.value
    ? {
        recipientFieldRequired: {
          errorMessage: $localize`:PublicFormConfig:Select the field holding the email address, or switch the confirmation email off`,
        },
      }
    : null;

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
  implements EditComponent, OnInit
{
  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  private readonly entities = inject(EntityRegistry);
  private readonly destroyRef = inject(DestroyRef);

  /** not set before the record type is saved, nor for configs in the multi form format */
  protected readonly entityType = computed(() => {
    const configuredType = this.entity()?.["entity"];
    return configuredType ? this.entities.get(configuredType) : undefined;
  });

  /** ids of the fields the form asks the submitter for */
  private readonly collectedFieldIds = computed(() => {
    const columns: FieldGroup[] = this.entity()?.["columns"] ?? [];
    return new Set(
      columns.flatMap((group) =>
        (group.fields ?? []).map((field) => toFormFieldConfig(field).id),
      ),
    );
  });

  /** only email fields the form actually collects: anything else could never hold an address to send to */
  protected readonly hideOption = computed(() => {
    const collected = this.collectedFieldIds();
    return (option: FormFieldConfig): boolean =>
      option.dataType !== "email" || !collected.has(option.id);
  });

  ngOnInit(): void {
    this.formControl.addValidators(requiredWhenConfirmationEnabled);

    this.formControl.parent
      ?.get("sendConfirmationEmail")
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formControl.updateValueAndValidity());
  }
}
