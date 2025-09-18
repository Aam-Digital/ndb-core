import { Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { PublicFormConfig } from "./public-form-config";
import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import { EntityFormService } from "../../core/common-components/entity-form/entity-form.service";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFormComponent } from "../../core/common-components/entity-form/entity-form/entity-form.component";
import { MatButtonModule } from "@angular/material/button";
import { ConfigService } from "../../core/config/config.service";
import { MatSnackBar } from "@angular/material/snack-bar";
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
  private snackbar = inject(MatSnackBar);
  private ability = inject(EntityAbility);
  private router = inject(Router);

  private entityType: EntityConstructor<E>;
  formConfig: PublicFormConfig;
  entity: E;
  fieldGroups: FieldGroup[];
  form: EntityForm<E>;
  error: "not_found" | "no_permissions";

  ngOnInit() {
    this.databaseResolver.initDatabasesForAnonymous();

    // wait for config to be initialized
    this.configService.configUpdates
      .pipe(untilDestroyed(this))
      .subscribe(() => this.loadFormConfig());
  }

  async submit() {
    try {
      await this.entityFormService.saveChanges(this.form, this.entity);
      this.router.navigate(["/public-form/submission-success"]);
    } catch (e) {
      if (e instanceof InvalidFormFieldError) {
        this.snackbar.open(
          $localize`Some fields are invalid, please check the form and submit again.`,
        );
        return;
      }
      throw e;
    }
  }

  async reset() {
    await this.initForm();
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

    this.entityType = this.entities.get(
      this.formConfig.entity,
    ) as EntityConstructor<E>;
    if (this.ability.cannot("create", this.entityType)) {
      this.error = "no_permissions";
      return;
    }
    this.fieldGroups = this.formConfig.columns;
    this.handlePrefilledFields();
    this.handleRelatedEntityFields();

    await this.initForm();
  }

  private handlePrefilledFields() {
    if (
      this.formConfig.prefilled &&
      typeof this.formConfig.prefilled === "object"
    ) {
      for (const [fieldId, defaultValue] of Object.entries(
        this.formConfig.prefilled,
      )) {
        this.applyPrefill(fieldId, defaultValue as DefaultValueConfig);
      }
    } else if (Array.isArray(this.formConfig.prefilledFields)) {
      this.formConfig.prefilledFields.forEach((item) => {
        this.applyPrefill(
          item.id,
          item.defaultValue ?? null,
          item.hideFromForm ?? true,
        );
      });
    }
  }

  /**
   * - If field already exists in existing column then only set defaultValue.
   * - If field not found in any existing column then  add to last column hidden by default.
   */
  private applyPrefill(
    fieldId: string,
    defaultValue: DefaultValueConfig,
    hideFromForm?: boolean,
  ) {
    if (!fieldId) return;
    const findField = (field) =>
      field === fieldId || (typeof field === "object" && field.id === fieldId);
    const fieldGroup = this.fieldGroups.find((group) =>
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
      const lastColumn = this.formConfig.columns.at(-1);
      lastColumn?.fields.push({
        id: fieldId,
        defaultValue,
        hideFromForm: hideFromForm ?? true,
      });
    }
  }

  /**
   * Process ALL URL parameters to create prefilled fields, not just configured linked entities.
   * This allows any URL parameter to be used for entity linking without prior configuration.
   * Sebastian's feedback: "all url params are used to prefill"
   */
  private handleRelatedEntityFields() {
    const urlParams = this.route.snapshot?.queryParams || {};

    console.log("🔗 URL Params:", urlParams);
    console.log("🎯 Processing ALL parameters for prefilling");

    const lastColumn = this.formConfig.columns?.at(-1);
    if (!lastColumn) {
      return;
    }

    // Process ALL URL parameters, not just configured ones
    Object.keys(urlParams).forEach((paramKey) => {
      const paramValue = urlParams[paramKey];

      if (paramKey && paramValue) {
        const prefillField: FormFieldConfig = {
          id: paramKey,
          defaultValue: { mode: "static", config: { value: paramValue } },
          hideFromForm: true, // Hide all URL parameter fields by default
        };

        console.log(`✅ Adding prefill field for ${paramKey}:`, paramValue);
        lastColumn.fields.push(prefillField);
      }
    });
  }

  /**
   * Gets all linked entities, supporting both legacy single linkedEntity
   * and new multiple linkedEntities configurations.
   */
  private getLinkedEntities(): FormFieldConfig[] {
    // Priority: use linkedEntities if available, otherwise fall back to single linkedEntity
    if (this.formConfig.linkedEntities?.length) {
      return this.formConfig.linkedEntities.filter((entity) => entity?.id);
    }

    if (this.formConfig.linkedEntity?.id) {
      return [this.formConfig.linkedEntity];
    }

    return [];
  }

  private async initForm() {
    this.entity = new this.entityType();
    this.form = await this.entityFormService.createEntityForm(
      [].concat(...this.fieldGroups.map((group) => group.fields)),
      this.entity,
    );
  }
}

export function migratePublicFormConfig(
  formConfig: PublicFormConfig,
): PublicFormConfig {
  if (formConfig.columns) {
    formConfig.columns = formConfig.columns.map(
      (column: FieldGroup | string[]) => {
        return Array.isArray(column)
          ? { fields: column, header: null }
          : { fields: column.fields || [], header: column?.header || null };
      },
    );
  }
  return formConfig;
}
