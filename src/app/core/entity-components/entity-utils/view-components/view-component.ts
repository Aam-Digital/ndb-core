import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { ViewPropertyConfig } from "../../entity-list/EntityListConfig";
import { Entity } from "../../../entity/model/entity";
import { Directive, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";

@Directive()
export abstract class ViewComponent implements OnInitDynamicComponent {
  @Input() entity: Entity;
  property: string;
  tooltip: string;
  formGroup: FormGroup;
  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    this.entity = config.entity;
    this.property = config.id;
    this.tooltip = config.tooltip;
    if (config.formGroup) {
      this.formGroup = config.formGroup;
      this.formGroup.valueChanges.subscribe((value) => {
        const dynamicConstructor: any = this.entity.getConstructor();
        this.entity = Object.assign(new dynamicConstructor(), value);
      })  
    }
  }
}
