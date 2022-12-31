import { Component, OnInit } from "@angular/core";
import { Child } from "../model/child";
import { ActivatedRoute, Router } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ChildrenService } from "../children.service";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";
import { RouteTarget } from "../../../app.routing";
import { EntityListComponent } from "../../../core/entity-components/entity-list/entity-list.component";

@UntilDestroy()
@RouteTarget("ChildrenList")
@Component({
  selector: "app-children-list",
  template: `
    <app-entity-list
      [allEntities]="childrenList"
      [listConfig]="listConfig"
      [isLoading]="isLoading"
      [entityConstructor]="childConstructor"
      (elementClick)="routeTo($event.getId())"
      (addNewClick)="routeTo('new')"
    ></app-entity-list>
  `,
  standalone: true,
  imports: [EntityListComponent],
})
export class ChildrenListComponent implements OnInit {
  childrenList: Child[] = [];
  listConfig: EntityListConfig;
  childConstructor = Child;
  isLoading = true;

  constructor(
    private childrenService: ChildrenService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.data.subscribe(
      (data: RouteData<EntityListConfig>) => (this.listConfig = data.config)
    );
    this.childrenService
      .getChildren()
      .pipe(untilDestroyed(this))
      .subscribe((children) => {
        this.childrenList = children;
        this.isLoading = false;
      });
  }

  routeTo(route: string) {
    this.router.navigate([Child.route, route]);
  }
}
