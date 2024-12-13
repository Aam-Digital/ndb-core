import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../default-datatype/edit-component";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EntityTypeSelectorComponent } from "../entity-type-selector/entity-type-selector.component";

/**
 * Edit component for selecting an entity type from a dropdown.
 */
@DynamicComponent("EditEntityTypeDropdown")
@Component({
  selector: "app-edit-entity-type-dropdown",
  templateUrl: "./edit-entity-type-dropdown.component.html",
  imports: [EntityTypeSelectorComponent],
  standalone: true,
})
export class EditEntityTypeDropdownComponent
  extends EditComponent<string | string[]>
  implements OnInit
{
  multi = false;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.multi = this.formFieldConfig.isArray;
  }
}
