import { resourceWithRetention } from "#src/app/utils/resourceWithRetention";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DoCheck,
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
import {
  BasicAutocompleteComponent,
  CreateOptionConfig,
} from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { currentRecordSignal } from "../../../common-components/entity-form/current-record-state";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import {
  EditComponent,
  getExistingValuesToHighlight,
} from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../../entity/model/entity";
import { DynamicPlaceholderValueService } from "../../../default-values/x-dynamic-placeholder/dynamic-placeholder-value.service";
import { FilterService } from "../../../filter/filter.service";
import { DataFilter } from "../../../filter/filters/filters";
import { FormDialogService } from "../../../form-dialog/form-dialog.service";
import { Logging } from "../../../logging/logging.service";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { EntityBlockComponent } from "../entity-block/entity-block.component";
import {
  matchesSelectionCondition,
  resolveSelectionCondition,
} from "../selection-condition";

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
  implements OnInit, DoCheck, EditComponent
{
  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  /** Whether to highlight the selected entities that the entity does not have yet */
  highlightAdded = input<boolean>(false);

  readonly existingValues = computed(() =>
    getExistingValuesToHighlight<string>(this),
  );

  @ViewChild(BasicAutocompleteComponent)
  autocompleteComponent: BasicAutocompleteComponent<E, T>;

  private readonly entityMapperService = inject(EntityMapperService);
  private readonly formDialog = inject(FormDialogService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly ability = inject(EntityAbility);
  private readonly placeholderService = inject(DynamicPlaceholderValueService);
  private readonly filterService = inject(FilterService);

  readonly loadingPlaceholder = $localize`:A placeholder for the input element when select options are not loaded yet:Loading...`;

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
  @Input() accessor: (e: Entity | string) => string = (e) => {
    if (e instanceof Entity) {
      return e.toString();
    }

    if (typeof e === "string") {
      return e;
    }

    return "?";
  };
  entityToId = (option: E) => option.getId();

  additionalFilter: InputSignal<(e: E) => boolean> = input((_) => true);

  /**
   * The form control bound to the inner autocomplete.
   * Recomputed when {@link ngControl} appears (it is not a signal and may be set after
   * first render) so we stop using the fallback control. Named `control` to avoid clashing
   * with the base `formControl` getter.
   */
  control: Signal<FormControl<T>> = computed(() => {
    this.controlSourceRefresh();
    let control = this.ngControl?.control as FormControl<T>;
    if (!control) {
      control = this._formControl ?? new FormControl();
    }

    this._formControl = control;
    return this._formControl;
  });
  private _formControl: FormControl<T>;

  /**
   * Manual recompute trigger for `formControl`.
   * Needed because `ngControl` is not a signal and may appear after first render.
   */
  private readonly controlSourceRefresh = signal(0);

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
      value = this.formFieldConfig()?.additional;
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

  /**
   * The record being edited, with the current, possibly unsaved values of its form,
   * to resolve placeholders in the `selectionCondition` referring to that record
   * and to not offer the record itself in a link to its own type.
   * Only followed while the field has such a condition or links to the record's own type.
   */
  private readonly currentRecord = currentRecordSignal(
    () =>
      !!this.formFieldConfig()?.validators?.selectionCondition ||
      this.entityType().includes(this.entity()?.getType()),
  );

  /** the id of the record being edited, `undefined` if the form does not edit one single record (like in bulk edit) */
  private readonly ownId = computed(() => this.currentRecord()?.getId());

  /**
   * The records that can be offered: all except the record being edited,
   * which is not offered as a link to itself (if it already links to itself, that link is still shown).
   */
  private readonly offerableEntities: Signal<E[]> = computed(() => {
    const ownId = this.ownId();
    const entities = this.allEntities.value();
    return ownId ? entities.filter((e) => e.getId() !== ownId) : entities;
  });

  /**
   * The configured `selectionCondition` with placeholders resolved,
   * or `undefined` if no condition applies.
   */
  private readonly selectionFilter: Signal<DataFilter<E> | undefined> =
    computed(
      () =>
        resolveSelectionCondition(
          this.formFieldConfig()?.validators?.selectionCondition,
          this.entityType(),
          this.currentRecord(),
          this.placeholderService,
        ),
      // only notify of an actual change, not of every change of other fields in the form
      { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
    );

  private readonly isEligible: Signal<(e: E) => boolean> = computed(() =>
    matchesSelectionCondition(this.selectionFilter(), this.filterService),
  );

  /**
   * Number of inactive records that would additionally be shown when including inactive records.
   */
  currentlyMatchingInactive: Signal<number> = computed(() => {
    const isEligible = this.isEligible();
    const selected = this.values();
    return this.offerableEntities().filter(
      (e) =>
        e.inactive &&
        !selected.includes(e.getId()) &&
        (this.includeIneligible() || isEligible(e)) &&
        this.autocompleteFilter()(e),
    ).length;
  });

  /**
   * Number of records not matching the `selectionCondition`
   * that would additionally be shown when including those.
   */
  currentlyMatchingIneligible: Signal<number> = computed(() => {
    const isEligible = this.isEligible();
    const selected = this.values();
    return this.offerableEntities().filter(
      (e) =>
        !isEligible(e) &&
        !selected.includes(e.getId()) &&
        (this.includeInactive() || !e.inactive) &&
        this.autocompleteFilter()(e),
    ).length;
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

  /**
   * One create option per configured entity type, shown as separate
   * "Add new [TypeLabel]" entries in the autocomplete dropdown.
   */
  createNewEntityOptions: Signal<CreateOptionConfig<E>[]> = computed(() => {
    if (this.isCreateDisabled()) {
      return [];
    }

    return this.entityType().map((type) => ({
      label: this.entityRegistry.get(type)?.label ?? type,
      create: (input: string) => this.createNewEntity(input, type),
    }));
  });

  loading: Signal<boolean> = computed(() => this.allEntities.isLoading());

  /**
   * The currently selected values (IDs) of the form control.
   */
  values: Signal<string[]> = toSignal(
    toObservable(this.control)
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
  includeIneligible = signal<boolean>(false);

  readonly availableEntitiesResource: Resource<E[]> = resourceWithRetention({
    defaultValue: [],
    params: () => ({
      offerableEntities: this.offerableEntities(),
      values: this.values(),
      includeInactive: this.includeInactive(),
      includeIneligible: this.includeIneligible(),
      isEligible: this.isEligible(),
      getEntity: (id: string) => this.getEntity(id), // we cannot directly access `this.` within the loader (see https://github.com/Aam-Digital/ndb-core/pull/3410#issuecomment-3438380605)
    }),
    loader: async ({ params }) => {
      const availableEntities = params.offerableEntities.filter(
        (e) =>
          params.values.includes(e.getId()) ||
          ((params.includeInactive || !e.inactive) &&
            (params.includeIneligible || params.isEligible(e))),
      );

      for (const id of params.values) {
        if (id === null || id === undefined || id === "") {
          continue;
        }

        // a misconfigured default value can put a whole object into the form control,
        // which would blow up the id parsing below and break the whole view
        if (typeof id !== "string") {
          Logging.debug("[ENTITY_SELECT] Ignoring a non-id value.", { id });
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

    if (!this.entityRegistry.has(type)) {
      Logging.debug(
        "[ENTITY_SELECT] Selected value is not an id of a known entity type.",
        selectedId,
      );
      return undefined;
    }

    const entity = await this.entityMapperService
      .load<E>(type, selectedId)
      .catch((err: any) => {
        if (err?.status === 404) {
          Logging.debug(
            "[ENTITY_SELECT] Selected entity not found.",
            selectedId,
          );
        } else {
          Logging.warn(
            "[ENTITY_SELECT] Error loading selected entity.",
            err,
            selectedId,
          );
        }
        return undefined;
      });

    return entity;
  }

  toggleIncludeInactive() {
    this.includeInactive.set(!this.includeInactive());
  }

  toggleIncludeIneligible() {
    this.includeIneligible.set(!this.includeIneligible());
  }

  private autocompleteFilter = signal<(o: E) => boolean>(() => true);

  recalculateMatchingInactive(newAutocompleteFilter?: (o: Entity) => boolean) {
    if (newAutocompleteFilter) {
      this.autocompleteFilter.set(newAutocompleteFilter);
    }
  }

  async createNewEntity(input: string, type?: string): Promise<E> {
    const entityTypes = this.entityType();
    const targetType = type ?? entityTypes[0];
    if (!targetType) {
      return;
    }

    const newEntity = new (this.entityRegistry.get(targetType))();
    applyTextToCreatedEntity(newEntity, input);
    const selectionFilter = this.selectionFilter();
    if (selectionFilter) {
      this.filterService.alignEntityWithFilter(newEntity, selectionFilter);
    }

    const dialogRef = this.formDialog.openFormPopup(newEntity);
    return lastValueFrom<E | undefined>(dialogRef.afterClosed());
  }

  ngOnInit() {
    this.multi = this.formFieldConfig()?.isArray ?? false;
  }

  override ngDoCheck() {
    super.ngDoCheck();
    const control = this.ngControl?.control;
    if (!control || control === this._formControl) {
      return;
    }

    // Force `formControl` recomputation so we stop using the fallback control
    // and bind to the real parent form control.
    this.controlSourceRefresh.update((v) => v + 1);
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
