import {
  Component,
  Input,
  Resource,
  Signal,
  computed,
  inject,
  input,
  resource,
  signal,
} from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { lastValueFrom, switchMap, map } from "rxjs";
import { Entity } from "../../entity/model/entity";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatChipsModule } from "@angular/material/chips";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntityBlockComponent } from "../../basic-datatypes/entity/entity-block/entity-block.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ErrorHintComponent } from "../error-hint/error-hint.component";
import { BasicAutocompleteComponent } from "../basic-autocomplete/basic-autocomplete.component";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { asArray } from "app/utils/asArray";
import { Logging } from "../../logging/logging.service";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";

@Component({
  selector: "app-entity-select",
  templateUrl: "./entity-select.component.html",
  styleUrls: [
    "./entity-select.component.scss",
    "../../common-components/basic-autocomplete/basic-autocomplete-dropdown.component.scss",
  ],
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatChipsModule,
    EntityBlockComponent,
    FontAwesomeModule,
    MatTooltipModule,
    MatInputModule,
    MatCheckboxModule,
    ErrorHintComponent,
    BasicAutocompleteComponent,
    MatSlideToggle,
    FormsModule,
  ],
})
@UntilDestroy()
export class EntitySelectComponent<E extends Entity> {
  private entityMapperService = inject(EntityMapperService);
  private formDialog = inject(FormDialogService);
  private entityRegistry = inject(EntityRegistry);

  readonly loadingPlaceholder = $localize`:A placeholder for the input element when select options are not loaded yet:loading...`;

  form = input<FormControl<string[] | string>>();

  /**
   * The entity-type (e.g. 'Child', 'School', e.t.c.) to set.
   * @param type The ENTITY_TYPE of a Entity. This affects the entities which will be loaded and the component
   *             that displays the entities. Can be an array giving multiple types.
   * @throws Error when `type` is not in the entity-map
   */
  entityType: Signal<string[]> = input([], {
    transform: (type: string | string[] | undefined): string[] => {
      return asArray(type ?? []);
    },
  });

  /**
   * Whether users can select multiple entities.
   */
  @Input() multi: boolean = true;

  /**
   * Disable the option to type any text into the selection field and use a "Create new ..." link to open the form for a new entity.
   */
  @Input() disableCreateNew: boolean;

  /**
   * The label is what is seen above the list. For example when used
   * in the note-details-view, this is "Children"
   */
  @Input() label: string;

  /**
   * The placeholder is what is seen when someone clicks into the input
   * field and adds new entities.
   * In the note-details-view, this is "Add children..."
   * The placeholder is only displayed if `loading === false`
   */
  @Input() placeholder: string;

  /**
   * Whether to show entities in the list.
   * Entities can still be selected using the autocomplete,
   * and {@link selection} as well as {@link selectionChange} will
   * still work as expected
   */
  @Input() showEntities: boolean = true;

  hasInaccessibleEntities: Boolean = false;

  includeInactive = input<boolean>(false);
  currentlyMatchingInactive: Signal<number> = computed(() => {
    return this.entitiesForType
      .value()
      .filter((e) => !e.isActive && this.autocompleteFilter()(e)).length;
  });

  /**
   * The accessor used for filtering and when selecting a new
   * entity.
   * <br> Per default, this filters for the name. If the entity
   * has no name, this filters for the entity's id.
   */
  @Input() accessor: (e: Entity) => string = (e) => e.toString();
  entityToId = (option: E) => option.getId();

  @Input() additionalFilter: (e: E) => boolean = (_) => true;

  private entitiesForType: Resource<E[]> = resource({
    defaultValue: [],
    params: () => ({
      entityTypes: this.entityType(),
    }),
    loader: async ({ params }) => {
      if (params.entityTypes.length === 0) return [];

      const entities: E[] = [];
      for (const type of params.entityTypes) {
        entities.push(...(await this.entityMapperService.loadType<E>(type)));
      }

      return entities
        .filter((e) => this.additionalFilter(e))
        .sort((a, b) => a.toString().localeCompare(b.toString()));
    },
  });

  /**
   * true when this is loading and false when it's ready.
   * This subject's state reflects the actual loading resp. the 'readiness'-
   * state of this component. Will trigger once loading is done
   */
  loading: Signal<boolean> = computed(() => this.entitiesForType.isLoading());

  /**
   * The currently selected values (IDs) of the form control.
   */
  values: Signal<string[]> = toSignal(
    toObservable(this.form)
      .pipe(switchMap((form) => form.valueChanges))
      .pipe(map(asArray)),
    { initialValue: [] },
  );

  private availableOptionsResource: Resource<E[]> = resource({
    defaultValue: [],
    params: () => ({
      allEntities: this.entitiesForType.value(),
      values: this.values(),
      includeInactive: this.includeInactive(),
    }),
    loader: async ({ params }) => {
      const includeSelected = (entity: E) =>
        asArray(params.values).includes(entity.getId());

      const availableEntities = params.allEntities.filter(
        (e) => params.includeInactive || e.isActive || includeSelected(e),
      );

      if (params.values !== null && params.values !== undefined) {
        for (const id of asArray(params.values)) {
          if (id === null || id === undefined || id === "") {
            continue;
          }

          if (availableEntities.find((e) => id === e.getId())) {
            continue;
          }

          const additionalEntity = await this.getEntity(id);
          if (additionalEntity) {
            availableEntities.push(additionalEntity);
          } else {
            this.hasInaccessibleEntities = true;
            availableEntities.push({
              getId: () => id,
              isHidden: true,
            } as unknown as E);
          }
        }
      }

      return availableEntities;
    },
  });

  availableOptions: Signal<E[]> = computed(() =>
    this.availableOptionsResource.value(),
  );

  private async getEntity(selectedId: string): Promise<E | undefined> {
    const type = Entity.extractTypeFromId(selectedId);

    const entity = await this.entityMapperService
      .load<E>(type, selectedId)
      .catch((err: Error) => {
        Logging.warn(
          "[ENTITY_SELECT] Error loading selected entity.",
          this.label,
          selectedId,
          err.message,
        );
        return undefined;
      });

    return entity;
  }

  toggleIncludeInactive() {
    this.includeInactive.set(!this.includeInactive());
  }

  private autocompleteFilter = signal<(o: E) => boolean>(() => true);

  /**
   * Recalculates the number of inactive entities that match the current filter,
   * and optionally updates the current filter function (otherwise reuses the filter previously set)
   * @param newAutocompleteFilter
   */
  recalculateMatchingInactive(
    newAutocompleteFilter?: (o: Entity) => boolean,
  ) {
    if (newAutocompleteFilter) {
      this.autocompleteFilter.set(newAutocompleteFilter);
    }
  }

  createNewEntity = async (input: string): Promise<E> => {
    const entityTypes = this.entityType();
    if (entityTypes.length < 1) {
      return;
    }
    if (entityTypes.length > 1) {
      Logging.warn(
        "EntitySelect with multiple types is always creating a new entity of the first listed type only.",
      );
      // TODO: maybe display an additional popup asking the user to select which type should be created?
    }

    const newEntity = new (this.entityRegistry.get(entityTypes[0]))();
    applyTextToCreatedEntity(newEntity, input);

    const dialogRef = this.formDialog.openFormPopup(newEntity);
    return lastValueFrom<E | undefined>(dialogRef.afterClosed());
  };
}

/**
 * Update the given entity by applying the text entered by a user
 * to the most likely appropriate entity field, inferred from the toString representation.
 */
export function applyTextToCreatedEntity(entity: Entity, input: string) {
  const toStringFields = entity.getConstructor().toStringAttributes;
  if (!toStringFields || toStringFields.length < 1) {
    return;
  }

  const inputParts = input.split(/\s+/);
  for (let i = 0; i < inputParts.length; i++) {
    const targetProperty =
      toStringFields[i < toStringFields.length ? i : toStringFields.length - 1];

    entity[targetProperty] = (
      (entity[targetProperty] ?? "") +
      " " +
      inputParts[i]
    ).trim();
  }

  return entity;
}
