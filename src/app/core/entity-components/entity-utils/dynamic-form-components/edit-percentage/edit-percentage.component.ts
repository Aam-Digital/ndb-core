import { Component } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { Validators } from "@angular/forms";

@Component({
  selector: "app-edit-percentage",
  templateUrl: "./edit-percentage.component.html",
  styleUrls: ["./edit-percentage.component.scss"],
})
export class EditPercentageComponent extends EditComponent<number> {
  onInitFromDynamicConfig(config: EditPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    const newValidators = [Validators.max(100), Validators.pattern("[0-9]*")];
    if (this.formControl.validator) {
      newValidators.push(this.formControl.validator);
    }
    this.formControl.setValidators(newValidators);
    this.formControl.updateValueAndValidity();
  }
}
