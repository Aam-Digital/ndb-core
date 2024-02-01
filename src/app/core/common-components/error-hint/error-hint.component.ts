import { Component, Input } from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { KeyValuePipe, NgForOf } from "@angular/common";

@Component({
  selector: "app-error-hint",
  templateUrl: "./error-hint.component.html",
  styleUrls: ["./error-hint.component.scss"],
  imports: [NgForOf, KeyValuePipe],
  standalone: true,
})
export class ErrorHintComponent {
  @Input() form: UntypedFormControl;
}
