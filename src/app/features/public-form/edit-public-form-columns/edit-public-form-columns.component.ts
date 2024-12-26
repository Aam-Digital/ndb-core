import { Component, inject, OnInit } from "@angular/core";
import { EditComponent } from "app/core/entity/default-datatype/edit-component";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";

import { EntityConstructor } from "app/core/entity/model/entity";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { AdminEntityFormComponent } from "app/core/admin/admin-entity-details/admin-entity-form/admin-entity-form.component";
import { FormConfig } from "app/core/entity-details/form/form.component";
import { FieldGroup } from "app/core/entity-details/form/field-group";

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

  private entities = inject(EntityRegistry);

  override ngOnInit(): void {
    if (this.entity) {
      this.entityConstructor = this.entities.get(this.entity["entity"]);

      this.publicFormConfig = this.migrateConfig({
        fieldGroups: this.formControl.getRawValue(),
      });
    }
  }

  /**
   * Migrates the configuration if it uses the old structure.
   */
  private migrateConfig(config: FormConfig): FormConfig {
    if (
      Array.isArray(config.fieldGroups) &&
      config.fieldGroups.every((column) => Array.isArray(column))
    ) {
      const fields = config.fieldGroups.flat();
      return { fieldGroups: [{ fields }] };
    }
    // Return the original config if no migration is needed
    return config;
  }

  updateValue(newConfig: FormConfig) {
    setTimeout(() => this.formControl.setValue(newConfig.fieldGroups));
    this.formControl.markAsDirty();
  }
}
