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
import {
  MatFormFieldControl,
  MatFormFieldModule,
} from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";
import { asArray } from "#src/app/utils/asArray";
import {
  getRelatedRecordsLevels,
  isFieldLinkingToType,
  RELATED_RECORDS_KEY_PATTERN,
  RELATED_RECORDS_PROPERTY,
  RELATED_RECORDS_MAX_LEVELS,
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
 * (e.g. the sub-tasks of a task) and under which placeholder name.
 */
@DynamicComponent("EditTemplateExportRelatedRecords")
@Component({
  selector: "app-edit-template-export-related-records",
  templateUrl: "./edit-template-export-related-records.component.html",
  styleUrl: "./edit-template-export-related-records.component.scss",
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
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
        levels,
        examples: this.getExamples(config, option, levels),
      };
    }),
  );

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
      { key: "", entityType: "", property: "" },
    ]);
  }

  removeRow(index: number) {
    this.updateValue(this.currentValue().filter((_, i) => i !== index));
  }

  selectOption(index: number, optionId: string) {
    const option = this.options().find((o) => o.id === optionId);
    if (!option) {
      return;
    }

    this.updateRow(index, (config) => {
      const updated: TemplateExportRelatedRecords = {
        key: config.key || this.suggestKey(option),
        entityType: option.entityType,
        property: option.property,
      };
      if (option.isHierarchy && config.levels > 1) {
        updated.levels = config.levels;
      }
      return updated;
    });
  }

  /**
   * @returns the placeholder name as saved, to show in the input
   * (the input keeps the entered text if the saved value does not change)
   */
  setKey(index: number, value: string): string {
    const key = value.trim();
    this.updateRow(index, (config) => ({ ...config, key }));
    return key;
  }

  /**
   * @returns the number of levels as saved (limited to the supported range), to show in the input
   * (the input keeps the entered number if the saved value does not change)
   */
  setLevels(index: number, value: string): number {
    const levels = Math.min(
      Math.max(Math.floor(Number(value)) || 1, 1),
      RELATED_RECORDS_MAX_LEVELS,
    );
    this.updateRow(index, (config) => {
      const { levels: _previous, ...updated } = config;
      return levels > 1 ? { ...updated, levels } : updated;
    });
    return levels;
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

  /** the options of the record types last asked for, as the validator asks on every change */
  private optionsCache?: { types: string; options: RelatedRecordsOption[] };

  private getOptions(applicableTypes: string[]): RelatedRecordsOption[] {
    const types = applicableTypes.join();
    if (this.optionsCache?.types !== types) {
      this.optionsCache = { types, options: this.findOptions(applicableTypes) };
    }
    return this.optionsCache.options;
  }

  private findOptions(applicableTypes: string[]): RelatedRecordsOption[] {
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
          if (!isFieldLinkingToType(field, type)) {
            continue;
          }
          const option: RelatedRecordsOption = {
            id: getOptionId({
              entityType: entityType.ENTITY_TYPE,
              property: field.id,
            }),
            entityType: entityType.ENTITY_TYPE,
            property: field.id,
            label: $localize`:option to include related records, e.g. 'Tasks (linked through "Parent task")':${entityType.labelPlural ?? entityType.label}:recordType: (linked through "${field.label ?? field.id}:fieldLabel:")`,
            isHierarchy: isFieldLinkingToType(field, entityType.ENTITY_TYPE),
          };
          options.set(option.id, option);
        }
      }
    }

    return [...options.values()].sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * A placeholder name for the option that is not in use yet.
   */
  private suggestKey(option: RelatedRecordsOption): string {
    // already under `_related` in the placeholder, so the record type alone (e.g. "todo") reads best
    const type = option.entityType.replace(/[^A-Za-z0-9_]/g, "");
    const base = type.charAt(0).toLowerCase() + type.slice(1);
    const usedKeys = new Set(this.currentValue().map((config) => config.key));

    let key = base;
    for (let i = 2; usedKeys.has(key); i++) {
      key = base + i;
    }
    return key;
  }

  private getExamples(
    config: TemplateExportRelatedRecords,
    option: RelatedRecordsOption | undefined,
    levels: number,
  ): string[] {
    if (!option || !RELATED_RECORDS_KEY_PATTERN.test(config.key ?? "")) {
      return [];
    }

    const field = getExampleField(this.entityRegistry.get(option.entityType));
    const list = `${RELATED_RECORDS_PROPERTY}.${config.key}[i]`;
    return Array.from(
      { length: levels },
      (_, level) =>
        `{d.${Array(level + 1)
          .fill(list)
          .join(".")}.${field}}`,
    );
  }

  /**
   * Prevent saving a config that cannot be applied when generating a file.
   * Reads the record types from the control's parent, so it does not depend on this component's state.
   */
  private readonly validateRelatedRecords = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const configs: TemplateExportRelatedRecords[] = asArray(
      control.value ?? [],
    );
    const applicableTypes: string[] = asArray(
      control.parent?.get("applicableForEntityTypes")?.value ?? [],
    );
    const errorMessage = this.getErrorMessage(configs, applicableTypes);

    return errorMessage ? { relatedRecords: { errorMessage } } : null;
  };

  private getErrorMessage(
    configs: TemplateExportRelatedRecords[],
    applicableTypes: string[],
  ): string | undefined {
    const availableOptions = new Set(
      this.getOptions(applicableTypes).map((option) => option.id),
    );
    const keys = new Set<string>();

    for (const config of configs) {
      if (!getOptionId(config) || !config.key) {
        return $localize`Select related records and a placeholder name for each entry, or remove it.`;
      }
      if (!availableOptions.has(getOptionId(config))) {
        return $localize`Some related records do not link to the applicable record types.`;
      }
      if (!RELATED_RECORDS_KEY_PATTERN.test(config.key)) {
        return $localize`Placeholder name "${config.key}:name:" must start with a letter and only contain letters, digits and underscores.`;
      }
      if (keys.has(config.key)) {
        return $localize`Placeholder name "${config.key}:name:" is used more than once.`;
      }
      keys.add(config.key);
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
