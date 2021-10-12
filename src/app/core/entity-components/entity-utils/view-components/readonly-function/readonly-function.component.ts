import { Component, Input } from "@angular/core";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { ViewComponent } from "../view-component";
import { Entity } from "../../../../entity/model/entity";
import { FormGroup } from "@angular/forms";

@Component({
  selector: "app-readonly-function",
  templateUrl: "./readonly-function.component.html",
  styleUrls: ["./readonly-function.component.scss"],
})

export class ReadonlyFunctionComponent extends ViewComponent {
  @Input() displayFunction: (entity: Entity) => any;
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
  
