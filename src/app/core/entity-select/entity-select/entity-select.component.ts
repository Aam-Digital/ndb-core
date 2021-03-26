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
import { Observable } from "rxjs";
import { FormControl } from "@angular/forms";
import { filter, map, skipWhile, startWith } from "rxjs/operators";
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
    });
  }
  @Input() label: string;
  @Input() placeholder: string;
  loading: boolean = true;

  @Input() selectedEntities: T[] = [];
  @Output() selectedEntitiesChange = new EventEmitter<T[]>();

  @Output() onChange = new EventEmitter<void>();

  allEntities: T[] = [];
  filteredEntities: Observable<T[]>;

  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;
  @ViewChild("inputField") inputField: ElementRef<HTMLInputElement>;

  entityCtrl = new FormControl();

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(private entityMapperService: EntityMapperService) {
    this.filteredEntities = this.entityCtrl.valueChanges.pipe(
      startWith(null),
      filter((value) => typeof value === "string"),
      map((e?: string) => (e ? this._filter(e) : this.allEntities.slice()))
    );
    this.filteredEntities.subscribe((t) => {
      console.log(t);
    });
  }

  @Input() accessor: accessorFn<T> = (e) => e.getId();

  selectEntity(entity: T) {
    this.inputField.nativeElement.value = "";
    this.entityCtrl.setValue(null);
    this.selectedEntities.push(entity);
    this.selectedEntitiesChange.emit(this.selectedEntities);
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
    return this.allEntities.filter((entity) =>
      this.accessor(entity).toLowerCase().startsWith(filterValue)
    );
  }

  removeEntity(entity: T) {
    const index = this.selectedEntities.findIndex(
      (e) => e.getId() === entity.getId()
    );
    if (index !== -1) {
      this.selectedEntities.splice(index, 1);
      this.selectedEntitiesChange.emit(this.selectedEntities);
      this.onChange.emit();
    }
  }
}
