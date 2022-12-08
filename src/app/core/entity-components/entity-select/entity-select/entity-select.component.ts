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
import { Entity } from "../../../entity/model/entity";
import { BehaviorSubject } from "rxjs";
import { FormControl } from "@angular/forms";
import { filter, map } from "rxjs/operators";
import { MatChipInputEvent } from "@angular/material/chips";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntityMapperService } from "../../../entity/entity-mapper.service";

@Component({
  selector: "app-entity-select",
  templateUrl: "./entity-select.component.html",
  styleUrls: ["./entity-select.component.scss"],
})
@UntilDestroy()
export class EntitySelectComponent<E extends Entity> implements OnChanges {
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly loadingPlaceholder = $localize`:A placeholder for the input element when select options are not loaded yet:loading...`;

  /**
   * Handle and emit ids including entity type prefix - default is false.
   * If multiple `entityType`s are given, this automatically switches prefixes to be activated.
   *
   * TODO: make ids including prefix the default everywhere and remove this option (see #1526)
   */
  @Input() withPrefix: boolean = false;

  /**
   * The entity-type (e.g. 'Child', 'School', e.t.c.) to set.
   * @param type The ENTITY_TYPE of a Entity. This affects the entities which will be loaded and the component
   *             that displays the entities. Can be an array giving multiple types.
   * @throws Error when `type` is not in the entity-map
   */
  @Input() set entityType(type: string | string[]) {
    if (Array.isArray(type)) {
      this.withPrefix = true;
    } else {
      type = [type];
    }
    this.loadAvailableEntities(type);
  }

  /**
   * The (initial) selection. Can be used in combination with {@link selectionChange}
   * to enable two-way binding to an array of strings corresponding to the id's of the entities.
   * @param sel The initial selection
   */
  @Input() set selection(sel: string[]) {
    if (!Array.isArray(sel)) {
      this.selectedEntities = [];
      return;
    }
    this.loading
      .pipe(
        untilDestroyed(this),
        filter((isLoading) => !isLoading)
      )
      .subscribe((_) => {
        this.selectedEntities = this.allEntities.filter((e) =>
          sel.find((s) => s === e.getId(true) || s === e.getId())
        );
      });
  }

  /** Underlying data-array */
  selectedEntities: E[] = [];
  /**
   * called whenever the selection changes.
   * This happens when a new entity is being added or an existing
   * one is removed
   */
  @Output() selectionChange = new EventEmitter<string[]>();
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
   * Whether or not single chips (entity-views) are selectable.
   * This currently has no specific meaning and defaults to <code>false</code>
   */
  @Input() selectable = false;
  /**
   * Whether or not single chips (entity-views) are removable.
   * If this is the case, they can be deleted.
   */
  @Input() removable = true;

  /**
   * Whether or not to show entities in the list.
   * Entities can still be selected using the autocomplete,
   * and {@link selection} as well as {@link selectionChange} will
   * still work as expected
   */
  @Input() showEntities: boolean = true;

  /**
   * Setting the disabled state of the input element
   * @param disabled whether the input element should be disabled
   */
  @Input() set disabled(disabled: boolean) {
    if (disabled) {
      this.formControl.disable();
    } else {
      this.formControl.enable();
    }
  }

  /**
   * true when this is loading and false when it's ready.
   * This subject's state reflects the actual loading resp. the 'readiness'-
   * state of this component. Will trigger once loading is done
   */
  loading = new BehaviorSubject(true);

  inputPlaceholder = this.loadingPlaceholder;

  allEntities: E[] = [];
  filteredEntities: E[] = [];
  formControl = new FormControl("");

  @ViewChild("inputField") inputField: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  constructor(private entityMapperService: EntityMapperService) {
    this.formControl.valueChanges
      .pipe(
        untilDestroyed(this),
        filter((value) => value === null || typeof value === "string"), // sometimes produces entities
        map((searchText?: string) => this.filter(searchText))
      )
      .subscribe((value) => {
        this.filteredEntities = value;
      });
    this.loading.pipe(untilDestroyed(this)).subscribe((isLoading) => {
      this.inputPlaceholder = isLoading
        ? this.loadingPlaceholder
        : this.placeholder;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("additionalFilter")) {
      // update whenever additional filters are being set
      this.formControl.setValue(this.formControl.value);
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

  private async loadAvailableEntities(types: string[]) {
    this.loading.next(true);
    const entities: E[] = [];

    for (const type of types) {
      entities.push(...(await this.entityMapperService.loadType<E>(type)));
    }

    this.allEntities = entities;
    this.loading.next(false);
    this.formControl.setValue(null);
  }

  /**
   * selects a given entity and emits values
   * @param entity the entity to select
   */
  selectEntity(entity: E) {
    this.selectedEntities.push(entity);
    this.emitChange();
    this.inputField.nativeElement.value = "";
    this.formControl.setValue(null);
    setTimeout(() => this.autocomplete.openPanel());
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
      const entity = this.allEntities.find(
        (e) => this.accessor(e) === value.trim()
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
  private filter(value?: string): E[] {
    let filteredEntities: E[] = this.allEntities.filter(
      (e) => this.additionalFilter(e) && !this.isSelected(e)
    );
    if (value) {
      const filterValue = value.toLowerCase();
      filteredEntities = filteredEntities.filter((entity) =>
        this.accessor(entity).toLowerCase().includes(filterValue)
      );
    }
    return filteredEntities;
  }

  /**
   * removes a given entity from the records (if it exists) and emits changes
   * @param entity The entity to remove
   */
  unselectEntity(entity: E) {
    const index = this.selectedEntities.findIndex(
      (e) => e.getId(true) === entity.getId(true)
    );
    if (index !== -1) {
      this.selectedEntities.splice(index, 1);
      this.emitChange();
      // Update the form control to re-run the filter function
      this.formControl.updateValueAndValidity();
    }
  }

  private emitChange() {
    this.selectionChange.emit(
      this.selectedEntities.map((e) => e.getId(this.withPrefix))
    );
  }

  private isSelected(entity: E): boolean {
    return this.selectedEntities.some(
      (e) => e.getId(true) === entity.getId(true)
    );
  }
}
