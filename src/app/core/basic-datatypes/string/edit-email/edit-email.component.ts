import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";

@DynamicComponent("EditEmail")
@Component({
  selector: "app-edit-email",
  templateUrl: "./edit-email.component.html",
  styleUrls: ["./edit-email.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatInputModule, ReactiveFormsModule],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditEmailComponent },
  ],
})
export class EditEmailComponent
  extends CustomFormControlDirective<string>
  implements EditComponent, OnInit
{
  @Input() formFieldConfig?: FormFieldConfig;

  get formControl(): FormControl<string> {
    return this.ngControl.control as FormControl<string>;
  }

  ngOnInit() {
    this.formControl.addValidators([Validators.email]);
  }
}
