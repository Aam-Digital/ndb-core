import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { Entity } from "../../entity/model/entity";
import { BehaviorSubject } from "rxjs";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { filter, map } from "rxjs/operators";
import { MatChipInputEvent, MatChipsModule } from "@angular/material/chips";
import {
  MatAutocompleteModule,
  MatAutocompleteTrigger,
} from "@angular/material/autocomplete";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { AsyncPipe, NgForOf, NgIf } from "@angular/common";
import { DisplayEntityComponent } from "../../basic-datatypes/entity/display-entity/display-entity.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { LoggingService } from "../../logging/logging.service";
import { ErrorHintComponent } from "../error-hint/error-hint.component";

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
    DisplayEntityComponent,
    FontAwesomeModule,
    MatTooltipModule,
    MatInputModule,
    MatCheckboxModule,
    AsyncPipe,
    ErrorHintComponent,
  ],
  standalone: true,
})
@UntilDestroy()
export class EntitySelectComponent<
  E extends Entity,
  T extends string[] | string = string[],
> implements OnChanges
{
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly loadingPlaceholder = $localize`:A placeholder for the input element when select options are not loaded yet:loading...`;

  includeInactive: boolean = false;
  filterValue: string;

  /**
   * The entity-type (e.g. 'Child', 'School', e.t.c.) to set.
   * @param type The ENTITY_TYPE of a Entity. This affects the entities which will be loaded and the component
   *             that displays the entities. Can be an array giving multiple types.
   * @throws Error when `type` is not in the entity-map
   */
  @Input() set entityType(type: string | string[]) {
    this._entityType = Array.isArray(type) ? type : [type];
    this.loadAvailableEntities();
  }

  private _entityType: string[];

  /**
   * Whether users can select multiple entities.
   */
  @Input() multi: boolean = true;

  /**
   * The (initial) selection. Can be used in combination with {@link selectionChange}
   * to enable two-way binding to an array of strings corresponding to the id's of the entities.
   * @param sel The initial selection (single id string for multi=false, array of id strings for multi=true)
   */
  @Input() set selection(sel: T) {
    const selArray: string[] = (Array.isArray(sel) ? sel : [sel]).filter(
      (i) => !!i,
    );

    this.loading
      .pipe(
        untilDestroyed(this),
        filter((isLoading) => !isLoading),
      )
      .subscribe(() => this.initSelectedEntities(selArray));
  }

  private async initSelectedEntities(selected: string[]) {
    const entities: E[] = [];
    for (const s of selected) {
      await this.getEntity(s)
        .then((entity) => entities.push(entity))
        .catch((err: Error) =>
          this.logger.warn(
            `[ENTITY_SELECT] Error loading selected entity "${s}": ${err.message}`,
          ),
        );
    }
    this.selectedEntities = entities;
    // updating autocomplete values
    this.autocompleteForm.setValue(this.autocompleteForm.value);
  }

  private async getEntity(id: string) {
    const type = Entity.extractTypeFromId(id);
    const entity = this._entityType.includes(type)
      ? this.allEntities.find((e) => id === e.getId())
      : await this.entityMapperService.load<E>(type, id);

    if (!entity) {
      throw Error(`Entity not found`);
    }
    return entity;
  }

  /** Underlying data-array */
  selectedEntities: E[] = [];

  /**
   * called whenever the selection changes.
   * This happens when a new entity is being added or a selected one is removed.
   *
   * Emits a single id string for multi=false, array of id strings for multi=true
   */
  @Output() selectionChange = new EventEmitter<T>();

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
   * Whether single chips (entity-views) are selectable.
   * This currently has no specific meaning and defaults to <code>false</code>
   */
  @Input() selectable = false;

  /**
   * Whether single chips (entity-views) are removable.
   * If this is the case, they can be deleted.
   */
  @Input() removable = true;

  /**
   * Whether to show entities in the list.
   * Entities can still be selected using the autocomplete,
   * and {@link selection} as well as {@link selectionChange} will
   * still work as expected
   */
  @Input() showEntities = true;

  /**
   * Setting the disabled state of the input element
   * @param disabled whether the input element should be disabled
   */
  @Input() set disabled(disabled: boolean) {
    if (disabled) {
      this.autocompleteForm.disable();
    } else {
      this.autocompleteForm.enable();
    }
  }

  /**
   * true when this is loading and false when it's ready.
   * This subject's state reflects the actual loading resp. the 'readiness'-
   * state of this component. Will trigger once loading is done
   */
  loading = new BehaviorSubject(true);

  allEntities: E[] = [];
  entitiesPassingAdditionalFilter: E[] = [];
  filteredEntities: E[] = [];
  inactiveFilteredEntities: E[] = [];

  autocompleteForm = new FormControl("");

  @ViewChild("inputField") inputField: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  constructor(
    private entityMapperService: EntityMapperService,
    private logger: LoggingService,
  ) {
    this.autocompleteForm.valueChanges
      .pipe(
        untilDestroyed(this),
        filter((value) => value === null || typeof value === "string"), // sometimes produces entities
        map((searchText?: string) => this.filter(searchText)),
      )
      .subscribe((value) => (this.filteredEntities = value));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("additionalFilter")) {
      // update whenever additional filters are being set
      this.autocompleteForm.setValue(this.autocompleteForm.value);
      this.entitiesPassingAdditionalFilter = this.allEntities.filter((e) =>
        this.additionalFilter(e),
      );
    }
  }

  /**
   * The accessor used for filtering and when selecting a new
   * entity.
   * <br> Per default, this filters for the name. If the entity
   * has no name, this filters for the entity's id.
   */
  @Input() accessor: (e: Entity) => string = (e) => e.toString();

  @Input() additionalFilter: (e: E) => boolean = (_) => true;

  private async loadAvailableEntities() {
    this.loading.next(true);
    const entities: E[] = [];

    for (const type of this._entityType) {
      entities.push(...(await this.entityMapperService.loadType<E>(type)));
    }
    this.allEntities = entities;
    this.allEntities.sort((a, b) => a.toString().localeCompare(b.toString()));
    this.entitiesPassingAdditionalFilter = this.allEntities.filter((e) =>
      this.additionalFilter(e),
    );
    this.loading.next(false);
    this.autocompleteForm.setValue(null);
  }

  /**
   * selects a given entity and emits values
   * @param entity the entity to select
   */
  selectEntity(entity: E) {
    if (!entity) {
      return;
    }

    if (this.multi) {
      this.selectedEntities.push(entity);
      setTimeout(() => this.autocomplete.openPanel());
    } else {
      this.selectedEntities = [entity];
      this.autocomplete.closePanel();
    }

    this.emitChange();
    this.inputField.nativeElement.value = "";
    this.autocompleteForm.setValue(null);
  }

  /**
   * called when a key code from {@link separatorKeysCodes}
   * is recorded and the user has entered a new entity-name (resp.
   * whatever the accessor defines)
   * @param event the event to call this with
   */
  select(event: Pick<MatChipInputEvent, "value">) {
    const value = event.value;

    if (value) {
      const entity = this.entitiesPassingAdditionalFilter.find(
        (e) => this.accessor(e) === value.trim(),
      );
      if (entity) {
        this.selectEntity(entity);
      }
    }
  }

  /**
   * filters a subset of all entities with a given search-text.
   * Entities that do not match the {@link additionalFilter}-predicate
   * or are already included won't be in this subset.
   * If the search-text is <code>null</code> or <code>undefined</code>,
   * this will return all entities (with the aforementioned additional filters).
   * @param value The value to look for in all entities
   */
  private filter(value: string): E[] {
    let filteredEntities: E[] = this.entitiesPassingAdditionalFilter.filter(
      (e) => !this.isSelected(e) && (this.includeInactive ? true : e.isActive),
    );
    let inactiveFilteredEntities: E[] =
      this.entitiesPassingAdditionalFilter.filter(
        (e) => !this.isSelected(e) && !e.isActive,
      );
    this.filterValue = value;

    if (value) {
      const filterValue = value.toLowerCase();
      filteredEntities = filteredEntities.filter((entity) =>
        this.accessor(entity).toLowerCase().includes(filterValue),
      );
      inactiveFilteredEntities = inactiveFilteredEntities.filter((entity) =>
        this.accessor(entity).toLowerCase().includes(filterValue),
      );
    }
    this.inactiveFilteredEntities = inactiveFilteredEntities;
    return filteredEntities;
  }

  toggleIncludeInactive() {
    this.includeInactive = !this.includeInactive;
    this.filteredEntities = this.filter(this.filterValue);
  }

  /**
   * removes a given entity from the records (if it exists) and emits changes
   * @param entity The entity to remove
   */
  unselectEntity(entity: E) {
    const index = this.selectedEntities.findIndex(
      (e) => e.getId() === entity.getId(),
    );
    if (index !== -1) {
      this.selectedEntities.splice(index, 1);
      this.emitChange();
      // Update the form control to re-run the filter function
      this.autocompleteForm.updateValueAndValidity();
    }
  }

  private emitChange() {
    const newSelection = this.selectedEntities.map((e) => e.getId());

    if (isMulti(this)) {
      this.selectionChange.emit(newSelection);
    } else {
      this.selectionChange.emit(newSelection[0] as T);
    }
  }

  private isSelected(entity: E): boolean {
    return this.selectedEntities.some((e) => e.getId() === entity.getId());
  }
}

function isMulti(
  cmp: EntitySelectComponent<any, string | string[]>,
): cmp is EntitySelectComponent<any, string[]> {
  return cmp.multi;
}
