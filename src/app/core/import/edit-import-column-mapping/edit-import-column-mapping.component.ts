import { Component, Input, Output, EventEmitter, inject } from "@angular/core";
import { ColumnMapping } from "../column-mapping";
import { EntityConstructor } from "../../entity/model/entity";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { MatDialog } from "@angular/material/dialog";
import { ComponentRegistry } from "../../../dynamic-components";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { MatInputModule } from "@angular/material/input";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { MappingDialogData } from "../import-column-mapping/import-column-mapping.component";

/**
 * Component to edit a single imported column's mapping to an entity field
 * (including special transformations, if applicable).
 */
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
  private dialog = inject(MatDialog);
  private componentRegistry = inject(ComponentRegistry);
  private schemaService = inject(EntitySchemaService);

  @Input() columnMapping: ColumnMapping;
  @Input() entityCtor: EntityConstructor;
  @Input() usedColNames: Set<string>;

  /**
   * the actually imported data
   * (to let this component configure special transformations, e.g. to map values to dropdown categories)
   */
  @Input() rawData: any[];

  @Output() valueChange = new EventEmitter<ColumnMapping>();

  currentlyMappedDatatype: DefaultDatatype;

  /** warning label badges for a mapped column that requires user configuration for the "additional" details */
  mappingAdditionalWarning: string;

  hideOption = (option: FormFieldConfig) => this.usedColNames.has(option.id);

  async openMappingComponent() {
    const uniqueValues = new Set<any>();
    this.rawData.forEach((obj) =>
      uniqueValues.add(obj[this.columnMapping.column]),
    );

    const configComponent = await this.componentRegistry.get(
      this.currentlyMappedDatatype.importConfigComponent,
    )();

    this.dialog
      .open<any, MappingDialogData>(configComponent, {
        data: {
          col: this.columnMapping,
          values: [...uniqueValues],
          entityType: this.entityCtor,
        },
        width: "80vw",
        disableClose: true,
      })
      .afterClosed()
      .subscribe(() => this.updateMapping(true));
  }

  updateMapping(settingAdditional = false) {
    if (!settingAdditional) {
      delete this.columnMapping.additional;
    }

    this.updateDatatypeAndWarning();
    this.valueChange.emit(this.columnMapping);
  }

  private updateDatatypeAndWarning() {
    const schema = this.entityCtor.schema.get(this.columnMapping.propertyName);
    this.currentlyMappedDatatype = schema
      ? this.schemaService.getDatatypeOrDefault(schema.dataType)
      : null;
    this.mappingAdditionalWarning =
      this.currentlyMappedDatatype?.importIncompleteAdditionalConfigBadge?.(
        this.columnMapping,
      );
  }
}
