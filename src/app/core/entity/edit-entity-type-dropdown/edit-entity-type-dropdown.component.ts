import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../default-datatype/edit-component";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatTooltip } from "@angular/material/tooltip";
import { NgIf } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { MatInput } from "@angular/material/input";
import { EntityConstructor } from "../model/entity";
import { EntityRegistry } from "../database-entity.decorator";

/**
 * Edit component for selecting an entity type from a dropdown.
 */
@DynamicComponent("EditEntityTypeDropdown")
@Component({
  selector: "app-edit-entity-type-dropdown",
  templateUrl: "./edit-entity-type-dropdown.component.html",
  imports: [
    BasicAutocompleteComponent,
    FaIconComponent,
    MatFormField,
    MatLabel,
    MatTooltip,
    NgIf,
    ReactiveFormsModule,
    MatInput,
  ],
  standalone: true,
})
export class EditEntityTypeDropdownComponent
  extends EditComponent<string | string[]>
  implements OnInit
{
  multi = false;

  entityTypes: EntityConstructor[];
  optionToLabel = (option: EntityConstructor) => option.label;
  optionToId = (option: EntityConstructor) => option.ENTITY_TYPE;

  constructor(private entityRegistry: EntityRegistry) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.multi = this.formFieldConfig.isArray;

    this.entityTypes = this.entityRegistry
      .getEntityTypes(true)
      .map(({ value }) => value);
  }
}
