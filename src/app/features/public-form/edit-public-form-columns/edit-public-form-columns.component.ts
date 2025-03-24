import { Component, inject, OnInit } from "@angular/core";
import { EditComponent } from "app/core/entity/default-datatype/edit-component";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";

import { EntityConstructor } from "app/core/entity/model/entity";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { AdminEntityFormComponent } from "app/core/admin/admin-entity-details/admin-entity-form/admin-entity-form.component";
import { FormConfig } from "app/core/entity-details/form/form.component";
import { FieldGroup } from "app/core/entity-details/form/field-group";
import { AdminEntityService } from "app/core/admin/admin-entity.service";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { PublicFormConfig } from "../public-form-config";
import { migratePublicFormConfig } from "../public-form.component";

@Component({
  selector: "app-edit-public-form-columns",
  imports: [AdminEntityFormComponent],
  templateUrl: "./edit-public-form-columns.component.html",
  styleUrl: "./edit-public-form-columns.component.scss",
})
@DynamicComponent("EditPublicFormColumns")
export class EditPublicFormColumnsComponent
  extends EditComponent<FieldGroup[]>
  implements OnInit
{
  entityConstructor: EntityConstructor;
  formConfig: FormConfig;
  private originalEntitySchemaFields: [string, EntitySchemaField][];

  private entities = inject(EntityRegistry);
  private adminEntityService = inject(AdminEntityService);

  override ngOnInit(): void {
    if (this.entity) {
      this.entityConstructor = this.entities.get(this.entity["entity"]);

      const publicFormConfig: PublicFormConfig = migratePublicFormConfig({
        columns: this.formControl.getRawValue(),
      } as Partial<PublicFormConfig> as PublicFormConfig);
      this.formConfig = {
        fieldGroups: publicFormConfig.columns,
      };
      this.formControl.valueChanges.subscribe(
        (v) => (this.formConfig = { fieldGroups: v }),
      );
    }

    this.originalEntitySchemaFields = JSON.parse(
      JSON.stringify(Array.from(this.entityConstructor.schema.entries())),
    );
    if (this.entityForm) {
      this.entityForm.onFormStateChange.subscribe((event) => {
        if (event === "saved")
          this.adminEntityService.setAndSaveEntityConfig(
            this.entityConstructor,
          );
        if (event === "cancelled")
          this.entityConstructor.schema = new Map(
            this.originalEntitySchemaFields,
          );
      });
    }
  }

  updateValue(newConfig: FormConfig) {
    // setTimeout needed for change detection of disabling tabs
    setTimeout(() => this.formControl.setValue(newConfig.fieldGroups));
    this.formControl.markAsDirty();
  }
}
