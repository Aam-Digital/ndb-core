import { Component, ElementRef, ViewChild } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { Entity } from "../../../../entity/model/entity";
import { Observable } from "rxjs";
import { filter, map } from "rxjs/operators";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { FormControl } from "@angular/forms";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";

@UntilDestroy()
@DynamicComponent()
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

  constructor(private entityMapperService: EntityMapperService) {
    super();
    this.filteredEntities = this.entityNameFormControl.valueChanges.pipe(
      untilDestroyed(this),
      filter((s) => s !== null),
      map((searchText?: string) => this.filter(searchText))
    );
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
    this.entities = await this.entityMapperService
      .loadType(entityType)
      .then((entities) =>
        entities.sort((e1, e2) => e1.toString().localeCompare(e2.toString()))
      );
    this.entityNameFormControl.setValidators(this.formControl.validator);
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

  select(entityName: string) {
    const entity = this.entities.find(
      (e) => e.toString().toLowerCase() === entityName.toLowerCase()
    );
    if (entity) {
      this.selectedEntity = entity;
      this.editingSelectedEntity = false;
      this.formControl.setValue(entity.getId());
    }
  }

  editSelectedEntity() {
    this.editingSelectedEntity = true;
    this.selectedEntity = undefined;
    this.formControl.setValue(null);
    setTimeout(() => {
      this.input.nativeElement.focus();
    });
  }
}
