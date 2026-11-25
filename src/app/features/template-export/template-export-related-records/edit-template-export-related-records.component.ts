import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AbstractControl, ValidationErrors } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import {
  MatFormFieldControl,
  MatFormFieldModule,
} from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BasicAutocompleteComponent } from "#src/app/core/common-components/basic-autocomplete/basic-autocomplete.component";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { resolveLocaleText } from "#src/app/core/language/active-locale";
import { asArray } from "#src/app/utils/asArray";
import {
  getRelatedRecordsLevels,
  isHierarchyField,
  canBeUsedInPlaceholder,
  getRelatedRecordsPlaceholder,
  RELATED_RECORDS_MAX_LEVELS,
  clampRelatedRecordsLevels,
  TemplateExportRelatedRecords,
} from "./template-export-related-records";

/**
 * A relationship that can be selected to include related records in a template:
 * a field of some record type that links to one of the template's applicable record types.
 */
interface RelatedRecordsOption {
  /** unique identifier of this option (combining entityType and property) */
  id: string;
  entityType: string;
  property: string;
  label: string;
  /** whether the related records can link among themselves through this field, forming a hierarchy */
  isHierarchy: boolean;
  /** marks a saved selection that is not available anymore (highlighted in the dropdown) */
  isInvalid?: boolean;
}

/**
 * One configured list of related records, with the details needed to display it.
 */
interface RelatedRecordsRow {
  config: TemplateExportRelatedRecords;
  /** id of the selected option (even if that option is not available anymore) */
  optionId: string | undefined;
  /** the selected option, if it is (still) available for the applicable record types */
  option: RelatedRecordsOption | undefined;
  /** the options to offer in this row's dropdown, including an unavailable selection so that it stays visible */
  selectableOptions: RelatedRecordsOption[];
  levels: number;
  /** example placeholder(s) to copy into the template file */
  examples: string[];
}

function getOptionId(config: { entityType?: string; property?: string }) {
  return config.entityType && config.property
    ? config.entityType + "::" + config.property
    : undefined;
}

/**
 * Edit which records linking to the exported record are included in a {@link TemplateExport}
 * (e.g. the sub-tasks of a task).
 */
@DynamicComponent("EditTemplateExportRelatedRecords")
@Component({
  selector: "app-edit-template-export-related-records",
  templateUrl: "./edit-template-export-related-records.component.html",
  styleUrl: "./edit-template-export-related-records.component.scss",
  imports: [
    MatFormFieldModule,
    BasicAutocompleteComponent,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatCheckboxModule,
    FaDynamicIconComponent,
  ],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditTemplateExportRelatedRecordsComponent,
    },
  ],
})
export class EditTemplateExportRelatedRecordsComponent
  extends CustomFormControlDirective<TemplateExportRelatedRecords[]>
  implements EditComponent, OnInit
{
  private readonly entityRelations = inject(EntityRelationsService);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly destroyRef = inject(DestroyRef);

  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  readonly maxLevels = RELATED_RECORDS_MAX_LEVELS;

  /**
   * The record types the template is applicable for, as currently selected in the form.
   */
  private readonly applicableTypes = signal<string[]>([]);

  /**
   * Whether the template is a "Multi-Record Report", in which `d` is the list of the selected records.
   */
  private readonly isArrayReport = signal(false);

  /**
   * The relationships to the applicable record types that can be included.
   */
  readonly options = computed<RelatedRecordsOption[]>(() =>
    this.getOptions(this.applicableTypes()),
  );

  readonly rows = computed<RelatedRecordsRow[]>(() =>
    asArray(this.valueSignal() ?? []).map((config) => {
      const optionId = getOptionId(config);
      const option = this.options().find((o) => o.id === optionId);
      const levels = option?.isHierarchy
        ? getRelatedRecordsLevels(
            config,
            this.entityRegistry.get(option.entityType),
          )
        : 1;
      return {
        config,
        optionId,
        option,
        selectableOptions: this.getSelectableOptions(config, optionId, option),
        levels,
        examples: this.getExamples(config, option, levels),
      };
    }),
  );

  readonly optionToId = (option: RelatedRecordsOption) => option.id;
  readonly optionToLabel = (option: RelatedRecordsOption) => option.label;

  ngOnInit() {
    // which related records are available depends on the record types selected in the same form
    const typesControl = this.formControl?.parent?.get(
      "applicableForEntityTypes",
    );
    this.applicableTypes.set(
      asArray(
        typesControl?.value ?? this.entity()?.["applicableForEntityTypes"],
      ).filter((type) => !!type),
    );
    typesControl?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((types) => {
        this.applicableTypes.set(asArray(types ?? []));
        this.formControl.updateValueAndValidity();
      });

    const arrayReportControl = this.formControl?.parent?.get("arrayReport");
    this.isArrayReport.set(
      !!(arrayReportControl?.value ?? this.entity()?.["arrayReport"]),
    );
    arrayReportControl?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.isArrayReport.set(!!value));

    const control = this.formControl;
    if (control) {
      control.addValidators(this.validateRelatedRecords);
      control.updateValueAndValidity({ emitEvent: false });
      this.destroyRef.onDestroy(() =>
        control.removeValidators(this.validateRelatedRecords),
      );
    }
  }

  addRow() {
    this.updateValue([
      ...this.currentValue(),
      { entityType: "", property: "" },
    ]);
  }

  removeRow(index: number) {
    this.updateValue(this.currentValue().filter((_, i) => i !== index));
  }

  selectOption(index: number, selected: string | string[]) {
    // the dropdown emits the value type of a multi select, but only one option can be selected here
    const optionId = asArray(selected)[0];

    // the dropdown also emits the value it is given, which must not mark the form as changed
    if (optionId === getOptionId(this.currentValue()[index] ?? {})) {
      return;
    }

    if (!optionId) {
      // the user cleared the text: empty the entry, so the validation asks to select or remove it
      this.updateRow(index, () => ({ entityType: "", property: "" }));
      return;
    }

    const option = this.options().find((o) => o.id === optionId);
    if (!option) {
      return;
    }

    this.updateRow(index, (config) => {
      const updated: TemplateExportRelatedRecords = {
        entityType: option.entityType,
        property: option.property,
      };
      if (option.isHierarchy && config.levels > 1) {
        updated.levels = config.levels;
      }
      if (config.includeArchived) {
        updated.includeArchived = true;
      }
      return updated;
    });
  }

  /**
   * @returns the number of levels as saved (limited to the supported range), to show in the input
   * (the input keeps the entered number if the saved value does not change)
   */
  setLevels(index: number, value: string): number {
    const levels = clampRelatedRecordsLevels(value);
    this.updateRow(index, (config) => {
      const { levels: _previous, ...updated } = config;
      return levels > 1 ? { ...updated, levels } : updated;
    });
    return levels;
  }

  setIncludeArchived(index: number, includeArchived: boolean) {
    this.updateRow(index, (config) => {
      const { includeArchived: _previous, ...updated } = config;
      return includeArchived ? { ...updated, includeArchived } : updated;
    });
  }

  private currentValue(): TemplateExportRelatedRecords[] {
    return asArray(this.formControl.value ?? []);
  }

  private updateRow(
    index: number,
    update: (
      config: TemplateExportRelatedRecords,
    ) => TemplateExportRelatedRecords,
  ) {
    this.updateValue(
      this.currentValue().map((config, i) =>
        i === index ? update(config) : config,
      ),
    );
  }

  private updateValue(value: TemplateExportRelatedRecords[]) {
    this.formControl.setValue(value);
    this.formControl.markAsDirty();
    // show validation errors right away, as there is no single input to "leave" first
    this.formControl.markAsTouched();
  }

  private getOptions(applicableTypes: string[]): RelatedRecordsOption[] {
    const options = new Map<string, RelatedRecordsOption>();
    for (const type of applicableTypes) {
      for (const {
        entityType,
        referencingProperties,
      } of this.entityRelations.getEntityTypesReferencingType(type)) {
        if (entityType.isInternalEntity || !entityType.label) {
          continue;
        }

        for (const field of referencingProperties) {
          const config = {
            entityType: entityType.ENTITY_TYPE,
            property: field.id,
          };
          // an id that cannot be part of a placeholder could not be saved anyway
          if (!canBeUsedInPlaceholder(config)) {
            continue;
          }
          const recordType = resolveLocaleText(
            entityType.labelPlural ?? entityType.label,
          );
          const fieldLabel = resolveLocaleText(field.label) ?? field.id;
          const option: RelatedRecordsOption = {
            id: getOptionId(config),
            ...config,
            label: $localize`${recordType}:recordType: (linked through "${fieldLabel}:fieldLabel:")`,
            isHierarchy: isHierarchyField(field, entityType.ENTITY_TYPE),
          };
          options.set(option.id, option);
        }
      }
    }

    return [...options.values()].sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * The available options, plus a selection that does not fit the record types anymore:
   * the dropdown only displays a selection that is among its options.
   */
  private getSelectableOptions(
    config: TemplateExportRelatedRecords,
    optionId: string | undefined,
    option: RelatedRecordsOption | undefined,
  ): RelatedRecordsOption[] {
    if (!optionId || option) {
      return this.options();
    }

    const unavailable: RelatedRecordsOption = {
      id: optionId,
      entityType: config.entityType,
      property: config.property,
      label: $localize`${config.entityType}:entityType:.${config.property}:field: (not available)`,
      isHierarchy: false,
      isInvalid: true,
    };
    return [unavailable, ...this.options()];
  }

  private getExamples(
    config: TemplateExportRelatedRecords,
    option: RelatedRecordsOption | undefined,
    levels: number,
  ): string[] {
    if (!option) {
      return [];
    }

    const field = getExampleField(this.entityRegistry.get(option.entityType));
    const record = this.isArrayReport() ? "d[i]" : "d";
    const list = `${getRelatedRecordsPlaceholder(config)}[i]`;
    return Array.from(
      { length: levels },
      (_, level) =>
        `{${[record, ...Array(level + 1).fill(list)].join(".")}.${field}}`,
    );
  }

  /**
   * Prevent saving a config that cannot be applied when generating a file.
   * (The options follow the record types selected in the form, see `ngOnInit`.)
   */
  private readonly validateRelatedRecords = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const configs: TemplateExportRelatedRecords[] = asArray(
      control.value ?? [],
    );
    const errorMessage = this.getErrorMessage(configs);

    return errorMessage ? { relatedRecords: { errorMessage } } : null;
  };

  private getErrorMessage(
    configs: TemplateExportRelatedRecords[],
  ): string | undefined {
    const availableOptions = new Set(this.options().map((option) => option.id));
    const selected = new Set<string>();

    for (const config of configs) {
      const optionId = getOptionId(config);
      if (!optionId) {
        return $localize`Select related records for each entry, or remove it.`;
      }
      if (!availableOptions.has(optionId)) {
        return $localize`Some related records do not link to the applicable record types.`;
      }
      if (selected.has(optionId)) {
        return $localize`The same related records are included more than once.`;
      }
      selected.add(optionId);
    }
    return undefined;
  }
}

/**
 * A field of the given record type to show in an example placeholder:
 * preferably one that the record type's display text is built from.
 */
function getExampleField(entityType: EntityConstructor): string {
  const schema = entityType.schema;
  return (
    entityType.toStringAttributes?.find((attr) => schema.has(attr)) ??
    [...schema.entries()].find(([, field]) => !!field.label)?.[0] ??
    "_id"
  );
}
