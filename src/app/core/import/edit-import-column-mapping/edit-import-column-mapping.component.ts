import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { EntityConstructor } from "../../entity/model/entity";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { MatInputModule } from "@angular/material/input";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";

@Component({
  selector: "app-edit-import-column-mapping",
  templateUrl: "./edit-import-column-mapping.component.html",
  styleUrls: ["./edit-import-column-mapping.component.scss"],
  standalone: true,
  imports: [
    HelpButtonComponent,
    MatInputModule,
    EntityFieldSelectComponent,
    FormsModule,
    MatButtonModule,
    MatBadgeModule,
  ],
})
export class EditImportColumnMappingComponent {
  @Input() col: ColumnMapping;
  @Input() entityCtor: EntityConstructor;
  @Input() dataTypeMap: Record<string, DefaultDatatype>;
  @Input() mappingAdditionalWarning: string;
  @Input() UsedColNames: Set<string>;

  @Output() propertyNameChange = new EventEmitter<ColumnMapping>();
  @Output() openMapping = new EventEmitter<void>();

  hideOption = (option: FormFieldConfig) => this.UsedColNames.has(option.id);

  onPropertyNameChange() {
    this.propertyNameChange.emit(this.col);
  }
}
