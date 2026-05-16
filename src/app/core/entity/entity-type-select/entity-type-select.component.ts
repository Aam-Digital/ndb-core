import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  Input,
  OnInit,
} from "@angular/core";
import { MatFormFieldControl } from "@angular/material/form-field";
import {
  BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  BasicAutocompleteComponent,
} from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { EntityRegistry } from "../database-entity.decorator";
import { EntityConstructor } from "../model/entity";

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
  @Input() override multi = false;
  @Input() override placeholder =
    $localize`:EntityTypeSelect placeholder:Select Record Type`;

  /**
   * whether to include record types without a human-readable label
   * (usually only used internally for technical purposes)
   */
  showInternalTypes = input(false);

  private entityRegistry = inject(EntityRegistry);

  private entityTypes = computed(() =>
    this.entityRegistry
      .getEntityTypes(!this.showInternalTypes())
      .map(({ value }) => value),
  );

  constructor() {
    super();
    effect(() => {
      this.options = this.entityTypes();
    });
  }

  override optionToString = (option: EntityConstructor) =>
    option.label ?? option.ENTITY_TYPE;
  override valueMapper = (option: EntityConstructor) => option.ENTITY_TYPE;
}
