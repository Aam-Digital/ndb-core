import { Component, Input, OnInit } from "@angular/core";
import { EntityConstructor } from "app/core/entity/model/entity";
import { DynamicComponentDirective } from "app/core/config/dynamic-components/dynamic-component.directive";

@Component({
  selector: "app-admin-entity-public-forms-component",
  standalone: true,
  templateUrl: "./admin-entity-public-forms-component.html",
  styleUrls: [
    "./admin-entity-public-forms-component.scss",
  ],
  imports: [
    DynamicComponentDirective,
  ],
})
export class AdminEntityPublicFormsComponent implements OnInit {
  @Input() entityConstructor: EntityConstructor;
config: any;

  ngOnInit(): void {
    console.log(this.entityConstructor.ENTITY_TYPE,"chjebciueb")
    this.config =               {
      component: "RelatedEntities",
      config: {
        entityType: "PublicFormConfig",
        property: this.entityConstructor.ENTITY_TYPE,
        columns: [
          "title",
          "description",
          "entity",
          "route"
        ]
      }
    }
  }
 
}
