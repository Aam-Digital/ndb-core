import { Component, OnInit } from "@angular/core";
import { Child } from "../model/child";
import { ActivatedRoute } from "@angular/router";
import { ChildrenService } from "../children.service";
import { EntityListConfig } from "../../../core/entity-list/EntityListConfig";
import { RouteData } from "../../../core/config/dynamic-routing/view-config.interface";
import { EntityListComponent } from "../../../core/entity-list/entity-list/entity-list.component";
import { RouteTarget } from "../../../route-target";

@RouteTarget("ChildrenList")
@Component({
  selector: "app-children-list",
  template: `
    <app-entity-list
      [allEntities]="childrenList"
      [listConfig]="listConfig"
      [isLoading]="isLoading"
      [entityConstructor]="childConstructor"
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
  ) {}

  async ngOnInit() {
    this.route.data.subscribe(
      // TODO replace this use of route and rely on the RoutedViewComponent instead
      // see  that flattens the config option, assigning individual properties as inputs however, so we can't easily pass on
      (data: RouteData<EntityListConfig>) => (this.listConfig = data.config),
    );
    this.childrenList = await this.childrenService.getChildren();
    this.isLoading = false;
  }
}
