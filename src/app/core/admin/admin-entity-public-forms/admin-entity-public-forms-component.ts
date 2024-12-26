import { Component, Input, OnInit } from "@angular/core";
import { EntityConstructor } from "app/core/entity/model/entity";
import { DynamicComponentDirective } from "app/core/config/dynamic-components/dynamic-component.directive";

@Component({
  selector: "app-admin-entity-public-forms-component",
  standalone: true,
  templateUrl: "./admin-entity-public-forms-component.html",
  styleUrls: ["./admin-entity-public-forms-component.scss"],
  imports: [DynamicComponentDirective],
})
export class AdminEntityPublicFormsComponent implements OnInit {
  @Input() entityConstructor: EntityConstructor;
  config: Config;

  ngOnInit(): void {
    this.config = {
      component: "RelatedEntities",
      config: {
        entityType: "PublicFormConfig",
        property: this.entityConstructor.ENTITY_TYPE,
        columns: ["title", "entity", "route", "description"],
        filter: {
          entity: this.entityConstructor.ENTITY_TYPE,
        },
      },
    };
  }
}
interface Config {
  component: string;
  config: {
    entityType: string;
    property: string;
    columns: string[];
    filter: {
      entity: string;
    };
  };
}
