import { Component, Input } from "@angular/core";
import { CustomFormControlDirective } from "../../basic-autocomplete/custom-form-control.directive";
import { ReactiveFormsModule } from "@angular/forms";
import { DynamicComponentDirective } from "#src/app/core/config/dynamic-components/dynamic-component.directive";
import { MatFormFieldControl } from "@angular/material/form-field";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { Entity } from "#src/app/core/entity/model/entity";
import { EditComponent } from "./edit-component.interface";

@Component({
  selector: "app-dynamic-edit",
  imports: [DynamicComponentDirective, ReactiveFormsModule],
  templateUrl: "./dynamic-edit.component.html",
  styleUrl: "./dynamic-edit.component.scss",
  providers: [
    { provide: MatFormFieldControl, useExisting: DynamicEditComponent },
  ],
})
export class DynamicEditComponent extends CustomFormControlDirective<any> implements EditComponent {
  @Input() formFieldConfig: FormFieldConfig;
  @Input() entity: Entity;
}
