import { Component, OnInit } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { HealthCheck } from "app/child-dev-project/health-checkup/model/health-check";
import { ColumnCellConfig } from "app/core/entity-components/entity-list/EntityListConfig";
import { OnInitDynamicComponent } from "app/core/view/dynamic-components/on-init-dynamic-component.interface";
import { result } from "lodash";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";

@UntilDestroy()
@Component({
  selector: "app-bmi-block",
  template: `{{ bmiValue }}`,
})
export class BmiBlockComponent implements OnInitDynamicComponent {
  public bmiValue: string;
  child: Child;
  records = new Array<HealthCheck>();

  constructor(private childrenService: ChildrenService) {}

  onInitFromDynamicConfig(config: ColumnCellConfig) {
    if (config.hasOwnProperty("entity")) {
      this.child = config.entity as Child;
      console.log(this.child.getId());
      this.childrenService
        .getHealthChecksOfChild(this.child.getId())
        .pipe(untilDestroyed(this))
        .subscribe((results) => {
          this.records = results.sort(
            (a, b) =>
              (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0)
          );
          console.log(this.records);
          if (this.records.length > 1) {
            this.bmiValue = this.records[0].bmi.toFixed(2);
          }
        });
    }
  }
}
