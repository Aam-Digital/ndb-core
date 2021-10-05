import { Component } from "@angular/core";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { ViewComponent } from "../view-component";
import { Entity } from "../../../../entity/model/entity";
import { FormGroup } from "@angular/forms";
import { HealthCheck } from "app/child-dev-project/health-checkup/model/health-check";

@Component({
  selector: "app-readonly-function",
  templateUrl: "./readonly-function.component.html",
  styleUrls: ["./readonly-function.component.scss"],
})
export class ReadonlyFunctionComponent extends ViewComponent {
  displayFunction: (entity: Entity) => any;
  formGroup: FormGroup;
  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.displayFunction = config.config;
    this.formGroup = config.formGroup;
    if (config.formGroup) {
      this.formGroup.valueChanges.subscribe((value) => {
        console.log(value);
        const konstruktor: any = this.entity.getConstructor();
        this.entity = Object.assign(new konstruktor(), value);
        console.log(this.entity);
      })  
    }
}
  }
  
