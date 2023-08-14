import { Component, Input, OnInit } from "@angular/core";
import { HealthCheck } from "../../health-checkup/model/health-check";
import { ChildrenService } from "../../children.service";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { Child } from "../../model/child";

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
export class BmiBlockComponent implements OnInit {
  @Input() entity: Child;
  currentHealthCheck: HealthCheck;

  constructor(private childrenService: ChildrenService) {}

  ngOnInit() {
    this.childrenService
      .getHealthChecksOfChild(this.entity.getId())
      .then((results) => {
        if (results.length > 0) {
          this.currentHealthCheck = results.reduce((prev, cur) =>
            cur.date > prev.date ? cur : prev,
          );
        }
      });
  }
}
