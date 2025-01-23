import { Component, OnInit } from "@angular/core";
import { PouchDatabase } from "../../core/database/pouch-database";
import { ActivatedRoute, Router } from "@angular/router";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { PublicFormConfig } from "./public-form-config";
import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import {
  EntityForm,
  EntityFormService,
} from "../../core/common-components/entity-form/entity-form.service";
import { EntityFormComponent } from "../../core/common-components/entity-form/entity-form/entity-form.component";
import { MatButtonModule } from "@angular/material/button";
import { ConfigService } from "../../core/config/config.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatCardModule } from "@angular/material/card";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { FieldGroup } from "../../core/entity-details/form/field-group";
import { InvalidFormFieldError } from "../../core/common-components/entity-form/invalid-form-field.error";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { DefaultValueConfig } from "../../core/entity/schema/default-value-config";
import { DisplayImgComponent } from "../file/display-img/display-img.component";
import { EntityAbility } from "app/core/permissions/ability/entity-ability";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MarkdownPageModule } from "../markdown-page/markdown-page.module";

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
  standalone: true,
})
export class PublicFormComponent<E extends Entity> implements OnInit {
  private entityType: EntityConstructor<E>;
  formConfig: PublicFormConfig;
  entity: E;
  fieldGroups: FieldGroup[];
  form: EntityForm<E>;
  error: "not_found" | "no_permissions";

  constructor(
    private database: PouchDatabase,
    private route: ActivatedRoute,
    private entities: EntityRegistry,
    private entityMapper: EntityMapperService,
    private entityFormService: EntityFormService,
    private configService: ConfigService,
    private snackbar: MatSnackBar,
    private ability: EntityAbility,
    private router: Router,
  ) {}

  ngOnInit() {
    if (!this.database["pouchDB"]) {
      this.database.initRemoteDB();
    }
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

    const publicForms = await this.entityMapper.loadType(PublicFormConfig);

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
    this.formConfig = migratePublicFormConfig(this.formConfig);
    this.fieldGroups = this.formConfig.columns;
    await this.initForm();
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

  for (let [id, value] of Object.entries(formConfig["prefilled"] ?? [])) {
    const defaultValue: DefaultValueConfig = { mode: "static", value };

    const field: FormFieldConfig = findFieldInFieldGroups(formConfig, id);
    if (!field) {
      // add new field to last column
      const lastColumn: FieldGroup =
        formConfig.columns[formConfig.columns.length - 1];
      lastColumn.fields.push({ id, defaultValue, hideFromForm: true });
    } else {
      field.defaultValue = defaultValue;
    }
  }
  delete formConfig.prefilled;

  return formConfig;
}

function findFieldInFieldGroups(
  formConfig: PublicFormConfig,
  id: string,
): FormFieldConfig {
  for (const column of formConfig.columns) {
    for (const field of column.fields) {
      if (typeof field === "string" && field === id) {
        // replace the string with a field object, so that we can pass by reference
        const newField: FormFieldConfig = { id: field };
        column.fields[column.fields.indexOf(field)] = newField;
        return newField;
      } else if (typeof field === "object" && field.id === id) {
        return field;
      }
    }
  }
  return undefined;
}
