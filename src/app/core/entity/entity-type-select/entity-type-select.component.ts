import { Component, inject, Input, OnChanges, OnInit } from "@angular/core";
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
  imports: BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  providers: [
    { provide: MatFormFieldControl, useExisting: EntityTypeSelectComponent },
  ],
})
export class EntityTypeSelectComponent
  extends BasicAutocompleteComponent<EntityConstructor, string>
  implements OnInit, OnChanges
{
  @Input() override multi = false;
  @Input() override placeholder =
    $localize`:EntityTypeSelect placeholder:Select Entity Type`;

  /**
   * whether to include entity types without a human-readable label
   * (usually only used internally for technical purposes)
   */
  @Input() showInternalTypes: boolean = false;

  private entityRegistry = inject(EntityRegistry);

  override optionToString = (option: EntityConstructor) =>
    option.label ?? option.ENTITY_TYPE;
  override valueMapper = (option: EntityConstructor) => option.ENTITY_TYPE;

  override ngOnInit() {
    this.initOptions();
    super.ngOnInit();
  }

  private initOptions() {
    this.options = this.entityRegistry
      .getEntityTypes(!this.showInternalTypes)
      .map(({ value }) => value);
  }

  override ngOnChanges(changes: { [key in keyof this]?: any }) {
    if (changes.showInternalTypes) {
      this.initOptions();
    }

    super.ngOnChanges(changes);
  }
}
