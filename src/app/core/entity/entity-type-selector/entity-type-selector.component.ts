import { Component, OnInit, Input } from "@angular/core";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { MatFormField } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { EntityConstructor } from "../model/entity";
import { EntityRegistry } from "../database-entity.decorator";

/**
 * Component for selecting an entity type from a dropdown.
 */
@Component({
  selector: "app-entity-type-selector",
  templateUrl: "./entity-type-selector.component.html",
  imports: [BasicAutocompleteComponent, MatFormField, ReactiveFormsModule],
  standalone: true,
})
export class EntityTypeSelectorComponent implements OnInit {
  @Input() isMulti = false;

  entityTypes: EntityConstructor[];
  optionToLabel = (option: EntityConstructor) => option.label;
  optionToId = (option: EntityConstructor) => option.ENTITY_TYPE;
  placeholder = "Select an entity type";

  constructor(private entityRegistry: EntityRegistry) {}

  ngOnInit() {
    this.entityTypes = this.entityRegistry
      .getEntityTypes(true)
      .map(({ value }) => value);
  }
}
