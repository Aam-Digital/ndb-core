import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Optional,
  Output,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityConstructor } from "../../entity/model/entity";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../entity-form/FormConfig";
import { EntityFormService } from "../entity-form/entity-form.service";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";

@Component({
  selector: "app-entity-fields-menu",
  imports: [
    CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    EntityFieldSelectComponent,
  ],
  templateUrl: "./entity-fields-menu.component.html",
  styleUrl: "./entity-fields-menu.component.scss",
})
export class EntityFieldsMenuComponent implements OnInit {
  @Input() entityType: EntityConstructor;
  @Input() activeFields: string[] = [];
  @Input() set availableFields(value: ColumnConfig[]) {
    this._availableFields = value
      .map((field) => {
        const formFieldConfig =
          this.entityFormService && this.entityType
            ? this.entityFormService.extendFormFieldConfig(
                field,
                this.entityType,
              )
            : toFormFieldConfig(field);
        return {
          id: formFieldConfig.id,
          label: formFieldConfig.label,
        } as FormFieldConfig;
      })
      .filter((field) => field.label)
      // filter duplicates:
      .filter(
        (item, pos, arr) => arr.findIndex((x) => x.id === item.id) === pos,
      );
  }
  _availableFields: FormFieldConfig[] = [];

  @Output() activeFieldsChange = new EventEmitter<string[]>();
  selectedFieldsControl = new FormControl<string[]>([]);

  constructor(@Optional() private entityFormService: EntityFormService) {}
  ngOnInit() {
    this.selectedFieldsControl.setValue(this.activeFields);
    this.selectedFieldsControl.valueChanges.subscribe((value) => {
      const addedValues = value.filter((v) => !this.activeFields.includes(v));
      const removedValues = this.activeFields.filter((v) => !value.includes(v));

      if (addedValues.length > 0 || removedValues.length > 0) {
        this.activeFields = value;
        console.log("this.activeFields", this.activeFields);
        this.activeFieldsChange.emit(this.activeFields);
      }
    });
  }
  objectToLabel = (v: SimpleDropdownValue) => v?.label;
  objectToValue = (v: SimpleDropdownValue) => v?.key;
}
interface SimpleDropdownValue {
  key: string;
  label: string;
}
