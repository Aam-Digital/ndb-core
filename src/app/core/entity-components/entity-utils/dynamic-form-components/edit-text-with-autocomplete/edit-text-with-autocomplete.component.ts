import { Component } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { Entity } from "../../../../entity/model/entity";
import { BehaviorSubject } from "rxjs";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { FormControl } from "@angular/forms";
import { ConfirmationDialogService } from "app/core/confirmation-dialog/confirmation-dialog.service";

@DynamicComponent("EditTextWithAutocomplete")
@Component({
  selector: "app-edit-text-with-autocomplete",
  templateUrl: "./edit-text-with-autocomplete.component.html",
  styleUrls: ["./edit-text-with-autocomplete.component.scss"],
})
export class EditTextWithAutocompleteComponent extends EditComponent<string> {
  entities: Entity[] = [];
  autocompleteEntities = new BehaviorSubject<Entity[]>([]);
  selectedEntity?: Entity;
  initialValues;
  autocompleteDisabled = true;
  additional: {
    entityType: string;
    relevantProperty?: string;
    relevantValue?: string;
  };
  lastValue = "";

  constructor(
    private entityMapperService: EntityMapperService,
    private confirmationDialog: ConfirmationDialogService
  ) {
    super();
  }

  keyup() {
    this.lastValue = this.formControl.value;
    this.updateAutocomplete();
  }

  updateAutocomplete() {
    let val = this.formControl.value;
    if (
      !this.autocompleteDisabled &&
      val !== this.initialValues[this.formControlName]
    ) {
      let filteredEntities = this.entities;
      if (val) {
        filteredEntities = this.entities.filter(
          (entity) =>
            entity !== this.selectedEntity &&
            entity.toString().toLowerCase().includes(val.toLowerCase())
        );
      }
      this.autocompleteEntities.next(filteredEntities);
    }
  }

  async onInitFromDynamicConfig(config: EditPropertyConfig<string>) {
    super.onInitFromDynamicConfig(config);
    if (!this.formControl.value) {
      // adding new entry - enable autocomplete
      this.additional = config.formFieldConfig.additional;
      const entityType =
        this.additional.entityType || this.additional.entityType;
      this.entities = await this.entityMapperService.loadType(entityType);
      this.entities.sort((e1, e2) =>
        e1.toString().localeCompare(e2.toString())
      );
      this.selectedEntity = this.entities.find(
        (entity) => entity[this.formControlName] === this.formControl.value
      );
      this.autocompleteDisabled = false;
      this.initialValues = this.parent.getRawValue();
    }
  }

  async selectEntity() {
    const val = this.formControl.value;
    if (!this.valuesChanged() || (await this.userConfirmsOverwrite(val))) {
      this.selectedEntity = this.entities.find(
        (e) => e[this.formControlName] === val
      );
      this.addRelevantValueToRelevantProperty(this.selectedEntity);
      this.setAllFormValues(this.selectedEntity);
      this.initialValues = this.parent.getRawValue();
      this.autocompleteEntities.next([]);
    } else {
      this.formControl.setValue(this.lastValue);
    }
  }

  private async userConfirmsOverwrite(selected: string) {
    return await this.confirmationDialog.getConfirmation(
      $localize`:Discard the changes made:Discard changes`,
      $localize`Do you want to discard the changes made and load '${selected}'?`
    );
  }

  private valuesChanged() {
    return Object.keys(this.initialValues).some(
      (prop) =>
        prop != this.formControlName &&
        this.initialValues[prop] != this.parent.controls[prop].value
    );
  }

  private addRelevantValueToRelevantProperty(selected: Entity) {
    if (
      this.additional.relevantProperty &&
      this.additional.relevantValue &&
      !selected[this.additional.relevantProperty].includes(
        this.additional.relevantValue
      )
    ) {
      selected[this.additional.relevantProperty].push(
        this.additional.relevantValue
      );
    }
  }

  private setAllFormValues(selected: Entity) {
    Object.keys(selected)
      .filter((key) => selected.getSchema().has(key))
      .forEach((key) => {
        if (this.parent.controls.hasOwnProperty(key)) {
          this.parent.controls[key].setValue(this.selectedEntity[key]);
        } else {
          // adding missing controls so saving does not lose any data
          this.parent.addControl(key, new FormControl(selected[key]));
        }
      });
  }
}
