import { Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import {
  PublicFormConfig,
  PublicFormEntityFormConfig,
} from "./public-form-config";
import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import { EntityFormService } from "../../core/common-components/entity-form/entity-form.service";
import { EntityFormComponent } from "../../core/common-components/entity-form/entity-form/entity-form.component";
import { MatButtonModule } from "@angular/material/button";
import { ConfigService } from "../../core/config/config.service";
import { MatCardModule } from "@angular/material/card";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { FieldGroup } from "../../core/entity-details/form/field-group";
import { InvalidFormFieldError } from "../../core/common-components/entity-form/invalid-form-field.error";
import {
  FormFieldConfig,
  toFormFieldConfig,
} from "app/core/common-components/entity-form/FormConfig";
import { DefaultValueConfig } from "../../core/default-values/default-value-config";
import { DisplayImgComponent } from "../file/display-img/display-img.component";
import { EntityAbility } from "app/core/permissions/ability/entity-ability";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MarkdownPageModule } from "../markdown-page/markdown-page.module";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";
import {
  PublicFormEntry,
  PublicFormLinkingService,
} from "./public-form-linking.service";
import { UpdateMetadata } from "../../core/entity/model/update-metadata";

@UntilDestroy()
@Component({
  selector: "app-public-form",
  templateUrl: "./public-form.component.html",
  styleUrls: ["./public-form.component.scss"],
  imports: [
    EntityFormComponent,
    MatButtonModule,
    MatCardModule,
    DisplayImgComponent,
    FontAwesomeModule,
    MarkdownPageModule,
  ],
})
export class PublicFormComponent<E extends Entity> implements OnInit {
  private databaseResolver = inject(DatabaseResolverService);
  private route = inject(ActivatedRoute);
  private entities = inject(EntityRegistry);
  private entityMapper = inject(EntityMapperService);
  private entityFormService = inject(EntityFormService);
  private configService = inject(ConfigService);
  private readonly publicFormLinkingService = inject(PublicFormLinkingService);

  private ability = inject(EntityAbility);
  private router = inject(Router);

  formConfig: PublicFormConfig;
  entityFormEntries: Array<
    PublicFormEntry & {
      config: PublicFormEntityFormConfig;
      entityType: EntityConstructor<Entity>;
      fieldGroups: FieldGroup[];
    }
  > = [];
  error: "not_found" | "no_permissions";
  validationError = false;
  invalidFieldNames: string[] = [];

  ngOnInit() {
    this.databaseResolver.initDatabasesForAnonymous();

    // wait for config to be initialized
    this.configService.configUpdates
      .pipe(untilDestroyed(this))
      .subscribe(() => this.loadFormConfig());
  }

  async submit() {
    this.clearValidationState();
    const formMetadataBy = `PublicForm:${this.formConfig.getId(true)}`;
    this.publicFormLinkingService.applyLinkedFromForm(this.entityFormEntries);
    if (this.hasInvalidForms()) {
      this.markAllFormsAsTouched();
      // Collect invalid field names for summary message
      this.validationError = true;
      this.invalidFieldNames = this.collectInvalidFieldNames();
      return;
    }
    try {
      for (const entry of this.entityFormEntries) {
        entry.entity.created = new UpdateMetadata(formMetadataBy);
        await this.entityFormService.saveChanges(entry.form, entry.entity);
      }
      this.router.navigate(["/public-form/submission-success"], {
        queryParams: {
          showSubmitAnotherButton:
            this.formConfig?.showSubmitAnotherButton !== false,
        },
      });
    } catch (e) {
      if (e instanceof InvalidFormFieldError) {
        this.markAllFormsAsTouched();
        // Collect invalid field names for summary message
        this.validationError = true;
        this.invalidFieldNames = this.collectInvalidFieldNames();
        return;
      }
      throw e;
    }
  }

  async reset() {
    this.clearValidationState();
    await this.initForms();
  }

  private clearValidationState() {
    this.validationError = false;
    this.invalidFieldNames = [];
  }

  private hasInvalidForms(): boolean {
    return this.entityFormEntries.some(
      (entry) => entry.form?.formGroup?.invalid ?? true,
    );
  }

  private markAllFormsAsTouched() {
    this.entityFormEntries.forEach((entry) => {
      entry.form?.formGroup?.markAllAsTouched();
    });
  }

  /**
   * Collects the labels of all invalid fields across all form entries.
   * This provides a summary for forms with many fields where the invalid field might be off-screen.
   */
  private collectInvalidFieldNames(): string[] {
    const invalidNames: string[] = [];

    for (const entry of this.entityFormEntries) {
      if (entry.form?.formGroup?.invalid) {
        const formGroup = entry.form.formGroup;
        const fieldConfigs = entry.form.fieldConfigs;

        for (const control of Object.keys(formGroup.controls)) {
          const formControl = formGroup.get(control);
          if (formControl?.invalid) {
            // Find the field config to get the label
            const fieldConfig = fieldConfigs.find((f) => f.id === control);
            invalidNames.push(fieldConfig?.label || control);
          }
        }
      }
    }

    return [...new Set(invalidNames)];
  }

  private async loadFormConfig() {
    const id = this.route.snapshot.paramMap.get("id");

    const publicForms = (await this.entityMapper.loadType(PublicFormConfig))
      .map((formConfig) => this.configService.applyMigrations(formConfig))
      .map((formConfig) => migratePublicFormConfig(formConfig));

    this.formConfig = publicForms.find(
      (form: PublicFormConfig) => form.route === id || form.getId(true) === id,
    );
    if (!this.formConfig) {
      this.error = "not_found";
      return;
    }

    this.entityFormEntries = this.getEntityFormEntriesConfig().map((config) => {
      const entityType = this.entities.get(
        config.entity,
      ) as EntityConstructor<Entity>;
      return {
        config,
        entityType,
        entity: null,
        fieldGroups: config.columns,
        form: null,
      };
    });

    if (
      this.entityFormEntries.some((entry) =>
        this.ability.cannot("create", entry.entityType),
      )
    ) {
      this.error = "no_permissions";
      return;
    }

    this.entityFormEntries.forEach((entry) => {
      this.handlePrefilledFields(entry.config, entry.fieldGroups);
    });
    this.publicFormLinkingService.handleUrlParameterLinking(
      this.entityFormEntries,
      this.route.snapshot?.queryParams || {},
      this.applyPrefill.bind(this),
    );

    await this.initForms();
  }

  private handlePrefilledFields(
    formConfig: PublicFormEntityFormConfig,
    fieldGroups: FieldGroup[],
  ) {
    if (formConfig.prefilled && typeof formConfig.prefilled === "object") {
      for (const [fieldId, defaultValue] of Object.entries(
        formConfig.prefilled,
      )) {
        this.applyPrefill(
          fieldGroups,
          fieldId,
          defaultValue as DefaultValueConfig,
        );
      }
    }
  }

  /**
   * - If field already exists in existing column then only set defaultValue.
   * - If field not found in any existing column then  add to last column hidden by default.
   */
  private applyPrefill(
    fieldGroups: FieldGroup[],
    fieldId: string,
    defaultValue: DefaultValueConfig,
    hideFromForm?: boolean,
  ) {
    if (!fieldId) return;
    const findField = (field) =>
      field === fieldId || (typeof field === "object" && field.id === fieldId);
    const fieldGroup = fieldGroups.find((group) =>
      group.fields.some(findField),
    );

    if (fieldGroup) {
      const fieldIndex = fieldGroup.fields.findIndex(findField);
      const existingField: FormFieldConfig = toFormFieldConfig(
        fieldGroup.fields[fieldIndex],
      );
      existingField.defaultValue = defaultValue;
      fieldGroup.fields[fieldIndex] = existingField;
    } else {
      const lastColumn = fieldGroups.at(-1);
      lastColumn?.fields.push({
        id: fieldId,
        defaultValue,
        hideFromForm: hideFromForm ?? true,
      });
    }
  }

  private async initForms() {
    for (const entry of this.entityFormEntries) {
      entry.entity = new entry.entityType();
      entry.form = await this.entityFormService.createEntityForm(
        [].concat(...entry.fieldGroups.map((group) => group.fields)),
        entry.entity,
      );

      entry.form.formGroup.valueChanges
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          if (!this.validationError) {
            return;
          }

          if (this.hasInvalidForms()) {
            this.invalidFieldNames = this.collectInvalidFieldNames();
            return;
          }

          this.clearValidationState();
        });
    }
  }

  private getEntityFormEntriesConfig(): PublicFormEntityFormConfig[] {
    if (Array.isArray(this.formConfig.forms) && this.formConfig.forms.length) {
      return this.formConfig.forms;
    }

    return [
      {
        entity: this.formConfig.entity,
        columns: this.formConfig.columns,
        prefilled: this.formConfig.prefilled,
        linkedEntities: this.formConfig.linkedEntities,
      },
    ];
  }
}

export function migratePublicFormConfig(
  formConfig: PublicFormConfig,
): PublicFormConfig {
  const migrateColumns = (columns?: Array<FieldGroup | string[]>) => {
    if (!columns) return columns as FieldGroup[];
    return columns.map((column) => {
      return Array.isArray(column)
        ? { fields: column, header: null }
        : { fields: column.fields || [], header: column?.header || null };
    });
  };

  const migrateLinkedEntities = (linkedEntities: any): string[] | undefined => {
    if (!linkedEntities) return undefined;
    if (Array.isArray(linkedEntities) && linkedEntities.length === 0) {
      return undefined;
    }
    if (
      Array.isArray(linkedEntities) &&
      linkedEntities.every((item) => typeof item === "string")
    ) {
      return linkedEntities;
    }
    // migrate old format (FormFieldConfig[]) to new format (string[])
    if (
      Array.isArray(linkedEntities) &&
      linkedEntities.some((item) => typeof item === "object" && item?.id)
    ) {
      return linkedEntities.map((item) => item.id).filter((id) => id);
    }
    return undefined;
  };

  formConfig.columns = migrateColumns(formConfig.columns) as FieldGroup[];
  formConfig.linkedEntities = migrateLinkedEntities(formConfig.linkedEntities);

  if (Array.isArray(formConfig.forms)) {
    formConfig.forms = formConfig.forms.map((form) => ({
      ...form,
      columns: migrateColumns(form.columns) as FieldGroup[],
      linkedEntities: migrateLinkedEntities(form.linkedEntities),
    }));
  }
  return formConfig;
}
