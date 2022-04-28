import { Component, ElementRef, ViewChild } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { Entity } from "../../../../entity/model/entity";
import { BehaviorSubject } from "rxjs";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";

@DynamicComponent("EditSingleEntity")
@Component({
  selector: "app-edit-single-entity",
  templateUrl: "./edit-single-entity.component.html",
  styleUrls: ["./edit-single-entity.component.scss"],
})
export class EditSingleEntityComponent extends EditComponent<string> {
  entities: Entity[] = [];
  placeholder: string;
  autocompleteEntities = new BehaviorSubject<Entity[]>([]);
  selectedEntity?: Entity;
  editingSelectedEntity = false;

  @ViewChild("inputElement") input: ElementRef;

  constructor(private entityMapperService: EntityMapperService) {
    super();
  }

  updateAutocomplete(inputText: string) {
    let filteredEntities = this.entities;
    if (inputText) {
      filteredEntities = this.entities.filter((entity) =>
        entity.toString().toLowerCase().includes(inputText.toLowerCase())
      );
    }
    this.autocompleteEntities.next(filteredEntities);
  }

  async onInitFromDynamicConfig(config: EditPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.placeholder = $localize`:Placeholder for input to set an entity|context Select User:Select ${
      config.formFieldConfig.label || config.propertySchema?.label
    }`;
    const entityType: string =
      config.formFieldConfig.additional || config.propertySchema.additional;
    this.entities = await this.entityMapperService.loadType(entityType);
    this.entities.sort((e1, e2) => e1.toString().localeCompare(e2.toString()));
    const selectedEntity = this.entities.find(
      (entity) => entity.getId() === this.formControl.value
    );
    if (selectedEntity) {
      this.selectedEntity = selectedEntity;
      this.editingSelectedEntity = false;
    }
  }

  select(selected: string | Entity) {
    let entity: Entity;
    if (typeof selected === "string") {
      entity = this.entities.find(
        (e) => e.toString().toLowerCase() === selected.toLowerCase()
      );
    } else {
      entity = selected;
    }

    if (entity) {
      this.selectedEntity = entity;
      this.editingSelectedEntity = false;
      this.formControl.setValue(entity.getId());
    } else {
      this.selectedEntity = undefined;
      this.formControl.setValue(undefined);
    }
  }

  editSelectedEntity() {
    this.editingSelectedEntity = true;
    setTimeout(() => {
      this.input.nativeElement.focus();
    });
  }
}
