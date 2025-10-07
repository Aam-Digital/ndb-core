import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
} from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
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

  @Input() formFieldConfig?: FormFieldConfig;
  @Input() entity?: Entity;

  prefixValue: string;

  get formControl(): FormControl<string> {
    return this.ngControl.control as FormControl<string>;
  }

  ngOnInit(): void {
    const publicFormConfig: PublicFormConfig = {
      route: this.formControl.getRawValue(),
    } as Partial<PublicFormConfig> as PublicFormConfig;

    this.formControl.setValidators([Validators.required]);
    this.formControl.setValue(publicFormConfig.route);

    this.prefixValue = `${window.location.origin}/public-form/form/`;
  }

  copyToClipboard(): void {
    const fullUrl = this.prefixValue + (this.formControl.value || "");
    navigator.clipboard.writeText(fullUrl).then(() => {
      this.alertService.addInfo("Link copied: " + fullUrl);
    });
  }
}
