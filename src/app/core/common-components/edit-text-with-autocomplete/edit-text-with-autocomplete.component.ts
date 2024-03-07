import { Component, OnInit } from "@angular/core";
import { EditComponent } from "../../entity/default-datatype/edit-component";
import { Entity } from "../../entity/model/entity";
import { BehaviorSubject } from "rxjs";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { AsyncPipe, NgForOf, NgIf } from "@angular/common";
import { DisplayEntityComponent } from "../../basic-datatypes/entity/display-entity/display-entity.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ErrorHintComponent } from "../error-hint/error-hint.component";

/**
 * This component creates a normal text input with autocomplete.
 * Compared to the {@link EditEntityComponent} this does not just assign the ID to the form control
 * but instead completely overwrites the form with the values taken from the selected entity.
 * This is especially useful when instead of creating a new entity, an existing one can also be selected (and extended).
 *
 * When a value is already present the autocomplete is disabled, and it works like a normal text input.
 *
 * E.g.
 * ```json
 * {
 *     "id": "title",
 *     "editComponent": "EditTextWithAutocomplete",
 *     "additional": {
 *       "entityType": "RecurringActivity",
 *       "relevantProperty": "linkedGroups",
 *       "relevantValue": "some-id",
 *     },
 *   }
 * ```
 */
@DynamicComponent("EditTextWithAutocomplete")
@Component({
  selector: "app-edit-text-with-autocomplete",
  templateUrl: "./edit-text-with-autocomplete.component.html",
  styleUrls: ["./edit-text-with-autocomplete.component.scss"],
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatAutocompleteModule,
    AsyncPipe,
    DisplayEntityComponent,
    NgForOf,
    NgIf,
    FontAwesomeModule,
    MatTooltipModule,
    ErrorHintComponent,
  ],
  standalone: true,
})
export class EditTextWithAutocompleteComponent
  extends EditComponent<string>
  implements OnInit
{
  /**
   * Config passed using component
   */
  additional: {
    /**
     * The entity type for which autofill should be created.
     * This should be the same type as for which the form was created.
     */
    entityType: string;
    /**
     * (optional) a property which should be filled with certain value, if an entity is selected.
     */
    relevantProperty?: string;
    /**
     * (optional) required if `relevantProperty` is set.
     * The value to be filled in `selectedEntity[relevantProperty]`.
     */
    relevantValue?: string;
  };

  entities: Entity[] = [];
  autocompleteEntities = new BehaviorSubject(this.entities);
  selectedEntity?: Entity;
  currentValues;
  originalValues;
  autocompleteDisabled = true;
  lastValue = "";
  addedFormControls = [];

  constructor(
    private entityMapperService: EntityMapperService,
    private confirmationDialog: ConfirmationDialogService,
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
      val !== this.currentValues[this.formControlName]
    ) {
      let filteredEntities = this.entities;
      if (val) {
        filteredEntities = this.entities.filter(
          (entity) =>
            entity !== this.selectedEntity &&
            entity.toString().toLowerCase().includes(val.toLowerCase()),
        );
      }
      this.autocompleteEntities.next(filteredEntities);
    }
  }

  async ngOnInit() {
    super.ngOnInit();
    if (!this.formControl.value) {
      // adding new entry - enable autocomplete
      const entityType = this.additional.entityType;
      this.entities = await this.entityMapperService.loadType(entityType);
      this.entities.sort((e1, e2) =>
        e1.toString().localeCompare(e2.toString()),
      );
      this.autocompleteDisabled = false;
      this.currentValues = this.parent.getRawValue();
      this.originalValues = this.currentValues;
    }
  }

  async selectEntity(selected: Entity) {
    if (await this.userConfirmsOverwriteIfNecessary(selected)) {
      this.selectedEntity = selected;
      this.addRelevantValueToRelevantProperty(this.selectedEntity);
      this.setAllFormValues(this.selectedEntity);
      this.currentValues = this.parent.getRawValue();
      this.autocompleteEntities.next([]);
    } else {
      this.formControl.setValue(this.lastValue);
    }
  }

  private async userConfirmsOverwriteIfNecessary(entity: Entity) {
    return (
      !this.valuesChanged() ||
      this.confirmationDialog.getConfirmation(
        $localize`:Discard the changes made:Discard changes`,
        $localize`Do you want to discard the changes made to '${entity}'?`,
      )
    );
  }

  private valuesChanged() {
    return Object.entries(this.currentValues).some(
      ([prop, value]) =>
        prop !== this.formControlName &&
        value !== this.parent.controls[prop].value,
    );
  }

  private addRelevantValueToRelevantProperty(selected: Entity) {
    if (
      this.additional.relevantProperty &&
      this.additional.relevantValue &&
      !selected[this.additional.relevantProperty].includes(
        this.additional.relevantValue,
      )
    ) {
      selected[this.additional.relevantProperty].push(
        this.additional.relevantValue,
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
          this.addedFormControls.push(key);
        }
      });
  }

  async resetForm() {
    if (await this.userConfirmsOverwriteIfNecessary(this.selectedEntity)) {
      this.addedFormControls.forEach((control) =>
        this.parent.removeControl(control),
      );
      this.addedFormControls = [];
      this.formControl.reset();
      this.parent.patchValue(this.originalValues);
      this.selectedEntity = null;
      this.currentValues = this.originalValues;
    }
  }
}
