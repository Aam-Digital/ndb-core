import { Component, ElementRef, ViewChild } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { ENTITY_MAP } from "../../../entity-details/entity-details.component";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { Entity } from "../../../../entity/model/entity";
import { Observable } from "rxjs";
import { filter, map } from "rxjs/operators";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { FormControl } from "@angular/forms";

@UntilDestroy()
@Component({
  selector: "app-edit-single-entity",
  templateUrl: "./edit-single-entity.component.html",
  styleUrls: ["./edit-single-entity.component.scss"],
})
export class EditSingleEntityComponent extends EditComponent<string> {
  entities: Entity[] = [];
  placeholder: string;
  filteredEntities: Observable<Entity[]>;
  selectedEntity?: Entity;
  editingSelectedEntity: boolean = false;
  entityNameFormControl = new FormControl();

  @ViewChild("inputElement") input: ElementRef;

  constructor(private entityMapper: EntityMapperService) {
    super();
  }

  private filter(searchText?: string): Entity[] {
    if (!searchText) {
      return this.entities;
    } else {
      const filterValue = searchText.toLowerCase();
      return this.entities.filter((entity) =>
        entity.toString().toLowerCase().includes(filterValue)
      );
    }
  }

  async onInitFromDynamicConfig(config: EditPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.placeholder = $localize`:Placeholder for input to set an entity|context Select User:Select ${this.label}`;
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
    this.filteredEntities = this.entityNameFormControl.valueChanges.pipe(
      untilDestroyed(this),
      filter((value) => value === null || typeof value === "string"), // sometimes produces entities
      map((searchText?: string) => this.filter(searchText))
    );
    this.entityNameFormControl.setValue(null);
    const selectedEntity = this.entities.find(
      (entity) => entity.getId() === this.formControl.value
    );
    if (selectedEntity) {
      this.selectedEntity = selectedEntity;
      this.editingSelectedEntity = false;
      this.entityNameFormControl.setValue(selectedEntity.toString());
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

  submit() {
    const currentEntity = this.entityNameFormControl.value;
    const entity = this.entities.find((e) => e.toString() === currentEntity);
    if (entity) {
      this.selectedEntity = entity;
      this.editingSelectedEntity = false;
      this.formControl.setValue(entity.getId());
    }
  }

  editSelectedEntity() {
    this.editingSelectedEntity = true;
    this.formControl.setValue(null);
    setTimeout(() => {
      this.input.nativeElement.focus();
    });
  }
}
