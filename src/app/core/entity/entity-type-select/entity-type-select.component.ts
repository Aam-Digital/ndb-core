import { Component, Input, OnInit } from "@angular/core";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { EntityConstructor } from "../model/entity";
import { EntityRegistry } from "../database-entity.decorator";
import { MatFormField, MatLabel } from "@angular/material/form-field";

@Component({
  selector: "app-entity-type-select",
  templateUrl: "./entity-type-select.component.html",
  imports: [
    BasicAutocompleteComponent,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
  ],
  standalone: true,
})
export class EntityTypeSelectComponent implements OnInit {
  @Input() formControl: FormControl;
  @Input() allowMultiSelect = false;
  @Input() label: string;

  /**
   * whether to include entity types without a human-readable label
   * (usually only used internally for technical purposes)
   */
  @Input() showInternalTypes: boolean = false;

  entityTypes: EntityConstructor[];
  optionToLabel = (option: EntityConstructor) => option.label;
  optionToId = (option: EntityConstructor) => option.ENTITY_TYPE;

  constructor(private entityRegistry: EntityRegistry) {}

  ngOnInit() {
    this.entityTypes = this.entityRegistry
      .getEntityTypes(true)
      .filter(({ value }) => this.showInternalTypes || !!value.label)
      .map(({ value }) => value);
  }
}
