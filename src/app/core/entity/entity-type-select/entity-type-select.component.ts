import {
  Component,
  computed,
  effect,
  inject,
  Input,
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
export class EntityTypeSelectComponent extends BasicAutocompleteComponent<
  EntityConstructor,
  string
> {
  @Input() override multi = false;
  @Input() override placeholder =
    $localize`:EntityTypeSelect placeholder:Select Record Type`;

  /**
   * whether to include record types without a human-readable label
   * (usually only used internally for technical purposes)
   */
  showInternalTypes = input(false);

  private readonly entityRegistry = inject(EntityRegistry);
  private readonly availableEntityTypes = computed(() =>
    this.entityRegistry
      .getEntityTypes(!this.showInternalTypes())
      .map(({ value }) => value),
  );

  constructor() {
    super();

    effect(() => {
      this.options = this.availableEntityTypes();
    });
  }

  override optionToString = (option: EntityConstructor) =>
    option.label ?? option.ENTITY_TYPE;
  override valueMapper = (option: EntityConstructor) => option.ENTITY_TYPE;
}
