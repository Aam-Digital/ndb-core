import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from "@angular/core";
import { ENTER, COMMA } from "@angular/cdk/keycodes";
import { Entity, EntityConstructor } from "../../../entity/entity";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { FormControl } from "@angular/forms";
import { filter, map, skipWhile } from "rxjs/operators";
import { MatChipInputEvent } from "@angular/material/chips";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { ENTITY_MAP } from "../../entity-details/entity-details.component";
import { DYNAMIC_COMPONENTS_MAP } from "../../../view/dynamic-components-map";

export type accessorFn<E extends Entity> = (E) => string;

@Component({
  selector: "app-entity-select",
  templateUrl: "./entity-select.component.html",
  styleUrls: ["./entity-select.component.scss"],
})
export class EntitySelectComponent<E extends Entity>
  implements OnChanges, OnDestroy {
  /**
   * The standard-type (e.g. 'Child', 'School', e.t.c.) to set.
   * The standard-type has to be inside {@link ENTITY_MAP}
   * @param type The type of entities that this will set. This will set the
   * actual entity-type as well as the block-component
   * @throws Error when `type` is not in the entity-map
   */
  @Input() set standardType(type: string) {
    const entityType = ENTITY_MAP.get(type);
    if (!entityType) {
      throw new Error(`Entity-Type ${type} not in EntityMap`);
    }
    this.setEntityType(entityType);
    if (DYNAMIC_COMPONENTS_MAP.has(type + "Block")) {
      this.entityBlockComponent = type + "Block";
    } else {
      this.entityBlockComponent = undefined;
    }
  }
  entityBlockComponent?: string;
  private subscription?: Subscription;
  /**
   * The (initial) selection. Can be used in combination with {@link selectionChange}
   * to enable two-way binding to either an array of entities or an array of strings
   * corresponding to the id's of the entities.
   * The type (id's or entities) will be determined by the setting of the
   * {@link selectionInputType}
   * @param sel The initial selection
   */
  @Input() set selection(sel: (string | E)[]) {
    if (this.selectionInputType === "id") {
      this.subscription = this.loading
        .pipe(skipWhile((isLoading) => isLoading))
        .subscribe((_) => {
          this.selection_ = this.allEntities.filter((e) =>
            sel.find((s) => s === e.getId())
          );
        });
    } else {
      this.selection_ = sel as E[];
    }
  }
  /** Underlying data-array */
  selection_: E[] = [];
  /**
   * The type to publish and receive; either string-id's or entities
   * Defaults to string-id's
   */
  @Input() selectionInputType: "id" | "entity" = "id";
  /**
   * called whenever the selection changes.
   * This happens when a new entity is being added or an existing
   * one is removed
   */
  @Output() selectionChange = new EventEmitter<(string | E)[]>();
  /**
   * The label is what is seen above the list. For example when used
   * in the note-details-view, this is "Children"
   */
  @Input() label: string;
  /**
   * The placeholder is what is seen when someone clicks into the input-
   * field and adds new entities.
   * In the note-details-view, this is "Add children..."
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
   * true when this is loading and false when it's ready.
   * This subject's state reflects the actual loading resp. the 'readiness'-
   * state of this component. Will trigger once loading is done
   */
  loading = new BehaviorSubject(true);
  @Input() disabled: boolean = false;
  /**
   * Whether or not to show entities in the list.
   * Entities can still be selected using the autocomplete,
   * and {@link selection} as well as {@link selectionChange} will
   * still work as expected
   */
  @Input() showEntities: boolean = true;

  allEntities: E[] = [];

  filteredEntities: Observable<E[]>;
  @ViewChild("inputField") inputField: ElementRef<HTMLInputElement>;

  formControl = new FormControl();

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  constructor(private entityMapperService: EntityMapperService) {
    this.filteredEntities = this.formControl.valueChanges.pipe(
      filter((value) => value === null || typeof value === "string"), // sometimes produces entities
      map((searchText?: string) => this.filter(searchText))
    );
  }
  /**
   * The accessor used for filtering and when selecting a new
   * entity.
   * <br> Per default, this filters for the name. If the entity
   * has no name, this filters for the entity's id.
   */
  @Input() accessor: accessorFn<E> = (e) => e["name"] || e.getId();
  /**
   * The type of entity to load. This is required and will cause all
   * entities of the given type to be available in the selection
   * and auto-complete
   * @param type The type of the entity
   */
  setEntityType(type: EntityConstructor<E>) {
    this.loading.next(true);
    this.entityMapperService.loadType<E>(type).then((entities) => {
      this.allEntities = entities;
      this.loading.next(false);
      this.formControl.setValue(null);
    });
  }

  @Input() additionalFilter: (e: E) => boolean = (_) => true;
  /**
   * selects a given entity and emits values
   * @param entity the entity to select
   */
  selectEntity(entity: E) {
    this.selection_.push(entity);
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
  select(event: MatChipInputEvent) {
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
        this.accessor(entity).toLowerCase().startsWith(filterValue)
      );
    }
    return filteredEntities;
  }

  /**
   * removes a given entity from the records (if it exists) and emits changes
   * @param entity The entity to remove
   */
  unselectEntity(entity: E) {
    const index = this.selection_.findIndex(
      (e) => e.getId() === entity.getId()
    );
    if (index !== -1) {
      this.selection_.splice(index, 1);
      this.emitChange();
    }
  }

  private emitChange() {
    if (this.selectionInputType === "id") {
      this.selectionChange.emit(this.selection_.map((e) => e.getId()));
    } else {
      this.selectionChange.emit(this.selection_);
    }
  }

  private isSelected(entity: E): boolean {
    return this.selection_.some((e) => e.getId() === entity.getId());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("additionalFilter")) {
      // update whenever additional filters are being set
      this.formControl.setValue(this.formControl.value);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
