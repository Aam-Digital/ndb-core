import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  TemplateRef,
} from "@angular/core";
import { ENTER, COMMA } from "@angular/cdk/keycodes";
import { Entity, EntityConstructor } from "../../entity/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { BehaviorSubject } from "rxjs";
import { FormControl } from "@angular/forms";
import { filter, map, skipWhile } from "rxjs/operators";
import { MatChipInputEvent } from "@angular/material/chips";

export type accessorFn<T extends Entity> = (T) => string;

@Component({
  selector: "app-entity-select",
  templateUrl: "./entity-select.component.html",
  styleUrls: ["./entity-select.component.scss"],
})
export class EntitySelectComponent<T extends Entity> {
  private static isStringArray(sel: any): sel is string[] {
    return Array.isArray(sel) && sel.every((s) => typeof s === "string");
  }
  /**
   * The type of entity to load. This is required and will cause all
   * entities of the given type to be available in the selection
   * and auto-complete
   * @param type The type of the entity
   */
  @Input() set entityType(type: EntityConstructor<T>) {
    this.entityMapperService.loadType<T>(type).then((entities) => {
      this.allEntities = entities;
      this.loading.next(false);
      this.filteredEntities.next(entities.filter((e) => !this.isSelected(e)));
    });
  }

  /**
   * The (initial) selection. Can be used in combination with {@link selectionChange}
   * to enable two-way binding to either an array of entities or an array of strings
   * corresponding to the id's of the entities.
   * <br>
   * <b>Important:</b> If nothing is passed initially, then the type of this will be id's (in other
   * words, id's will be emitted whenever something changes).
   * If this behavior is not desired, the {@link type} has to be set to "entity" explicitly
   * These id's have to be legal id's for the given {@link entityType}
   * @param sel The initial selection
   */
  @Input() set selection(sel: (string | T)[]) {
    if (EntitySelectComponent.isStringArray(sel)) {
      this.type = "string";

      this.loading.pipe(skipWhile((isLoading) => isLoading)).subscribe((_) => {
        this._selection = this.allEntities.filter((e) =>
          sel.find((s) => s === e.getId())
        );
      });
    } else {
      this.type = "entity";
      this._selection = sel as T[];
    }
  }
  /** Underlying data-array */
  _selection: T[] = [];
  /** The type to publish; either string-id's or entities*/
  @Input() type: "string" | "entity" = "string";
  /**
   * called whenever the selection changes.
   * This happens when a new entity is being added or an existing
   * one is removed
   */
  @Output() selectionChange = new EventEmitter<(string | T)[]>();

  /**
   * The label is what is seen above the list, for example when used
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
   * to this view could look like this:
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
   * This has the same semantics as {@link entityView}
   */
  @Input() autocompleteView: TemplateRef<any>;

  /**
   * true when this is loading and false when it's ready.
   * This subject's state reflects the actual loading resp. 'readiness'-
   * state of this component. Will trigger once loading is done
   */
  loading = new BehaviorSubject(true);

  private allEntities: T[] = [];

  filteredEntities = new BehaviorSubject<T[]>([]);
  @ViewChild("inputField") inputField: ElementRef<HTMLInputElement>;

  formControl = new FormControl();

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(private entityMapperService: EntityMapperService) {
    this.formControl.valueChanges
      .pipe(
        filter((value) => typeof value === "string"),
        map((entity?: string) =>
          entity ? this._filter(entity) : this.allEntities
        ),
        map((entities) => entities.filter((e) => !this.isSelected(e)))
      )
      .subscribe((t) => {
        this.filteredEntities.next(t);
      });
  }

  /**
   * The accessor used for filtering and when selecting a new
   * entity.
   * <br> Per default, this filters for the name. If the entity
   * has no name, this filters for the entity's id.
   */

  @Input() accessor: accessorFn<T> = (e) => e["name"] || e.getId();

  /**
   * selects a given entity and emits values
   * @param entity the entity to select
   */

  selectEntity(entity: T) {
    this.inputField.nativeElement.value = "";
    this.formControl.setValue(null);
    this._selection.push(entity);
    if (this.type === "string") {
      this.selectionChange.emit(this._selection.map((e) => e.getId()));
    } else {
      this.selectionChange.emit(this._selection);
    }
  }

  /**
   * called when a key code from {@link separatorKeysCodes}
   * is recorded and the user has entered a new entity-name (resp.
   * whatever the accessor defines)
   * @param event the event to call this with
   */

  add(event: MatChipInputEvent) {
    const value = event.value;

    if (value) {
      const entity = this.allEntities.find(
        (e) => this.accessor(e) === value.trim()
      );
      if (entity) {
        this.selectEntity(entity);
      }
    }
    event.input.value = "";
    this.formControl.setValue(null);
  }

  private _filter(value: string): T[] {
    const filterValue = value.toLowerCase();
    return this.allEntities.filter((entity) =>
      this.accessor(entity).toLowerCase().startsWith(filterValue)
    );
  }

  /**
   * removes a given entity from the records (if it exists) and emits changes
   * @param entity The entity to remove
   */

  removeEntity(entity: T) {
    const index = this._selection.findIndex(
      (e) => e.getId() === entity.getId()
    );
    if (index !== -1) {
      this._selection.splice(index, 1);
      if (this.type === "string") {
        this.selectionChange.emit(this._selection.map((e) => e.getId()));
      } else {
        this.selectionChange.emit(this._selection);
      }
      this.inputField.nativeElement.value = "";
      this.formControl.setValue(null);
    }
  }

  private isSelected(entity: T): boolean {
    return (
      this._selection.findIndex((e) => e.getId() === entity.getId()) !== -1
    );
  }
}
