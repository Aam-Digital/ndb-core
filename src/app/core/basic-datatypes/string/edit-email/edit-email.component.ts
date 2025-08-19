import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../../../entity/default-datatype/edit-component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule, Validators } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";
import { MatTooltipModule } from "@angular/material/tooltip";

@DynamicComponent("EditEmail")
@Component({
  selector: "app-edit-email",
  templateUrl: "./edit-email.component.html",
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    ErrorHintComponent,
    MatTooltipModule,
  ],
})
export class EditEmailComponent
  extends EditComponent<string>
  implements OnInit
{
override ngOnInit() {
  super.ngOnInit();

  this.formControl.addValidators([
    Validators.email
  ]);

  this.formControl.valueChanges.subscribe((value) => {
    if (value) {

    if (this.formControl.value === value) {
      // nothing changed, don't update the form control
      return;
    }
        this.formControl.setValue(value, { emitEvent: false });
    }
  });
}

}
