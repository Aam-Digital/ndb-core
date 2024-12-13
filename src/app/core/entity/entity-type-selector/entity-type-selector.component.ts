import { Component, OnInit, Input } from '@angular/core';
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
  selector: 'app-entity-type-selector',
  templateUrl: './entity-type-selector.component.html',
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
export class EntityTypeSelectorComponent implements OnInit
{
  @Input() isMulti = false;

  entityTypes: EntityConstructor[];
  optionToLabel = (option: EntityConstructor) => option.label;
  optionToId = (option: EntityConstructor) => option.ENTITY_TYPE;
  placeholder = 'Select an entity type';

  constructor(private entityRegistry: EntityRegistry) {}

  ngOnInit() {
    this.entityTypes = this.entityRegistry
      .getEntityTypes(true)
      .map(({ value }) => value);
  }
}
