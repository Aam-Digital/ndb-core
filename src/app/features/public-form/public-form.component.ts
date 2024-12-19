import { Component, OnInit } from "@angular/core";
import { PouchDatabase } from "../../core/database/pouch-database";
import { ActivatedRoute } from "@angular/router";
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
  ],
  standalone: true,
})
export class PublicFormComponent<E extends Entity> implements OnInit {
  private entityType: EntityConstructor<E>;
  formConfig: PublicFormConfig;
  entity: E;
  fieldGroups: FieldGroup[];
  form: EntityForm<E>;
  publicFormNotFound: { title: string; error: string } = null;

  constructor(
    private database: PouchDatabase,
    private route: ActivatedRoute,
    private entities: EntityRegistry,
    private entityMapper: EntityMapperService,
    private entityFormService: EntityFormService,
    private configService: ConfigService,
    private snackbar: MatSnackBar,
    private ability: EntityAbility,
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
      await this.entityFormService.saveChanges(
        this.form.formGroup,
        this.entity,
      );
      this.snackbar.open($localize`Successfully submitted form`);
    } catch (e) {
      if (e instanceof InvalidFormFieldError) {
        this.snackbar.open(
          $localize`Some fields are invalid, please check the form and submit again.`,
        );
        return;
      }
      throw e;
    }

    await this.initForm();
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
      this.publicFormNotFound = {
        title: $localize`Public Form Not Found`,
        error: $localize`The form you are looking for is either unavailable or doesn't exist. Please check the link and try again.`,
      };
      return;
    }

    this.entityType = this.entities.get(
      this.formConfig.entity,
    ) as EntityConstructor<E>;
    if (this.ability.cannot("create", this.entityType)) {
      this.publicFormNotFound = {
        title: $localize`Access Denied to Public Form - ${this.formConfig.title}`,
        error: $localize`Unfortunately, access has been denied due to insufficient permissions to access this Public Form. Please contact your system administrator.`,
      };
      return;
    }
    this.formConfig = this.migratePublicFormConfig(this.formConfig);
    this.fieldGroups = this.formConfig.columns;
    await this.initForm();
  }

  private migratePublicFormConfig(
    formConfig: PublicFormConfig,
  ): PublicFormConfig {
    if (formConfig.columns) {
      formConfig.columns = formConfig.columns.map(
        (column: FieldGroup | string[]) => ({
          fields: Array.isArray(column) ? column : column.fields || [],
        }),
      );
    }

    for (let [id, value] of Object.entries(formConfig["prefilled"] ?? [])) {
      const defaultValue: DefaultValueConfig = { mode: "static", value };

      const field: FormFieldConfig = this.findFieldInFieldGroups(id);
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

  private findFieldInFieldGroups(id: string): FormFieldConfig {
    for (const column of this.formConfig.columns) {
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

  private async initForm() {
    this.entity = new this.entityType();
    this.form = await this.entityFormService.createEntityForm(
      [].concat(...this.fieldGroups.map((group) => group.fields)),
      this.entity,
    );
  }
}
