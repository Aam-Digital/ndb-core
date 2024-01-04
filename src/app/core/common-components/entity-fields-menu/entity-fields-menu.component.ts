import { Component, EventEmitter, Input, Output } from "@angular/core";
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

@Component({
  selector: "app-entity-fields-menu",
  standalone: true,
  imports: [
    CommonModule,
    FaIconComponent,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    EntityFieldLabelComponent,
  ],
  templateUrl: "./entity-fields-menu.component.html",
  styleUrl: "./entity-fields-menu.component.scss",
})
export class EntityFieldsMenuComponent {
  @Input() icon: IconProp = "eye";

  @Input() entityType: EntityConstructor;

  @Input() set availableFields(value: ColumnConfig[]) {
    this._availableFields = value
      .map((field) => toFormFieldConfig(field))
      .filter((field) => field.label);
  }
  _availableFields: FormFieldConfig[];

  @Input() activeFields: string[];
  @Output() activeFieldsChange = new EventEmitter<string[]>();

  toggleFieldSelection(field: FormFieldConfig) {
    if (this.activeFields.includes(field.id)) {
      this.activeFields = this.activeFields.filter((f) => f !== field.id);
    } else {
      this.activeFields = [...this.activeFields, field.id];
    }
    this.activeFieldsChange.emit(this.activeFields);
  }
}
