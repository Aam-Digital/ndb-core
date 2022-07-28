import { Component, ElementRef, ViewChild } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { Entity } from "../../../../entity/model/entity";
import { BehaviorSubject } from "rxjs";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { FormControl } from "@angular/forms";

@DynamicComponent("EditTextWithAutocomplete")
@Component({
  selector: "app-edit-text-with-autocomplete",
  templateUrl: "./edit-text-with-autocomplete.component.html",
  styleUrls: ["./edit-text-with-autocomplete.component.scss"],
})
export class EditTextWithAutocompleteComponent extends EditComponent<string> {
  entities: Entity[] = [];
  placeholder: string;
  autocompleteEntities = new BehaviorSubject<Entity[]>([]);
  selectedEntity?: Entity;
  editingSelectedEntity = false;
  inputText = "";
  inUniqueExistingEntity = false;
  isFirstFocusIn = true;
  initialValues;
  matAutocompleteDisabled: boolean = false;
  additional: {
    entityType: string;
    relevantProperty: string;
    relevantValue: string;
  };

  @ViewChild("inputElement") input: ElementRef;

  constructor(private entityMapperService: EntityMapperService) {
    super();
  }

  updateAutocomplete(inputText: string) {
    if (this.isFirstFocusIn) {
      this.isFirstFocusIn = false;
      return;
    }
    if (!this.matAutocompleteDisabled) {
      let filteredEntities = this.entities;
      if (inputText) {
        filteredEntities = this.entities.filter((entity) =>
          entity.toString().toLowerCase().includes(inputText.toLowerCase())
        );
        // if (filteredEntities.length === 1) {
        //   this.select(filteredEntities[0]);
        // } else {
        // this.select(inputText);
        // }
      }
      this.autocompleteEntities.next(filteredEntities);
    }
  }

  async onInitFromDynamicConfig(config: EditPropertyConfig<string>) {
    super.onInitFromDynamicConfig(config);
    this.additional = config.formFieldConfig.additional;
    this.placeholder = $localize`:Placeholder for input to set an entity|context Select User:Type new or select existing after typing ${
      config.formFieldConfig.label || config.propertySchema?.label
    }`;
    const entityType: string =
      config.formFieldConfig.additional.entityType ||
      config.propertySchema.additional.entityType;
    this.entities = await this.entityMapperService.loadType(entityType);
    this.entities.sort((e1, e2) => e1.toString().localeCompare(e2.toString()));
    const selectedEntity = this.entities.find(
      (entity) => entity.toString() === this.formControl.value
    );
    if (selectedEntity) {
      this.selectedEntity = selectedEntity;
      this.editingSelectedEntity = false;
      this.matAutocompleteDisabled = true;
      this.placeholder = "";
    }
    this.initialValues = this.parent.getRawValue();
  }

  select(selected: Entity) {
    let entity: Entity;
    console.log("select aufgerufen mit ", selected);
    // if (typeof selected === "string") {
    //   entity = this.entities.find(
    //     (e) => e.toString().toLowerCase() === selected.toLowerCase()
    //   );
    // } else {
    entity = selected;
    // }
    console.log("entity ist ", entity);

    if (entity) {
      this.selectedEntity = entity;
      this.editingSelectedEntity = false;
      // this.formControl.setValue(entity.getId());
      const schema = entity.getSchema();
      const formKeys = Object.keys(entity).filter(
        (key) => schema.has(key) && !this.parent.controls.hasOwnProperty(key)
      );
      entity[this.additional.relevantProperty].push(
        this.additional.relevantValue
      );
      Object.keys(this.parent.controls).forEach((key) => {
        this.parent.controls[key].setValue(entity[key]);
      });
      formKeys.forEach((key) =>
        this.parent.addControl(key, new FormControl(entity[key]))
      );
    } else {
      // this.inputText = selected as string;
      this.selectedEntity = undefined;
      Object.keys(this.parent.controls)
        .filter((key) => key != this.formControlName)
        .forEach((key) => {
          if (this.initialValues.hasOwnProperty(key)) {
            this.parent.controls[key].setValue(this.initialValues[key]);
          } else {
            this.parent.removeControl(key);
          }
        });
      // this.formControl.setValue(selected as string);
    }
    console.log("this.selectedEntity", this.selectedEntity);
  }

  // editSelectedEntity() {
  //   this.editingSelectedEntity = true;
  //   setTimeout(() => {
  //     this.input.nativeElement.focus();
  //   });
  // }
}
