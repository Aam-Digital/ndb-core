import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { HealthCheck } from "../../health-checkup/model/health-check";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { take } from "rxjs/operators";
import { ChildrenService } from "../children.service";
import { Child } from "../model/child";
import { WarningLevel } from "../../../core/entity/model/warning-level";

interface BmiRow {
  childId: string;
  bmi: number;
}

@Component({
  selector: "app-children-bmi-dashboard",
  templateUrl: "./children-bmi-dashboard.component.html",
  styleUrls: ["./children-bmi-dashboard.component.scss"],
})
export class ChildrenBmiDashboardComponent
  implements OnInit, OnInitDynamicComponent
{
  public currentHealthCheck: HealthCheck;
  bmiRows: BmiRow[] = [];

  constructor(
    private childrenService: ChildrenService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.childrenService
      .getChildren()
      .pipe(take(1))
      .subscribe((results) => {
        this.filterBMI(results);
      });
  }

  onInitFromDynamicConfig(config: any) {}

  recordTrackByFunction = (index, item) => item.childId;

  filterBMI(children: Child[]) {
    children.forEach((child) => {
      this.childrenService
        .getHealthChecksOfChild(child.getId())
        .pipe()
        .subscribe((results) => {
          /** get latest HealthCheck */
          if (results.length > 0) {
            this.currentHealthCheck = results.reduce((prev, cur) =>
              cur.date > prev.date ? cur : prev
            );
            /**Check health status */
            if (
              this.currentHealthCheck.getWarningLevel() === WarningLevel.URGENT
            ) {
              this.bmiRows.push({
                childId: child.getId(),
                bmi: this.currentHealthCheck.bmi,
              });
            }
          }
        });
    });
  }

  goToChild(childId: string) {
    const path = "/" + Child.ENTITY_TYPE.toLowerCase();
    this.router.navigate([path, childId]);
  }
}
