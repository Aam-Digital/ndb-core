import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from "@angular/core";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EntityTypeSelectComponent } from "../entity-type-select/entity-type-select.component";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { CustomFormControlDirective } from "../../common-components/basic-autocomplete/custom-form-control.directive";
import { MatFormFieldControl } from "@angular/material/form-field";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";

/**
 * Edit component for selecting an entity type from a dropdown.
 */
@DynamicComponent("EditEntityType")
@Component({
  selector: "app-edit-entity-type",
  templateUrl: "./edit-entity-type.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EntityTypeSelectComponent, ReactiveFormsModule],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditEntityTypeComponent },
  ],
})
export class EditEntityTypeComponent
  extends CustomFormControlDirective<string | string[]>
  implements OnInit
{
  @Input() formFieldConfig?: FormFieldConfig;
  multi = false;

  get formControl(): FormControl<string | string[]> {
    return this.ngControl.control as FormControl<string | string[]>;
  }

  ngOnInit() {
    this.multi = this.formFieldConfig?.isArray ?? false;
  }
}
