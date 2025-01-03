import { Component, inject, Input } from "@angular/core";
import {
  BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  BasicAutocompleteComponent,
} from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { EntityConstructor } from "../model/entity";
import { EntityRegistry } from "../database-entity.decorator";
import { MatFormFieldControl } from "@angular/material/form-field";

@Component({
  selector: "app-entity-type-select",
  templateUrl:
    "../../common-components/basic-autocomplete/basic-autocomplete.component.html",
  standalone: true,
  imports: BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  providers: [
    { provide: MatFormFieldControl, useExisting: EntityTypeSelectComponent },
  ],
})
export class EntityTypeSelectComponent extends BasicAutocompleteComponent<
  EntityConstructor,
  string
> {
  @Input() override multi = false;
  @Input() override placeholder =
    $localize`:EntityTypeSelect placeholder:Select Entity Type`;

  private entityRegistry = inject(EntityRegistry);

  override optionToString = (option: EntityConstructor) => option.label;
  override valueMapper = (option: EntityConstructor) => option.ENTITY_TYPE;

  override ngOnInit() {
    this.options = this.entityRegistry
      .getEntityTypes(true)
      .map(({ value }) => value);

    super.ngOnInit();
  }
}
