import { Component, inject, OnInit } from "@angular/core";
import { EditComponent } from "app/core/entity/default-datatype/edit-component";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";

import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { AdminEntityFormComponent } from "app/core/admin/admin-entity-details/admin-entity-form/admin-entity-form.component";
@Component({
  selector: "app-edit-public-form-field",
  standalone: true,
  imports: [AdminEntityFormComponent],
  templateUrl: "./edit-public-form-field.component.html",
})
@DynamicComponent("EditPublicFormColumns")
export class EditPublicFormColumnsComponent<T extends Entity = Entity>
  extends EditComponent<T>
  implements OnInit
{
  entityConstructor: EntityConstructor;
  publicConfigDetailsView: any;

  private entities = inject(EntityRegistry);

  override ngOnInit(): void {
    if (this.entity) {
      this.entityConstructor = this.entities.get(this.entity["entity"]);
      if (!this.entity["columns"]) {
        this.entity["columns"] = [];
      }
      const columns = this.entity["columns"];

      this.publicConfigDetailsView = {
        component: "Form",
        config: {
          fieldGroups: columns,
        },
      };
      this.formControl.setValue(this.entity["columns"]);
    }
  }
}
