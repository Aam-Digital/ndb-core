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
@Component({
  selector: "app-edit-public-form-columns",
  standalone: true,
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
  publicFormConfig: FormConfig;
  private originalEntitySchemaFields: [string, EntitySchemaField][];

  private entities = inject(EntityRegistry);
  private adminEntityService = inject(AdminEntityService);

  override ngOnInit(): void {
    if (this.entity) {
      this.entityConstructor = this.entities.get(this.entity["entity"]);

      this.publicFormConfig = { fieldGroups: this.formControl.getRawValue() };
    }

    this.originalEntitySchemaFields = JSON.parse(
      JSON.stringify(Array.from(this.entityConstructor.schema.entries())),
    );

    this.entityForm.onFormStateChange.subscribe((event) => {
      if (event === "saved")
        this.adminEntityService.setAndSaveEntityConfig(this.entityConstructor);
      if (event === "cancelled")
        this.entityConstructor.schema = new Map(
          this.originalEntitySchemaFields,
        );
    });
  }

  updateValue(newConfig: FormConfig) {
    // setTimeout needed for change detection of disabling tabs
    // TODO: change logic to instead disable tabs upon edit mode immediately (without waiting for changes)
    setTimeout(() => this.formControl.setValue(newConfig.fieldGroups));
    this.formControl.markAsDirty();
  }
}
