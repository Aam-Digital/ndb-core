import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { ColumnMapping } from "../../column-mapping";
import { EntityConstructor } from "../../../entity/model/entity";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DefaultDatatype } from "../../../entity/default-datatype/default.datatype";
import { MatDialog } from "@angular/material/dialog";
import { ComponentRegistry } from "../../../../dynamic-components";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { MatInputModule } from "@angular/material/input";
import { EntityFieldSelectComponent } from "../../../entity/entity-field-select/entity-field-select.component";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { MappingDialogData } from "../mapping-dialog-data";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatTooltip } from "@angular/material/tooltip";
import { ImportAdditionalSettings } from "../../import-additional-settings/import-additional-settings.component";

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
    MatInputModule,
    EntityFieldSelectComponent,
    FormsModule,
    MatButtonModule,
    MatBadgeModule,
    FaIconComponent,
    MatTooltip,
  ],
})
export class EditImportColumnMappingComponent implements OnChanges {
  private dialog = inject(MatDialog);
  private componentRegistry = inject(ComponentRegistry);
  private schemaService = inject(EntitySchemaService);

  @Input() set columnMapping(value: ColumnMapping) {
    const newValueString = JSON.stringify(value);
    if (newValueString === JSON.stringify(this._columnMapping)) {
      return;
    }
    this._columnMapping = JSON.parse(newValueString);
  }

  get columnMapping(): ColumnMapping {
    return this._columnMapping;
  }

  /** internal deep-copy to not change properties of object by reference */
  private _columnMapping: ColumnMapping;

  @Input() entityCtor: EntityConstructor;

  /**
   * Existing column mappings of other columns
   * (e.g. to hide already mapped fields)
   */
  @Input() otherColumnMappings: ColumnMapping[];

  /**
   * the actually imported data
   * (to let this component configure special transformations, e.g. to map values to dropdown categories)
   */
  @Input() rawData: any[];

  /**
   * Additional settings for import processing
   */
  @Input() additionalSettings: ImportAdditionalSettings;

  /**
   * Field IDs that are disabled (already set as prefilled in additional actions)
   * (these fields cannot be selected in the dropdown)
   */
  @Input() disabledFields: string[] = [];

  @Output() columnMappingChange = new EventEmitter<ColumnMapping>();

  currentlyMappedDatatype: DefaultDatatype;

  /** warning label badges for a mapped column that requires user configuration for the "additional" details */
  mappingAdditionalWarning: string;

  /** whether the currently mapped datatype has been mapped to other columns also */
  hasMultiMapping?: boolean;

  hideOption = (option: FormFieldConfig) =>
    this.otherColumnMappings.some((c) => c.propertyName === option.id) &&
    !this.schemaService.getDatatypeOrDefault(option.dataType)
      .importAllowsMultiMapping &&
    option.id !== this.columnMapping.propertyName;

  ngOnChanges(changes: SimpleChanges): void {
    this.updateHasMultiMapping();
    if (changes["columnMapping"]) {
      this.updateDatatypeAndWarning();
    }
  }

  private updateHasMultiMapping() {
    this.hasMultiMapping = this.otherColumnMappings.some(
      (c) =>
        this.columnMapping?.propertyName !== undefined &&
        c.propertyName === this.columnMapping?.propertyName &&
        c.column !== this.columnMapping?.column,
    );
  }

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
          additionalSettings: this.additionalSettings,
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

    this.columnMapping.manuallyUpdated = true;

    this.updateDatatypeAndWarning();
    this.updateHasMultiMapping();
    this.columnMappingChange.emit(this.columnMapping);
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
