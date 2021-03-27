import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { ENTER, COMMA } from "@angular/cdk/keycodes";
import { Entity, EntityConstructor } from "../../entity/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { BehaviorSubject } from "rxjs";
import { FormControl } from "@angular/forms";
import { filter, map } from "rxjs/operators";
import { MatChipInputEvent } from "@angular/material/chips";

export type accessorFn<T extends Entity> = (T) => string;

@Component({
  selector: "app-entity-select",
  templateUrl: "./entity-select.component.html",
  styleUrls: ["./entity-select.component.scss"],
})
export class EntitySelectComponent<T extends Entity> {
  @Input() set entityType(type: EntityConstructor<T>) {
    this.entityMapperService.loadType<T>(type).then((entities) => {
      this.allEntities = entities;
      this.loading = false;
      this.filteredEntities.next(entities);
    });
  }
  @Input() label: string;
  @Input() placeholder: string;
  loading: boolean = true;

  private _selectedEntities = new Map<string, T>();

  @Input() set selectedEntities(entities: T[]) {
    this._selectedEntities.clear();
    entities.forEach((e) => this._selectedEntities.set(e.getId(), e));
  }
  @Output() selectedEntityIdsChange = new EventEmitter<string[]>();

  @Output() onChange = new EventEmitter<void>();

  allEntities: T[] = [];
  filteredEntities = new BehaviorSubject<T[]>([]);

  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;
  @ViewChild("inputField") inputField: ElementRef<HTMLInputElement>;

  entityCtrl = new FormControl();

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(private entityMapperService: EntityMapperService) {
    this.entityCtrl.valueChanges
      .pipe(
        filter((value) => typeof value === "string"),
        map((entity?: string) =>
          entity
            ? this._filter(entity)
            : this.allEntities.filter(
                (ent) => !this._selectedEntities.has(ent.getId())
              )
        )
      )
      .subscribe((t) => {
        this.filteredEntities.next(t);
      });
  }

  @Input() accessor: accessorFn<T> = (e) => e.getId();

  selectEntity(entity: T) {
    this.inputField.nativeElement.value = "";
    this.entityCtrl.setValue(null);
    this._selectedEntities.set(entity.getId(), entity);
    this.selectedEntityIdsChange.emit([...this._selectedEntities.keys()]);
    this.onChange.emit();
  }

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
  }

  selectCurrentSearch() {
    const searchText = this.inputField.nativeElement.value;
    const entity = this.allEntities.find(
      (e) => this.accessor(e).toLowerCase() === searchText.toLowerCase()
    );
    if (entity) {
      this.selectEntity(entity);
    }
  }

  private _filter(value: string): T[] {
    const filterValue = value.toLowerCase();
    return this.allEntities.filter(
      (entity) =>
        !this._selectedEntities.has(entity.getId()) &&
        this.accessor(entity).toLowerCase().startsWith(filterValue)
    );
  }

  removeEntity(entity: T) {
    if (this._selectedEntities.delete(entity.getId())) {
      this.selectedEntityIdsChange.emit([...this._selectedEntities.keys()]);
      this.onChange.emit();
    }
  }
}
