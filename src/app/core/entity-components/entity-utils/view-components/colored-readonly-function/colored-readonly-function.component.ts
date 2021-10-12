import { Component, OnInit } from '@angular/core';
import { ViewComponent } from '../view-component';
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { Entity } from "../../../../entity/model/entity";
import { FormGroup } from "@angular/forms";

@Component({
  selector: 'app-colored-readonly-function',
  templateUrl: './colored-readonly-function.component.html',
  styleUrls: ['./colored-readonly-function.component.scss']
})
export class ColoredReadonlyFunctionComponent extends ViewComponent {
  displayFunction: (entity: Entity) => any;
  formGroup: FormGroup;
  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.displayFunction = config.config;
    this.formGroup = config.formGroup;
    if (config.formGroup) {
      this.formGroup.valueChanges.subscribe((value) => {
        const dynamicConstructor: any = this.entity.getConstructor();
        this.entity = Object.assign(new dynamicConstructor(), value);
      })  
    }
  }

}
