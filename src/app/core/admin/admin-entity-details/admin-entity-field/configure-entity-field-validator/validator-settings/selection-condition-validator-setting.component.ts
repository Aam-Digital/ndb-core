import { Component, input } from "@angular/core";
import { FormControl } from "@angular/forms";
import { AdminDisplayConditionButtonComponent } from "#src/app/core/admin/building-blocks/admin-display-condition-button/admin-display-condition-button.component";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { DataFilter } from "#src/app/core/filter/filters/filters";
import { ValidatorSettingComponent } from "./validator-setting";

/**
 * Setting of the `selectionCondition` rule of a link field: a condition that the selected records should match.
 * It is only offered for a link to exactly one record type.
 */
@DynamicComponent("SelectionConditionValidatorSetting")
@Component({
  selector: "app-selection-condition-validator-setting",
  imports: [AdminDisplayConditionButtonComponent],
  template: `
    @if (linkedEntityType(); as linkedType) {
      <app-admin-display-condition-button
        target="field"
        [showLabel]="true"
        [entityType]="linkedType"
        [currentRecordType]="entityType()"
        createLabel="Create Selection Filter"
        i18n-createLabel
        editLabel="Edit Selection Filter"
        i18n-editLabel
        [tooltip]="description()"
        explanation="The selection dropdown shows only records that match the condition below (users can choose an option to also see other records)."
        i18n-explanation
        [condition]="formControl().value"
        (conditionChange)="formControl().setValue($event)"
      />
    } @else {
      <span>{{ label() }}</span>
    }
  `,
})
export class SelectionConditionValidatorSettingComponent implements ValidatorSettingComponent<
  DataFilter<Entity>
> {
  readonly formControl =
    input.required<FormControl<DataFilter<Entity> | null>>();
  readonly label = input<string>();
  readonly description = input<string>();
  readonly entityType = input<EntityConstructor>();
  readonly linkedEntityType = input<EntityConstructor>();
}
