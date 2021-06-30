import { Component } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { Validators } from "@angular/forms";

@Component({
  selector: "app-edit-number",
  templateUrl: "./edit-number.component.html",
  styleUrls: ["./edit-number.component.scss"],
})
export class EditNumberComponent extends EditComponent<number> {
  onInitFromDynamicConfig(config: EditPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    const newValidators = [Validators.pattern("[0-9]*")];
    if (this.formControl.validator) {
      newValidators.push(this.formControl.validator);
    }
    this.formControl.setValidators(newValidators);
    this.formControl.updateValueAndValidity();
  }
}
