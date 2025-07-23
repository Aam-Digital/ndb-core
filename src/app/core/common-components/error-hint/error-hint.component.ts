import { Component, Input } from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { KeyValuePipe } from "@angular/common";

@Component({
  selector: "app-error-hint",
  templateUrl: "./error-hint.component.html",
  styleUrls: ["./error-hint.component.scss"],
  imports: [KeyValuePipe],
})
export class ErrorHintComponent {
  @Input() form: UntypedFormControl;
}
