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
  _availableFields: FormFieldConfig[];

  @Output() activeFieldsChange = new EventEmitter<string[]>();

  selectedFieldsControl = new FormControl<FormFieldConfig[]>([]);

  constructor(@Optional() private entityFormService: EntityFormService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activeFields || changes._availableFields) {
      const selectedConfigs = this.activeFields
        .map((id) => this._availableFields.find((f) => f.id === id))
        .filter((f) => !!f);
      this.selectedFieldsControl.setValue(selectedConfigs, {
        emitEvent: false,
      });
    }
  }

  ngOnInit() {
    this.selectedFieldsControl.valueChanges.subscribe((selectedConfigs) => {
      const selectedIds = selectedConfigs?.map((c) => c.id) ?? [];
      this.activeFieldsChange.emit(selectedIds);
    });
  }

  getFieldLabel(field: FormFieldConfig): string {
    return field.label || field.id;
  }
}
