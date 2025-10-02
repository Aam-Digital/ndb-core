import { Component, Input } from "@angular/core";
import { EditComponent } from "../../../entity/default-datatype/edit-component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgClass } from "@angular/common";

@DynamicComponent("EditText")
@Component({
  selector: "app-edit-text",
  templateUrl: "./edit-text.component.html",
  styleUrls: ["./edit-text.component.scss"],
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    ErrorHintComponent,
    MatTooltipModule,
    NgClass,
  ],
})
export class EditTextComponent extends EditComponent<string> {
  @Input() displayFullLengthLabel: boolean = false;
}
