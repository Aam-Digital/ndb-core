import { Component } from "@angular/core";
import { HealthCheck } from "../../health-checkup/model/health-check";
import { ViewPropertyConfig } from "../../../../core/entity-components/entity-list/EntityListConfig";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ChildrenService } from "../../children.service";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";

@DynamicComponent("BmiBlock")
@Component({
  selector: "app-bmi-block",
  template: `<span
    class="mat-elevation-z1 bmi-block w-{{
      currentHealthCheck?.getWarningLevel()
    }}"
  >
    {{ currentHealthCheck?.bmi.toFixed(2) }}
  </span>`,
  styleUrls: ["./bmi-block.component.scss"],
  standalone: true,
})
export class BmiBlockComponent implements OnInitDynamicComponent {
  public currentHealthCheck: HealthCheck;

  constructor(private childrenService: ChildrenService) {}

  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    this.childrenService
      .getHealthChecksOfChild(config.entity.getId())
      .then((results) => {
        if (results.length > 0) {
          this.currentHealthCheck = results.reduce((prev, cur) =>
            cur.date > prev.date ? cur : prev
          );
        }
      });
  }
}
