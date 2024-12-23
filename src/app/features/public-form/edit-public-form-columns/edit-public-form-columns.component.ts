import { Component, inject, Input, OnInit } from "@angular/core";
import { EditComponent } from "app/core/entity/default-datatype/edit-component";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";

import { EntityConstructor } from "app/core/entity/model/entity";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { AdminEntityFormComponent } from "app/core/admin/admin-entity-details/admin-entity-form/admin-entity-form.component";
import { FormConfig } from "app/core/entity-details/form/form.component";
import { FieldGroup } from "app/core/entity-details/form/field-group";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Config } from "app/core/config/config";
import { AdminEntityService } from "app/core/admin/admin-entity.service";
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
  private entityMapper = inject(EntityMapperService);
  private adminEntity = inject(AdminEntityService);

  override ngOnInit(): void {
    if (this.entity) {
      this.entityConstructor = this.entities.get(this.entity["entity"]);

      this.publicFormConfig = { fieldGroups: this.formControl.getRawValue() };
    }
  }

  updateValue(newConfig: FormConfig) {
    // setTimeout needed for change detection of disabling tabs
    // TODO: change logic to instead disable tabs upon edit mode immediately (without waiting for changes)
    setTimeout(() => this.formControl.setValue(newConfig.fieldGroups));
    this.formControl.markAsDirty();
    this.updateEntityConfig();
  }

  async updateEntityConfig() {
    const originalConfig = await this.entityMapper.load(
      Config,
      Config.CONFIG_KEY,
    );
    const newEntityConfig = originalConfig.copy();
    this.adminEntity.setEntityConfig(newEntityConfig, this.entityConstructor);
    // Conditional save to prevent unnecessary writes
    if (JSON.stringify(originalConfig) !== JSON.stringify(newEntityConfig)) {
      await this.entityMapper.save(newEntityConfig);
    }
  }
}
