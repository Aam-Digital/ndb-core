import { Component, Input } from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { DynamicValidatorsService } from "../../entity-form/dynamic-form-validators/dynamic-validators.service";

@Component({
  selector: "app-error-hint",
  templateUrl: "./error-hint.component.html",
  styleUrls: ["./error-hint.component.scss"],
})
export class ErrorHintComponent {
  @Input() form: UntypedFormControl;

  constructor(public validatorService: DynamicValidatorsService) {}
}
