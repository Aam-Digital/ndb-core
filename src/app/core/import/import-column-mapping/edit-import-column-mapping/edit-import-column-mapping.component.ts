import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from "@angular/core";
import { DynamicComponentConfig } from "../../../config/dynamic-components/dynamic-component-config.interface";
import { ColumnMapping } from "../../column-mapping";
import { EntityConstructor } from "../../../entity/model/entity";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DefaultDatatype } from "../../../entity/default-datatype/default.datatype";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { MatInputModule } from "@angular/material/input";
import { EntityFieldSelectComponent } from "../../../entity/entity-field-select/entity-field-select.component";
import { FormsModule } from "@angular/forms";
import { DynamicComponentDirective } from "../../../config/dynamic-components/dynamic-component.directive";
import { ImportAdditionalSettings } from "../../import-additional-settings/import-additional-settings.component";

/**
 * Component to edit a single imported column's mapping to an entity field
 * (including special transformations, if applicable).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-edit-import-column-mapping",
  templateUrl: "./edit-import-column-mapping.component.html",
  styleUrls: ["./edit-import-column-mapping.component.scss"],
  standalone: true,
  imports: [
    MatInputModule,
    EntityFieldSelectComponent,
    FormsModule,
    DynamicComponentDirective,
  ],
})
export class EditImportColumnMappingComponent implements OnChanges {
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
  @Input() otherColumnMappings: ColumnMapping[] = [];

  /**
   * the actually imported data
   * (to let this component configure special transformations, e.g. to map values to dropdown categories)
   */
  @Input() rawData: any[] = [];

  /**
   * Additional settings for import processing
   */
  @Input() additionalSettings: ImportAdditionalSettings;

  @Output() columnMappingChange = new EventEmitter<ColumnMapping>();

  currentlyMappedDatatype = signal<DefaultDatatype | null>(null);
  inlineComponentConfig = signal<DynamicComponentConfig | null>(null);

  /** Stable reference for the callback passed into the inline component */
  private boundUpdateMapping = () => this.updateMapping(true);

  hideOption = (option: FormFieldConfig) =>
    this.otherColumnMappings.some((c) => c.propertyName === option.id) &&
    !this.schemaService.getDatatypeOrDefault(option.dataType)
      .importAllowsMultiMapping &&
    option.id !== this.columnMapping.propertyName;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["columnMapping"]) {
      this.updateDatatype();
    }
    this.updateInlineComponentConfig();
  }

  updateMapping(settingAdditional = false) {
    if (!settingAdditional) {
      delete this.columnMapping.additional;
    }

    this.columnMapping.manuallyUpdated = true;

    this.updateDatatype();
    this.columnMappingChange.emit(this.columnMapping);
  }

  private updateDatatype() {
    const schema = this.entityCtor?.schema?.get(
      this.columnMapping?.propertyName,
    );
    const datatype = schema
      ? this.schemaService.getDatatypeOrDefault(schema.dataType)
      : null;
    this.currentlyMappedDatatype.set(datatype);
  }

  private updateInlineComponentConfig() {
    const componentName = this.currentlyMappedDatatype()?.importConfigComponent;
    if (!componentName) {
      this.inlineComponentConfig.set(null);
      return;
    }
    this.inlineComponentConfig.set({
      component: componentName,
      config: {
        col: this.columnMapping,
        rawData: this.rawData,
        entityType: this.entityCtor,
        otherColumnMappings: this.otherColumnMappings,
        additionalSettings: this.additionalSettings,
        onColumnMappingChange: this.boundUpdateMapping,
      },
    });
  }
}
