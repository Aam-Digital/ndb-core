import { Component, Input, OnInit } from "@angular/core";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";
import { AdminEntityComponent } from "app/core/admin/admin-entity/admin-entity.component";
import { AdminEntityDetailsComponent } from "app/core/admin/admin-entity-details/admin-entity-details/admin-entity-details.component";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { RouterLink } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AdminEntityFormComponent } from "app/core/admin/admin-entity-details/admin-entity-form/admin-entity-form.component";
@Component({
  selector: "app-edit-public-form-field",
  standalone: true,
  imports: [
    AdminEntityComponent,
    AdminEntityDetailsComponent,
    RouterLink,
    FontAwesomeModule,
    AdminEntityFormComponent,
  ],
  templateUrl: "./edit-public-form-field.component.html",
})
@DynamicComponent("EditPublicFormField")
export class EditPublicFormFieldComponent<T extends Entity = Entity>
  implements OnInit
{
  entityConstructor: EntityConstructor;
  @Input() entity: T;
  publicConfigDetailsView: any;

  constructor(private entities: EntityRegistry) {}

  ngOnInit(): void {
    if (this.entity) {
      this.entityConstructor = this.entities.get(this.entity["entity"]); // Use the passed entity
    }
console.log(this.entity,"entity")
    if(!this.entity["columns"]){
      this.entity["columns"] = []
    }
    const columns = this.entity?.["columns"];

    this.publicConfigDetailsView = {
      component: "Form",
      config: {
        fieldGroups: columns,
      },
    };
  }
}
