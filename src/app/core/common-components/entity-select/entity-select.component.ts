import { Component, Input } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { BehaviorSubject, lastValueFrom } from "rxjs";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatChipsModule } from "@angular/material/chips";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { AsyncPipe, NgForOf, NgIf } from "@angular/common";
import { EntityBlockComponent } from "../../basic-datatypes/entity/entity-block/entity-block.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ErrorHintComponent } from "../error-hint/error-hint.component";
import { BasicAutocompleteComponent } from "../basic-autocomplete/basic-autocomplete.component";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { asArray } from "../../../utils/utils";
import { LoggingService } from "../../logging/logging.service";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { EntityRegistry } from "../../entity/database-entity.decorator";

@Component({
  selector: "app-entity-select",
  templateUrl: "./entity-select.component.html",
  styleUrls: ["./entity-select.component.scss"],
  imports: [
    MatFormFieldModule,
    NgIf,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatChipsModule,
    NgForOf,
    EntityBlockComponent,
    FontAwesomeModule,
    MatTooltipModule,
    MatInputModule,
    MatCheckboxModule,
    AsyncPipe,
    ErrorHintComponent,
    BasicAutocompleteComponent,
    MatSlideToggle,
    FormsModule,
  ],
  standalone: true,
})
@UntilDestroy()
export class EntitySelectComponent<
  E extends Entity,
  T extends string[] | string = string[],
> {
  readonly loadingPlaceholder = $localize`:A placeholder for the input element when select options are not loaded yet:loading...`;

  @Input() form: FormControl<T>;

  /**
   * The entity-type (e.g. 'Child', 'School', e.t.c.) to set.
   * @param type The ENTITY_TYPE of a Entity. This affects the entities which will be loaded and the component
   *             that displays the entities. Can be an array giving multiple types.
   * @throws Error when `type` is not in the entity-map
   */
  @Input() set entityType(type: string | string[]) {
    if (type === undefined || type === null) {
      type = [];
    }

    this._entityType = Array.isArray(type) ? type : [type];
    this.loadAvailableEntities();
  }

  private _entityType: string[];

  /**
   * Whether users can select multiple entities.
   */
  @Input() multi: boolean = true;

  /**
   * The label is what is seen above the list. For example when used
   * in the note-details-view, this is "Children"
   */
  @Input() label: string;

  /**
   * The placeholder is what is seen when someone clicks into the input-
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

  /**
   * true when this is loading and false when it's ready.
   * This subject's state reflects the actual loading resp. the 'readiness'-
   * state of this component. Will trigger once loading is done
   */
  loading = new BehaviorSubject(true);
  allEntities: E[] = [];
  availableOptions = new BehaviorSubject<E[]>([]);

  @Input() includeInactive: boolean = false;
  currentlyMatchingInactive: number = 0;

  constructor(
    private entityMapperService: EntityMapperService,
    private logger: LoggingService,
    private formDialog: FormDialogService,
    private entityRegistry: EntityRegistry,
  ) {}

  /**
   * The accessor used for filtering and when selecting a new
   * entity.
   * <br> Per default, this filters for the name. If the entity
   * has no name, this filters for the entity's id.
   */
  @Input() accessor: (e: Entity) => string = (e) => e.toString();
  entityToId = (option: E) => option.getId();

  @Input() additionalFilter: (e: E) => boolean = (_) => true;

  private async loadAvailableEntities() {
    this.loading.next(true);

    this.allEntities = [];
    for (const type of this._entityType) {
      this.allEntities.push(
        ...(await this.entityMapperService.loadType<E>(type)),
      );
    }
    this.allEntities.sort((a, b) => a.toString().localeCompare(b.toString()));

    await this.updateAvailableOptions();

    this.loading.next(false);
  }

  private async updateAvailableOptions() {
    const includeInactive = (entity: E) =>
      this.includeInactive || entity.isActive;
    const includeSelected = (entity: E) =>
      asArray(this.form.value).includes(entity.getId());

    const newAvailableEntities = this.allEntities.filter(
      (e) => includeInactive(e) || includeSelected(e),
    );

    await this.alignAvailableAndSelectedEntities(newAvailableEntities);

    this.availableOptions.next(newAvailableEntities);
    this.recalculateMatchingInactive();
  }

  /**
   * Edit form value (currently selected) and the given available Entities to be consistent:
   * Entities that do not exist should be removed from the form value
   * and availableEntities should contain all selected entities, even from other types.
   * @private
   */
  private async alignAvailableAndSelectedEntities(availableEntities: E[]) {
    if (this.form.value === null || this.form.value === undefined) {
      return;
    }

    let updatedValue: T = this.form.value;

    for (const id of asArray(this.form.value)) {
      if (availableEntities.find((e) => id === e.getId())) {
        // already available, nothing to do
        continue;
      }

      const additionalEntity = await this.getEntity(id);
      if (additionalEntity) {
        availableEntities.push(additionalEntity);
      } else {
        updatedValue = isMulti(this)
          ? ((updatedValue as string[]).filter((v) => v !== id) as T)
          : undefined;
      }
    }

    if (this.form.value !== updatedValue) {
      this.form.setValue(updatedValue);
    }
  }

  private async getEntity(selectedId: string): Promise<E | undefined> {
    const type = Entity.extractTypeFromId(selectedId);

    const entity = await this.entityMapperService
      .load<E>(type, selectedId)
      .catch((err: Error) => {
        this.logger.warn(
          "[ENTITY_SELECT] Error loading selected entity.",
          selectedId,
          err.message,
        );
        return undefined;
      });

    return entity;
  }

  async toggleIncludeInactive() {
    this.includeInactive = !this.includeInactive;
    await this.updateAvailableOptions();
  }

  private autocompleteFilter: (o: E) => boolean = () => true;

  /**
   * Recalculates the number of inactive entities that match the current filter,
   * and optionally updates the current filter function (otherwise reuses the filter previously set)
   * @param newAutocompleteFilter
   */
  recalculateMatchingInactive(newAutocompleteFilter?: (o: Entity) => boolean) {
    if (newAutocompleteFilter) {
      this.autocompleteFilter = newAutocompleteFilter;
    }

    this.currentlyMatchingInactive = this.allEntities.filter(
      (e) => !e.isActive && this.autocompleteFilter(e),
    ).length;
  }

  createNewEntity = async (input: string): Promise<E> => {
    if (this._entityType?.length < 1) {
      return;
    }
    if (this._entityType.length > 1) {
      this.logger.warn(
        "EntitySelect with multiple types is always creating a new entity of the first listed type only.",
      );
      // TODO: maybe display an additional popup asking the user to select which type should be created?
    }

    const newEntity = new (this.entityRegistry.get(this._entityType[0]))();
    applyTextToCreatedEntity(newEntity, input);

    const dialogRef = this.formDialog.openFormPopup(newEntity);
    return lastValueFrom<E | undefined>(dialogRef.afterClosed());
  };
}

function isMulti(
  cmp: EntitySelectComponent<any, string | string[]>,
): cmp is EntitySelectComponent<any, string[]> {
  return cmp.multi;
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
