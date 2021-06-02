import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../EntityDetailsConfig";
import { Entity } from "../../../entity/entity";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { getParentUrl } from "../../../../utils/utils";
import { Router } from "@angular/router";

@Component({
  selector: "app-form",
  template: `<app-entity-form
    [entity]="entity"
    [columns]="columns"
    [creatingNew]="creatingNew"
    (onSave)="routeToEntity($event)"
  ></app-entity-form>`,
})
export class FormComponent implements OnInitDynamicComponent {
  entity: Entity;
  columns: FormFieldConfig[][] = [];
  creatingNew = false;

  constructor(private router: Router) {}

  onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity;
    this.columns = config.config?.cols;
    if (config.creatingNew) {
      this.creatingNew = true;
    }
  }

  routeToEntity(entity: Entity) {
    if (this.creatingNew) {
      this.router.navigate([getParentUrl(this.router), entity.getId()]);
    }
  }
}
