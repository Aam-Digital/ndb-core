import { Component, inject, OnInit } from "@angular/core";
import { EditComponent } from "app/core/entity/default-datatype/edit-component";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";

import { EntityConstructor } from "app/core/entity/model/entity";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { AdminEntityFormComponent } from "app/core/admin/admin-entity-details/admin-entity-form/admin-entity-form.component";
import { FormConfig } from "app/core/entity-details/form/form.component";
import { FieldGroup } from "app/core/entity-details/form/field-group";
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

  private entities = inject(EntityRegistry);

  override ngOnInit() {
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
  }

  updateValue(newConfig: FormConfig) {
    // setTimeout needed for change detection of disabling tabs
    setTimeout(() =>
      this.formControl.setValue(newConfig.fieldGroups, { emitEvent: false }),
    );
    this.formControl.markAsDirty();
  }
}
