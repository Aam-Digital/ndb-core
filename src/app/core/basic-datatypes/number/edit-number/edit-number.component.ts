import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../../../entity/default-datatype/edit-component";
import { CustomNumberValidators } from "../../../../utils/custom-number-validators";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";

@DynamicComponent("EditNumber")
@Component({
  selector: "app-edit-number",
  templateUrl: "./edit-number.component.html",
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    ErrorHintComponent,
  ],
})
export class EditNumberComponent
  extends EditComponent<number>
  implements OnInit
{
  override ngOnInit() {
    super.ngOnInit();
    const newValidators = [CustomNumberValidators.isNumber];
    if (this.formControl.validator) {
      newValidators.push(this.formControl.validator);
    }
    this.formControl.setValidators(newValidators);
    this.formControl.updateValueAndValidity();
  }
}
