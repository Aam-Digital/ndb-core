import { Component, ViewEncapsulation } from "@angular/core";
import { EditComponent } from "../../../entity/default-datatype/edit-component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { BooleanInputComponent } from "./boolean-input/boolean-input.component";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";

@DynamicComponent("EditBoolean")
@Component({
  selector: "app-edit-boolean",
  templateUrl: "./edit-boolean.component.html",
  styleUrls: ["./edit-boolean.component.scss"],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    BooleanInputComponent,
    ErrorHintComponent,
  ],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class EditBooleanComponent extends EditComponent<boolean> {}
