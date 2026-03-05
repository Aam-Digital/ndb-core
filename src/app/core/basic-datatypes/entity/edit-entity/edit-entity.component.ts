import { resourceWithRetention } from "#src/app/utils/resourceWithRetention";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  input,
  InputSignal,
  OnInit,
  Resource,
  Signal,
  signal,
  ViewChild,
} from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { asArray } from "app/utils/asArray";
import { lastValueFrom, map, startWith, switchMap } from "rxjs";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../../entity/model/entity";
import { FormDialogService } from "../../../form-dialog/form-dialog.service";
import { Logging } from "../../../logging/logging.service";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { EntityBlockComponent } from "../entity-block/entity-block.component";

/**
 * A form field to select among the entities of the given type(s).
 * Can be configured as single or multi select.
 */
@DynamicComponent("EditEntity")
@Component({
  selector: "app-edit-entity",
  templateUrl: "./edit-entity.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: [
    "../../../common-components/basic-autocomplete/basic-autocomplete-dropdown.component.scss",
  ],
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatChipsModule,
    EntityBlockComponent,
    FontAwesomeModule,
    MatTooltipModule,
    MatInputModule,
    MatCheckboxModule,
    BasicAutocompleteComponent,
    MatSlideToggle,
    FormsModule,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditEntityComponent },
  ],
})
export class EditEntityComponent<
  T extends string[] | string = string[],
  E extends Entity = Entity,
>
  extends CustomFormControlDirective<T>
  implements OnInit, EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;

  @ViewChild(BasicAutocompleteComponent)
  autocompleteComponent: BasicAutocompleteComponent<E, T>;

  private readonly entityMapperService = inject(EntityMapperService);
  private readonly formDialog = inject(FormDialogService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly ability = inject(EntityAbility);

  readonly loadingPlaceholder = $localize`:A placeholder for the input element when select options are not loaded yet:loading...`;

  /**
   * Whether users can select multiple entities.
   */
  @Input() multi: boolean = false;

  /**
   * Disable the option to type any text into the selection field and use a "Create new ..." link to open the form for a new entity.
   */
  @Input() disableCreateNew: boolean;

  /**
   * The placeholder is what is seen when someone clicks into the input
   * field and adds new entities.
   */
  @Input() override placeholder: string;

  /**
   * Whether to show entities in the list.
   */
  @Input() showEntities = true;

  /**
   * The accessor used for filtering and when selecting a new entity.
   */
  @Input() accessor: (e: Entity) => string = (e) =>
    e instanceof Entity ? e.toString() : "?";
  entityToId = (option: E) => option.getId();

  additionalFilter: InputSignal<(e: E) => boolean> = input((_) => true);

  formControl: Signal<FormControl<T>> = computed(() => {
    let control = this.ngControl?.control as FormControl<T>;
    if (!control) {
      control = this._formControl ?? new FormControl();
    }

    this._formControl = control;
    return this._formControl;
  });
  private _formControl: FormControl<T>;

  /**
   * Explicitly define the entity type(s) to select among.
   * Overrides the `additional` configuration of the FormFieldConfig if given.
   */
  entityTypeInput: Signal<string | string[]> = input(undefined, {
    // eslint-disable-next-line @angular-eslint/no-input-rename
    alias: "entityType",
  });
  entityType: Signal<string[]> = computed(() => {
    let value = this.entityTypeInput();
    if (!value || value.length === 0) {
      value = this.formFieldConfig?.additional;
    }

    return asArray(value ?? []);
  });

  private readonly allEntities: Resource<E[]> = resourceWithRetention({
    defaultValue: [],
    params: () => ({
      entityTypes: this.entityType(),
      additionalFilter: this.additionalFilter(),
      loadType: (type: string) => this.entityMapperService.loadType<E>(type), // we cannot directly access `this.` within the loader (see https://github.com/Aam-Digital/ndb-core/pull/3410#issuecomment-3438380605)
    }),
    loader: async ({ params }) => {
      if (params.entityTypes.length === 0) return [];

      const entities: E[] = [];
      for (const type of params.entityTypes) {
        entities.push(...(await params.loadType(type)));
      }

      return entities
        .filter((e) => params.additionalFilter(e))
        .sort((a, b) => a.toString().localeCompare(b.toString()));
    },
  });

  currentlyMatchingInactive: Signal<number> = computed(() => {
    return this.allEntities
      .value()
      .filter((e) => !e.isActive && this.autocompleteFilter()(e)).length;
  });

  readonly isCreateDisabled = computed(() => {
    if (this.disableCreateNew === true) {
      return true;
    }
    const entityTypes = this.entityType();
    if (entityTypes.length === 0) {
      return true;
    }
    const entityType = entityTypes[0];
    return !this.ability.can("create", entityType);
  });

  createNewEntityOption: Signal<(input: string) => Promise<E>> = computed(
    () => {
      if (this.isCreateDisabled()) {
        return null;
      }

      return (input) => this.createNewEntity(input);
    },
  );

  loading: Signal<boolean> = computed(() => this.allEntities.isLoading());

  /**
   * The currently selected values (IDs) of the form control.
   */
  values: Signal<string[]> = toSignal(
    toObservable(this.formControl)
      .pipe(
        switchMap((form) => {
          // Emit both the initial value and subsequent value changes
          return form.valueChanges.pipe(startWith(form.value));
        }),
      )
      .pipe(map((value) => (value === undefined ? [] : asArray(value)))),
    { initialValue: [] },
  );

  includeInactive = signal<boolean>(false);

  readonly availableEntitiesResource: Resource<E[]> = resourceWithRetention({
    defaultValue: [],
    params: () => ({
      allEntities: this.allEntities.value(),
      values: this.values(),
      includeInactive: this.includeInactive(),
      getEntity: (id: string) => this.getEntity(id), // we cannot directly access `this.` within the loader (see https://github.com/Aam-Digital/ndb-core/pull/3410#issuecomment-3438380605)
    }),
    loader: async ({ params }) => {
      const availableEntities = params.allEntities.filter(
        (e) =>
          params.values.includes(e.getId()) ||
          params.includeInactive ||
          e.isActive,
      );

      for (const id of params.values) {
        if (id === null || id === undefined || id === "") {
          continue;
        }

        if (availableEntities.find((e) => id === e.getId())) {
          continue;
        }

        const additionalEntity = await params.getEntity(id);
        if (additionalEntity) {
          availableEntities.push(additionalEntity);
        } else {
          availableEntities.push({
            getId: () => id,
            isHidden: true,
          } as unknown as E);
        }
      }

      return availableEntities;
    },
  });

  readonly hasInaccessible: Signal<boolean> = computed(() => {
    const entities = this.availableEntitiesResource.value();
    const currentValues = this.values();
    return currentValues.some((id) => {
      if (!id) return false;
      const entity = entities.find((e) => e.getId() === id);
      return entity && (entity as any).isHidden === true;
    });
  });

  private async getEntity(selectedId: string): Promise<E | undefined> {
    const type = Entity.extractTypeFromId(selectedId);

    const entity = await this.entityMapperService
      .load<E>(type, selectedId)
      .catch((err: Error) => {
        Logging.warn(
          "[ENTITY_SELECT] Error loading selected entity.",
          this.formFieldConfig?.label,
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

  recalculateMatchingInactive(newAutocompleteFilter?: (o: Entity) => boolean) {
    if (newAutocompleteFilter) {
      this.autocompleteFilter.set(newAutocompleteFilter);
    }
  }

  async createNewEntity(input: string): Promise<E> {
    const entityTypes = this.entityType();
    if (entityTypes.length < 1) {
      return;
    }
    if (entityTypes.length > 1) {
      Logging.warn(
        "EntitySelect with multiple types is always creating a new entity of the first listed type only.",
      );
    }

    const newEntity = new (this.entityRegistry.get(entityTypes[0]))();
    applyTextToCreatedEntity(newEntity, input);

    const dialogRef = this.formDialog.openFormPopup(newEntity);
    return lastValueFrom<E | undefined>(dialogRef.afterClosed());
  }

  ngOnInit() {
    this.multi = this.formFieldConfig?.isArray ?? false;
  }

  override onContainerClick(event: MouseEvent) {
    this.autocompleteComponent?.onContainerClick(event);
  }
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

    const currentValue = entity[targetProperty] ?? "";
    entity[targetProperty] =
      currentValue === ""
        ? inputParts[i]
        : (currentValue + " " + inputParts[i]).trim();
  }

  return entity;
}
