import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../edit-component";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { ErrorHintComponent } from "../../error-hint/error-hint.component";
import { NgIf } from "@angular/common";

@DynamicComponent("EditDescriptionOnly")
@Component({
  selector: "app-edit-description-only",
  template: "{{label}}",
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    ErrorHintComponent,
    NgIf,
  ],
  standalone: true,
})
export class EditDescriptionOnlyComponent
  extends EditComponent<string>
  implements OnInit
{
  ngOnInit() {
    // override base class on init because this does not have a valid formControl!
    this.label = this.formFieldConfig?.label;
  }
}
