import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { Entity } from "#src/app/core/entity/model/entity";
import { EmailClientService } from "#src/app/features/email-client/email-client.service";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
} from "@angular/core";
import {
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MatFormFieldControl,
  MatFormFieldModule,
} from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";

@DynamicComponent("EditEmail")
@Component({
  selector: "app-edit-email",
  templateUrl: "./edit-email.component.html",
  styleUrls: [
    "./edit-email.component.scss",
    "../../../entity/entity-field-edit/dynamic-edit/dynamic-edit.component.scss",
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditEmailComponent },
  ],
})
export class EditEmailComponent
  extends CustomFormControlDirective<string>
  implements EditComponent, OnInit
{
  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  private readonly emailClientService = inject(EmailClientService);

  ngOnInit() {
    this.formControl.addValidators([emailValidatorWithMessage]);
  }

  openEmailDialog(event: Event) {
    event.stopPropagation();

    const entity = this.entity();
    if (!entity) {
      return;
    }

    // use the current (possibly not yet saved) input value, not the field's last saved state
    const fieldId = this.formFieldConfig()?.id;
    const entityWithCurrentValue = fieldId
      ? Object.assign(entity.copy(), { [fieldId]: this.valueSignal() })
      : entity;

    this.emailClientService.executeMailto(entityWithCurrentValue);
  }
}

function emailValidatorWithMessage(
  control: AbstractControl,
): ValidationErrors | null {
  const emailError = Validators.email(control);
  if (emailError) {
    return {
      email: {
        errorMessage: $localize`:form field validation error:Please enter a valid email`,
      },
    };
  }
  return null;
}
