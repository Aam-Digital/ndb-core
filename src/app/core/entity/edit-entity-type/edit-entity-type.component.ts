import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../default-datatype/edit-component";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EntityTypeSelectComponent } from "../entity-type-select/entity-type-select.component";
import { MatFormField, MatLabel } from "@angular/material/form-field";

/**
 * Edit component for selecting an entity type from a dropdown.
 */
@DynamicComponent("EditEntityType")
@Component({
  selector: "app-edit-entity-type-dropdown",
  templateUrl: "./edit-entity-type.component.html",
  imports: [EntityTypeSelectComponent, MatFormField, MatLabel],
  standalone: true,
})
export class EditEntityTypeComponent
  extends EditComponent<string | string[]>
  implements OnInit
{
  multi = false;

  override ngOnInit() {
    super.ngOnInit();
    this.multi = this.formFieldConfig.isArray;
  }
}
