import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { ENTITY_MAP } from "../../../entity-details/entity-details.component";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { Entity } from "../../../../entity/model/entity";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { FormControl } from "@angular/forms";
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from "@angular/material/autocomplete";

@Component({
  selector: "app-edit-single-entity",
  templateUrl: "./edit-single-entity.component.html",
  styleUrls: ["./edit-single-entity.component.scss"],
})
export class EditSingleEntityComponent
  extends EditComponent<string>
  implements OnInit {
  entities: Entity[] = [];
  placeholder: string;
  filteredEntities: Observable<Entity[]>;
  entityNameFormControl: FormControl;
  selection_: Entity[] = [];
  selectedEntity?: Entity;
  editingSelectedEntity: boolean = false;

  @Input() showEntities: boolean = true;
  @Input() selectionInputType: "id" | "entity" = "id";
  @Output() selectionChange = new EventEmitter<(string | Entity)[]>();
  @ViewChild("inputField") inputField: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  selectEntity(entity: Entity) {
    this.selection_.push(entity);
    this.emitChange();
    this.inputField.nativeElement.value = "";
    this.formControl.setValue(null);
    setTimeout(() => this.autocomplete.openPanel());
  }
  constructor(private entityMapper: EntityMapperService) {
    super();
    this.entityNameFormControl = new FormControl();
  }
  filter(searchText: string): Entity[] {
    return this.entities.filter((entity) =>
      entity.toString().toLowerCase().includes(searchText)
    );
  }
  ngOnInit() {
    this.filteredEntities = this.entityNameFormControl.valueChanges.pipe(
      map((searchText?: string) => this.filter(searchText))
    );
  }
  async onInitFromDynamicConfig(config: EditPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.placeholder = $localize`:Placeholder for input to add entities|context Add User(s):Add ${this.label}`;
    const entityType: string =
      config.formFieldConfig.additional || config.propertySchema.additional;
    const entityConstructor = ENTITY_MAP.get(entityType);
    if (!entityConstructor) {
      throw new Error(`Entity-Type ${entityType} not in EntityMap`);
    }
    this.entities = await this.entityMapper
      .loadType(entityConstructor)
      .then((entities) =>
        entities.sort((e1, e2) => e1.toString().localeCompare(e2.toString()))
      );
    const selectedEntity = this.entities.find(
      (entity) => entity.getId() === this.formControl.value
    );
    if (selectedEntity) {
      this.selectedEntity = selectedEntity;
      this.editingSelectedEntity = false;
      this.entityNameFormControl.setValue(selectedEntity.toString());
    } else {
      this.entityNameFormControl.setValue("");
    }
  }

  select(event: MatAutocompleteSelectedEvent) {
    const entity = this.entities.find(
      (e) => e.toString().toLowerCase() === event.option.value.toLowerCase()
    );
    if (entity) {
      this.selectedEntity = entity;
      this.editingSelectedEntity = false;
      this.formControl.setValue(entity.getId());
    }
  }

  private emitChange() {
    if (this.selectionInputType === "id") {
      this.selectionChange.emit(this.selection_.map((e) => e.getId()));
    } else {
      this.selectionChange.emit(this.selection_);
    }
  }
}
