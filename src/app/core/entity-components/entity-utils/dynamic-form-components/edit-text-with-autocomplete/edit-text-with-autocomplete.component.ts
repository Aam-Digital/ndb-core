import { Component, ElementRef, ViewChild } from "@angular/core";
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
  placeholder: string;
  autocompleteEntities = new BehaviorSubject<Entity[]>([]);
  selectedEntity?: Entity;
  inputText = "";
  isFirstFocusIn = true;
  initialValues;
  matAutocompleteDisabled: boolean = false;
  additional: {
    entityType: string;
    relevantProperty?: string;
    relevantValue?: string;
  };
  lastValue: string = "";

  @ViewChild("inputElement") input: ElementRef;

  constructor(
    private entityMapperService: EntityMapperService,
    private confirmationDialog: ConfirmationDialogService
  ) {
    super();
  }

  keyup(inputText: string) {
    this.lastValue = inputText;
    this.updateAutocomplete(inputText);
  }

  focusin(inputText: string) {
    if (!this.isFirstFocusIn) this.updateAutocomplete(inputText);
  }

  focusout() {
    this.isFirstFocusIn = false;
  }

  updateAutocomplete(inputText: string) {
    if (!this.matAutocompleteDisabled) {
      let filteredEntities = this.entities;
      if (inputText) {
        filteredEntities = this.entities.filter((entity) =>
          entity.toString().toLowerCase().includes(inputText.toLowerCase())
        );
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
      this.matAutocompleteDisabled = true;
      this.placeholder = "";
    }
    this.initialValues = this.parent.getRawValue();
  }

  async select(selected: Entity) {
    if (
      !this.valuesChanged() ||
      (await this.confirmationDialog.getConfirmation(
        $localize`:Discard the changes made:Discard changes`,
        $localize`Do you want to discard the changes made and load '${
          selected[this.formControlName]
        }'?`
      ))
    ) {
      this.selectedEntity = selected;
      this.addRelevantValueToRelevantProperty(selected);
      Object.keys(this.parent.controls).forEach((key) => {
        this.parent.controls[key].setValue(selected[key]);
      });
      this.addMissingControls(selected);
      this.initialValues = this.parent.getRawValue();
    } else {
      this.formControl.setValue(this.lastValue);
    }
  }

  private valuesChanged() {
    let valuesChanged = false;
    for (const iV in this.initialValues) {
      if (
        iV != this.formControlName &&
        this.initialValues[iV] != this.parent.controls[iV].value
      ) {
        valuesChanged = true;
        break;
      }
    }
    return valuesChanged;
  }

  private addRelevantValueToRelevantProperty(selected) {
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

  private addMissingControls(selected) {
    const formKeys = Object.keys(selected).filter(
      (key) =>
        selected.getSchema().has(key) &&
        !this.parent.controls.hasOwnProperty(key)
    );
    formKeys.forEach((key) =>
      this.parent.addControl(key, new FormControl(selected[key]))
    );
  }
}
