import {
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { CustomFormControlDirective } from "../../../../common-components/basic-autocomplete/custom-form-control.directive";
import { MatCheckbox, MatCheckboxModule } from "@angular/material/checkbox";
import {
  FormGroupDirective,
  FormsModule,
  NgControl,
  NgForm,
} from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { ErrorStateMatcher } from "@angular/material/core";

@Component({
  selector: "app-boolean-input",
  imports: [MatCheckboxModule, FormsModule],
  providers: [
    { provide: MatFormFieldControl, useExisting: BooleanInputComponent },
  ],
  templateUrl: "./boolean-input.component.html",
  styleUrls: ["./boolean-input.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class BooleanInputComponent extends CustomFormControlDirective<boolean> {
  @ViewChild(MatCheckbox, { static: true }) inputElement: MatCheckbox;

  override onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() != "mat-checkbox") {
      this.inputElement.focus();
    }
  }
}
