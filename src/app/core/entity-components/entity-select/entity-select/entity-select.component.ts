import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  TemplateRef,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { ENTER, COMMA } from "@angular/cdk/keycodes";
import { Entity, EntityConstructor } from "../../../entity/entity";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { BehaviorSubject, Observable } from "rxjs";
import { FormControl } from "@angular/forms";
import { filter, map, skipWhile } from "rxjs/operators";
import { MatChipInputEvent } from "@angular/material/chips";
import { LoggingService } from "../../../logging/logging.service";

export type accessorFn<E extends Entity> = (E) => string;

@Component({
  selector: "app-entity-select",
  templateUrl: "./entity-select.component.html",
  styleUrls: ["./entity-select.component.scss"],
})
export class EntitySelectComponent<E extends Entity> implements OnChanges {
  /**
   * The type of entity to load. This is required and will cause all
   * entities of the given type to be available in the selection
   * and auto-complete
   * @param type The type of the entity
   */
  @Input() set entityType(type: EntityConstructor<E>) {
    this.loading.next(true);
    this.entityMapperService
      .loadType<E>(type)
      .then((entities) => {
        this.allEntities = entities;
        this.loading.next(false);
        this.formControl.setValue(null);
      })
      .catch((error) => {
        this.loggingService.warn(error);
        this.loading.next(false);
      });
  }
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
      this.loading.pipe(skipWhile((isLoading) => isLoading)).subscribe((_) => {
        this._selection = this.allEntities.filter((e) =>
          sel.find((s) => s === e.getId())
        );
      });
    } else {
      this._selection = sel as E[];
    }
  }
  /** Underlying data-array */
  _selection: E[] = [];
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
   * The view used to render single entity-items. When used in a template,
   * this view is given an entity as context. A template (that can be passed
   * to this view) could look like this:
   * <br>
   * <pre>
   *   <ng-template
   *      #myTemplate
   *      let-entity="entity">
   *      {{entity.name}}
   *   </ng-template>
   * </pre>
   * this would then be passed via <code>[entityView]="myTemplate"</code>
   * and would cause all entities that are to be displayed to simply display their names
   */
  @Input() entityView: TemplateRef<any>;
  /**
   * The view used to render autocomplete-options.
   * This has the same behavior as {@link entityView}.
   * <br>If nothing is set, this will default to the entity-view
   */
  @Input() autocompleteView: TemplateRef<any>;
  /**
   * true when this is loading and false when it's ready.
   * This subject's state reflects the actual loading resp. the 'readiness'-
   * state of this component. Will trigger once loading is done
   */
  loading = new BehaviorSubject(true);
  @Input() disabled: boolean = false;

  allEntities: E[] = [];

  filteredEntities: Observable<E[]>;
  @ViewChild("inputField") inputField: ElementRef<HTMLInputElement>;

  formControl = new FormControl();

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    private entityMapperService: EntityMapperService,
    private loggingService: LoggingService
  ) {
    this.filteredEntities = this.formControl.valueChanges.pipe(
      filter((value) => value === null || typeof value === "string"), // sometimes produces entities
      map((searchText?: string) =>
        searchText ? this._filter(searchText) : this.allEntities
      ),
      map((entities: E[]) =>
        entities.filter(
          (e: E) => !this.isSelected(e) && this.additionalFilter(e)
        )
      )
    );
  }
  /**
   * The accessor used for filtering and when selecting a new
   * entity.
   * <br> Per default, this filters for the name. If the entity
   * has no name, this filters for the entity's id.
   */
  @Input() accessor: accessorFn<E> = (e) => e["name"] || e.getId();

  @Input() additionalFilter: (T) => boolean = (_) => true;
  /**
   * selects a given entity and emits values
   * @param entity the entity to select
   */
  selectEntity(entity: E) {
    this._selection.push(entity);
    this._emitChange();
    this.inputField.nativeElement.value = "";
    this.formControl.setValue(null);
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

  private _filter(value: string): E[] {
    const filterValue = value.toLowerCase();
    return this.allEntities.filter((entity) =>
      this.accessor(entity).toLowerCase().startsWith(filterValue)
    );
  }

  /**
   * removes a given entity from the records (if it exists) and emits changes
   * @param entity The entity to remove
   */
  unselectEntity(entity: E) {
    const index = this._selection.findIndex(
      (e) => e.getId() === entity.getId()
    );
    if (index !== -1) {
      this._selection.splice(index, 1);
      this._emitChange();
      this.inputField.nativeElement.value = ""; // TODO: keep?
      this.formControl.setValue(null);
    }
  }

  private _emitChange() {
    if (this.selectionInputType === "id") {
      this.selectionChange.emit(this._selection.map((e) => e.getId()));
    } else {
      this.selectionChange.emit(this._selection);
    }
  }

  private isSelected(entity: E): boolean {
    return this._selection.some((e) => e.getId() === entity.getId());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("additionalFilter")) {
      // update whenever additional filters are being set
      this.formControl.setValue(this.formControl.value);
    }
    if (
      changes.hasOwnProperty("entityView") &&
      this.autocompleteView === undefined
    ) {
      this.autocompleteView = this.entityView;
    }
  }
}
