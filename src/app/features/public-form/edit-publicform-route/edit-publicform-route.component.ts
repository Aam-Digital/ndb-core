import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
} from "@angular/core";
import {
  AbstractControl,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { MatIconButton } from "@angular/material/button";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AlertService } from "../../../core/alerts/alert.service";
import { CustomFormControlDirective } from "../../../core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { Entity } from "../../../core/entity/model/entity";
import { PublicFormConfig } from "../public-form-config";

const noSpecialUrlChars: ValidatorFn = (control: AbstractControl) => {
  const value: string = control.value;
  if (value && !/^[a-zA-Z\d\-_]+$/.test(value)) {
    return {
      pattern: {
        errorMessage: $localize`The link ID may only contain lowercase letters, digits, hyphens and underscores`,
      },
    };
  }
  return null;
};

/**
 * Special Form Field to edit an ID and copy the full public-form URL generated based on this.
 */
@DynamicComponent("EditPublicformRoute")
@Component({
  selector: "app-edit-publicform-route",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    FontAwesomeModule,
    MatIconButton,
    MatTooltipModule,
  ],
  templateUrl: "./edit-publicform-route.component.html",
  styleUrls: ["./edit-publicform-route.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MatFormFieldControl, useExisting: EditPublicformRouteComponent },
  ],
})
export class EditPublicformRouteComponent
  extends CustomFormControlDirective<string>
  implements OnInit, EditComponent
{
  private alertService = inject(AlertService);

  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  prefixValue: string;
  private fullPrefixUrl: string;

  ngOnInit(): void {
    const publicFormConfig: PublicFormConfig = {
      route: this.formControl.getRawValue(),
    } as Partial<PublicFormConfig> as PublicFormConfig;

    this.formControl.setValidators([Validators.required, noSpecialUrlChars]);
    this.formControl.setValue(publicFormConfig.route);

    this.fullPrefixUrl = `${window.location.origin}/public-form/form/`;
    this.prefixValue = `${window.location.origin}/.../`;
  }

  copyToClipboard(): void {
    const fullUrl = this.fullPrefixUrl + (this.formControl.value || "");
    navigator.clipboard.writeText(fullUrl).then(() => {
      this.alertService.addInfo("Link copied: " + fullUrl);
    });
  }
}
