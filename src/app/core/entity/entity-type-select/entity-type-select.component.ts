import {
  Component,
  effect,
  inject,
  OnInit,
  input,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  BasicAutocompleteComponent,
} from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { EntityConstructor } from "../model/entity";
import { EntityRegistry } from "../database-entity.decorator";
import { MatFormFieldControl } from "@angular/material/form-field";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  implements OnInit
{
  override multi = false;
  override placeholder = $localize`:EntityTypeSelect placeholder:Select Record Type`;

  /**
   * whether to include record types without a human-readable label
   * (usually only used internally for technical purposes)
   */
  showInternalTypes = input(false);

  private entityRegistry = inject(EntityRegistry);

  constructor() {
    super();
    effect(() => {
      this.initOptions();
    });
  }

  override optionToString = (option: EntityConstructor) =>
    option.label ?? option.ENTITY_TYPE;
  override valueMapper = (option: EntityConstructor) => option.ENTITY_TYPE;

  override ngOnInit() {
    this.initOptions();
    super.ngOnInit();
  }

  private initOptions() {
    this.options = this.entityRegistry
      .getEntityTypes(!this.showInternalTypes())
      .map(({ value }) => value);
  }
}
