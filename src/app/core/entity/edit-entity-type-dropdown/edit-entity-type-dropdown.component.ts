import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../default-datatype/edit-component";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EntityTypeSelect } from "../entity-type-select/entity-type-select.component";
import { MatFormField, MatLabel } from "@angular/material/form-field";

/**
 * Edit component for selecting an entity type from a dropdown.
 */
@DynamicComponent("EditEntityTypeDropdown")
@Component({
  selector: "app-edit-entity-type-dropdown",
  templateUrl: "./edit-entity-type-dropdown.component.html",
  imports: [EntityTypeSelect, MatFormField, MatLabel],
  standalone: true,
})
export class EditEntityTypeDropdownComponent
  extends EditComponent<string | string[]>
  implements OnInit
{
  multi = false;

  override ngOnInit() {
    super.ngOnInit();
    this.multi = this.formFieldConfig.isArray;
  }
}
