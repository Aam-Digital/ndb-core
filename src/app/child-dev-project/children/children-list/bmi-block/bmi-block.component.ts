import { Component } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { HealthCheck } from "app/child-dev-project/health-checkup/model/health-check";
import { ViewPropertyConfig } from "app/core/entity-components/entity-list/EntityListConfig";
import { OnInitDynamicComponent } from "app/core/view/dynamic-components/on-init-dynamic-component.interface";
import { ChildrenService } from "../../children.service";

@UntilDestroy()
@Component({
  selector: "app-bmi-block",
  template: `<span
    class="mat-elevation-z1 attendance-block w-{{
      currentHealthCheck?.getWarningLevel()
    }}"
  >
    {{ currentHealthCheck?.bmi.toFixed(2) }}
  </span>`,
  styleUrls: ["./bmi-block.component.scss"],
})
export class BmiBlockComponent implements OnInitDynamicComponent {
  public currentHealthCheck: HealthCheck;

  constructor(private childrenService: ChildrenService) {}

  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    this.childrenService
      .getHealthChecksOfChild(config.entity.getId())
      .pipe(untilDestroyed(this))
      .subscribe((results) => {
        if (results.length > 0) {
          this.currentHealthCheck = results.reduce((prev, cur) =>
            cur.date > prev.date ? cur : prev
          );
        }
      });
  }
}
