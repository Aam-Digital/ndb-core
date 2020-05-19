import { Component, OnInit } from "@angular/core";
import { ChildrenService } from "../children.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-children-count-dashboard",
  templateUrl: "./children-count-dashboard.component.html",
  styleUrls: ["./children-count-dashboard.component.scss"],
})
export class ChildrenCountDashboardComponent implements OnInit {
  totalChildren: number;
  childrenByCenter = [];

  constructor(
    private childrenService: ChildrenService,
    public router: Router
  ) {}

  ngOnInit() {
    this.childrenService.getChildren().subscribe((results) => {
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
