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
import { ImportAdditionalSettings } from "../../import-additional-settings";
import { ImportConfigDialogService } from "../import-config-dialog.service";

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
  private readonly schemaService = inject(EntitySchemaService);
  private readonly configDialogs = inject(ImportConfigDialogService);

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

  /**
   * Whether this column's config dialog is currently open.
   *
   * The field select notifies twice for a single selection, this keeps the second notification
   * from opening the same dialog again on top of the first one.
   */
  private configDialogOpen = false;

  currentlyMappedDatatype = computed<DefaultDatatype | null>(() => {
    const col = this.columnMapping();
    const schema = this.entityCtor()?.schema?.get(col?.propertyName);
    return schema
      ? this.schemaService.getDatatypeOrDefault(schema.dataType)
      : null;
  });

  /**
   * Error message below the field while the transformation of its values still has to be
   * configured and confirmed by the user, `null` once it is configured or not needed at all.
   */
  configError = computed<string | null>(() =>
    this.configDialogs.isConfigMissing(this.columnMapping(), this.entityCtor())
      ? $localize`:import column mapping - config missing:Value mapping is not configured yet. Open it and confirm to continue.`
      : null,
  );

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

  async onFieldSelected(propertyName: string) {
    const col: ColumnMapping = {
      ...this.columnMapping(),
      propertyName,
      // the new field brings its own transformation, the previous config does not apply to it
      additional: undefined,
      manuallyUpdated: true,
    };
    this.columnMappingChange.emit(col);

    if (
      this.configDialogOpen ||
      !this.configDialogs.hasConfigDialog(col, this.entityCtor())
    ) {
      return;
    }

    // open the config right away, so that the user reviews and confirms the suggested value
    // mappings of the field they just picked instead of importing the file's values unchanged
    this.configDialogOpen = true;
    try {
      const configuredCol = await this.configDialogs.openConfigDialog(
        col,
        this.rawData(),
        this.entityCtor(),
        this.additionalSettings(),
      );
      this.columnMappingChange.emit(configuredCol);
    } finally {
      this.configDialogOpen = false;
    }
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
