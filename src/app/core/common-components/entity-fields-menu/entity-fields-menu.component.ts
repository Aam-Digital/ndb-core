import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from "@angular/core";
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
    MatFormFieldModule,
    ReactiveFormsModule,
    EntityFieldSelectComponent,
  ],
  templateUrl: "./entity-fields-menu.component.html",
  styleUrl: "./entity-fields-menu.component.scss",
})
export class EntityFieldsMenuComponent implements OnChanges {
  private entityFormService = inject(EntityFormService, { optional: true });

  @Input() entityType: EntityConstructor;
  @Input() set availableFields(value: ColumnConfig[]) {
    this._availableFields = value
      .map((field) =>
        this.entityFormService && this.entityType
          ? this.entityFormService.extendFormFieldConfig(field, this.entityType)
          : toFormFieldConfig(field),
      )
      .filter((field) => field.label)
      // filter duplicates:
      .filter(
        (item, pos, arr) => arr.findIndex((x) => x.id === item.id) === pos,
      );
  }
  _availableFields: FormFieldConfig[] = [];

  @Input() activeFields: string[];
  @Output() activeFieldsChange = new EventEmitter<string[]>();
  selectedFieldsControl = new FormControl<string[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activeFields) {
      this.selectedFieldsControl.setValue(this.activeFields, {
        emitEvent: false,
      });
      this.selectedFieldsControl.valueChanges.subscribe((value) => {
        this.activeFields = value;
        this.activeFieldsChange.emit(this.activeFields);
      });
    }
  }
}
