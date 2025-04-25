import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Optional,
  Output,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { EntityFieldLabelComponent } from "../entity-field-label/entity-field-label.component";
import { EntityConstructor } from "../../entity/model/entity";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../entity-form/FormConfig";
import { EntityFormService } from "../entity-form/entity-form.service";
import { FormControl } from "@angular/forms";
import { BasicAutocompleteComponent } from "../basic-autocomplete/basic-autocomplete.component";
import { MatFormFieldModule } from "@angular/material/form-field";

@Component({
  selector: "app-entity-fields-menu",
  imports: [
    CommonModule,
    FaIconComponent,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    EntityFieldLabelComponent,
    BasicAutocompleteComponent,
    MatFormFieldModule,
  ],
  templateUrl: "./entity-fields-menu.component.html",
  styleUrl: "./entity-fields-menu.component.scss",
})
export class EntityFieldsMenuComponent implements OnChanges {
  @Input() icon: IconProp = "search";
  @Input() entityType: EntityConstructor;
  @Input() activeFields: string[] = [];

  @Input() set availableFields(value: ColumnConfig[]) {
    this._availableFields = value
      .map((field) => {
        const formFieldConfig = this.entityFormService && this.entityType
          ? this.entityFormService.extendFormFieldConfig(field, this.entityType)
          : toFormFieldConfig(field);
        return {
          key: formFieldConfig.id,
          label: formFieldConfig.label,
        } as SimpleDropdownValue;
      })
      .filter((field) => field.label)
      // filter duplicates:
      .filter(
        (item, pos, arr) => arr.findIndex((x) => x.key === item.key) === pos,
      );
  }
  _availableFields: SimpleDropdownValue[];

  @Output() activeFieldsChange = new EventEmitter<string[]>();

  selectedFieldsControl = new FormControl<FormFieldConfig[]>([]);

  constructor(@Optional() private entityFormService: EntityFormService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activeFields || changes._availableFields) {
      const selectedConfigs = this.activeFields
        .map((id) => this._availableFields.find((f) => f.key === id))
        .filter((f) => !!f);
      this.selectedFieldsControl.setValue(selectedConfigs as any as FormFieldConfig[], {
        emitEvent: false,
      });
      console.log(this.selectedFieldsControl,"selectedFieldsControl");
      this.selectedFieldsControl.valueChanges.subscribe((selectedConfigs) => {

        const selectedIds = selectedConfigs?.map((c) => c.id) ?? [];
        console.log(selectedIds,"selectedIds");
        this.activeFieldsChange.emit(selectedIds);
      });
    }

  }
  objectToLabel = (v: SimpleDropdownValue) => v?.label;
  objectToValue = (v: SimpleDropdownValue) => v?.key;

  getFieldLabel(field: FormFieldConfig): string {
    return field.label || field.id;
  }


}
interface SimpleDropdownValue {
  key: string;
  label: string;
}
