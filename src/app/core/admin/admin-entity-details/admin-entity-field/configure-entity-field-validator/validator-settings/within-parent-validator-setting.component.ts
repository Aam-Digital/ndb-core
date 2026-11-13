import { Component, computed, inject, input } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { WithinParentConfig } from "#src/app/core/common-components/entity-form/dynamic-form-validators/form-validator-config";
import { DateRangeDatatype } from "#src/app/core/basic-datatypes/date-range/date-range.datatype";
import { resolveLocaleText } from "#src/app/core/language/active-locale";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import {
  EntityRelationsService,
  LinkedTypeFields,
} from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { ValidatorSettingComponent } from "./validator-setting";

/** an option of the date ranges a date range field can be checked against */
interface ParentRangeOption {
  label: string;
  value: WithinParentConfig;
}

/**
 * Setting of the `withinParent` rule of a date range field: the date range of a linked record that it should lie within.
 * It offers each date range field of the record types that this record links to ("link field › date range field").
 */
@DynamicComponent("WithinParentValidatorSetting")
@Component({
  selector: "app-within-parent-validator-setting",
  imports: [MatFormFieldModule, MatSelectModule, ReactiveFormsModule],
  template: `
    @if (options().length > 0) {
      <mat-form-field floatLabel="always">
        <mat-label>{{ label() }}</mat-label>
        <mat-select
          [formControl]="formControl()"
          [compareWith]="isSameParentRange"
        >
          @for (option of options(); track option.label) {
            <mat-option [value]="option.value">{{ option.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    } @else {
      <span class="hint-text" i18n>
        No linked record type of this record has a date range field to compare
        with.
      </span>
    }
  `,
})
export class WithinParentValidatorSettingComponent implements ValidatorSettingComponent<WithinParentConfig> {
  private readonly entityRelations = inject(EntityRelationsService);

  readonly formControl =
    input.required<FormControl<WithinParentConfig | null>>();
  readonly label = input.required<string>();
  readonly field = input<EntitySchemaField>();
  readonly entityType = input<EntityConstructor>();

  protected readonly options = computed(() => {
    const entityType = this.entityType();
    if (!entityType) {
      return [];
    }
    return this.entityRelations
      .getFieldsOfLinkedTypes(entityType, DateRangeDatatype.dataType)
      .flatMap((linked) =>
        this.optionsOfLinkedType(linked, entityType, this.field()),
      );
  });

  protected readonly isSameParentRange = (
    a: WithinParentConfig | null,
    b: WithinParentConfig | null,
  ) =>
    a?.parentReferenceField === b?.parentReferenceField &&
    a?.parentValueField === b?.parentValueField;

  /** the date range fields of a record type that the link field links to ("link field › date range field") */
  private optionsOfLinkedType(
    { linkId, link, linkedType, fields }: LinkedTypeFields,
    entityType: EntityConstructor,
    field: EntitySchemaField | undefined,
  ): ParentRangeOption[] {
    const linkLabel = resolveLocaleText(link.label) ?? linkId;
    const isSameType = linkedType === entityType;
    const options: ParentRangeOption[] = [];
    if (isSameType) {
      // the field itself (as the default), even if it is not saved to the schema yet
      const thisField =
        resolveLocaleText(field?.label) || $localize`this field`;
      options.push({
        label: `${linkLabel} › ${thisField}`,
        value: { parentReferenceField: linkId },
      });
    }
    for (const [valueId, parentField] of fields) {
      if (!(isSameType && valueId === field?.id)) {
        options.push({
          label: `${linkLabel} › ${resolveLocaleText(parentField.label) ?? valueId}`,
          value: { parentReferenceField: linkId, parentValueField: valueId },
        });
      }
    }
    return options;
  }
}
