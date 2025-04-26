import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Optional,
  Output,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatMenuModule } from "@angular/material/menu";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntityConstructor } from "../../entity/model/entity";
import { ColumnConfig, toFormFieldConfig } from "../entity-form/FormConfig";
import { EntityFormService } from "../entity-form/entity-form.service";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { BasicAutocompleteComponent } from "../basic-autocomplete/basic-autocomplete.component";
import { MatFormFieldModule } from "@angular/material/form-field";

@Component({
  selector: "app-entity-fields-menu",
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    BasicAutocompleteComponent,
    MatFormFieldModule,
    ReactiveFormsModule,
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
  _availableFields: SimpleDropdownValue[] = [];

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
