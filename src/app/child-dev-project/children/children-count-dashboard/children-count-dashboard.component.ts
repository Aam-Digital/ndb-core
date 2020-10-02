import { Component, OnInit } from "@angular/core";
import { ChildrenService } from "../children.service";
import { Router } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DashboardWidgetComponent } from "app/child-dev-project/dashboard/dashboard-widget.component";
import { DashboardWidgetConfig } from "app/child-dev-project/dashboard/dashboard-widget-config.interface";

@UntilDestroy()
@Component({
  selector: "app-children-count-dashboard",
  templateUrl: "./children-count-dashboard.component.html",
  styleUrls: ["./children-count-dashboard.component.scss"],
})
export class ChildrenCountDashboardComponent
  implements DashboardWidgetComponent, OnInit {
  totalChildren: number;
  childrenByCenter = [];

  constructor(
    private childrenService: ChildrenService,
    public router: Router
  ) {}

  initFromConfig(config: DashboardWidgetConfig) {}

  ngOnInit() {
    this.childrenService
      .getChildren()
      .pipe(untilDestroyed(this))
      .subscribe((results) => {
        this.totalChildren = 0;

        const countMap = new Map<string, number>();
        results.forEach((child) => {
          if (child.isActive()) {
            let count = countMap.get(child.center);
            if (count === undefined) {
              count = 0;
            }

            count++;
            this.totalChildren++;
            countMap.set(child.center, count);
          }
        });
        this.childrenByCenter = Array.from(countMap.entries()); // direct use of Map creates change detection problems
      });
  }

  goToChildrenList(filterString: string) {
    this.router.navigate(["/child"], {
      queryParams: { center: filterString.toLocaleLowerCase() },
    });
  }
}
