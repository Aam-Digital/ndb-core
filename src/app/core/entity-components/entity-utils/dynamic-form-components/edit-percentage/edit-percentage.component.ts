import { Component } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { Validators } from "@angular/forms";
import { CustomNumberValidators } from "../../../../../utils/custom-number-validators";

@Component({
  selector: "app-edit-percentage",
  templateUrl: "./edit-percentage.component.html",
  styleUrls: ["./edit-percentage.component.scss"],
})
export class EditPercentageComponent extends EditComponent<number> {
  minValue = 0;
  maxValue = 100;

  onInitFromDynamicConfig(config: EditPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    const newValidators = [
      Validators.min(this.minValue),
      Validators.max(this.maxValue),
      CustomNumberValidators.isNumber,
    ];
    if (this.formControl.validator) {
      newValidators.push(this.formControl.validator);
    }
    this.formControl.setValidators(newValidators);
    this.formControl.updateValueAndValidity();
  }
}
