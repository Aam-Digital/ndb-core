import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
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
  imports: [
    MatInputModule,
    EntityFieldSelectComponent,
    FormsModule,
    DynamicComponentDirective,
  ],
})
export class EditImportColumnMappingComponent {
  private schemaService = inject(EntitySchemaService);

  columnMapping = input.required<ColumnMapping>();

  entityCtor = input.required<EntityConstructor>();

  /**
   * Existing column mappings of other columns
   * (e.g. to hide already mapped fields)
   */
  otherColumnMappings = input<ColumnMapping[]>([]);

  /**
   * the actually imported data
   * (to let this component configure special transformations, e.g. to map values to dropdown categories)
   */
  rawData = input<any[]>([]);

  /**
   * Additional settings for import processing
   */
  additionalSettings = input<ImportAdditionalSettings>();

  columnMappingChange = output<ColumnMapping>();

  currentlyMappedDatatype = computed<DefaultDatatype | null>(() => {
    const col = this.columnMapping();
    const schema = this.entityCtor()?.schema?.get(col?.propertyName);
    return schema
      ? this.schemaService.getDatatypeOrDefault(schema.dataType)
      : null;
  });

  inlineComponentConfig = computed<DynamicComponentConfig | null>(() => {
    const componentName = this.currentlyMappedDatatype()?.importConfigComponent;
    if (!componentName) return null;
    return {
      component: componentName,
      config: {
        col: this.columnMapping(),
        rawData: this.rawData(),
        entityType: this.entityCtor(),
        otherColumnMappings: this.otherColumnMappings(),
        additionalSettings: this.additionalSettings(),
        onColumnMappingChange: this.onInlineComponentChange,
      },
    };
  });

  /**
   * Callback for inline config components to propagate column mapping changes.
   * Defined as a stable reference (class field) to avoid re-rendering the dynamic component on each recomputation.
   */
  private readonly onInlineComponentChange = (updatedCol: ColumnMapping) => {
    this.columnMappingChange.emit({ ...updatedCol, manuallyUpdated: true });
  };

  hideOption = (option: FormFieldConfig) =>
    this.otherColumnMappings().some((c) => c.propertyName === option.id) &&
    !this.schemaService.getDatatypeOrDefault(option.dataType)
      .importAllowsMultiMapping &&
    option.id !== this.columnMapping()?.propertyName;

  onFieldSelected(propertyName: string) {
    const col = this.columnMapping();
    this.columnMappingChange.emit({
      ...col,
      propertyName,
      additional: undefined,
      manuallyUpdated: true,
    });
  }

  updateMapping(settingAdditional = false) {
    const col = this.columnMapping();
    const updated: ColumnMapping = { ...col, manuallyUpdated: true };
    if (!settingAdditional) {
      delete updated.additional;
    }
    this.columnMappingChange.emit(updated);
  }
}
