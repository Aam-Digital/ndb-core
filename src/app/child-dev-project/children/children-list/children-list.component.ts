import { Component, OnInit } from "@angular/core";
import { Child } from "../model/child";
import { ActivatedRoute, Router } from "@angular/router";
import { UntilDestroy } from "@ngneat/until-destroy";
import { ChildrenService } from "../children.service";
import { FilterSelectionOption } from "../../../core/filter/filter-selection/filter-selection";
import { EntityListConfig } from "../../../core/entity-components/entity-list/EntityListConfig";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { School } from "../../schools/model/school";

@UntilDestroy()
@Component({
  selector: "app-children-list",
  template: `
    <app-entity-list
      [entityList]="childrenList"
      [listConfig]="listConfig"
      (elementClick)="routeTo($event.getId())"
      (addNewClick)="routeTo('new')"
    ></app-entity-list>
  `,
})
export class ChildrenListComponent implements OnInit {
  childrenList: Child[] = [];
  listConfig: EntityListConfig;

  schoolFS: FilterSelectionOption<Child>[] = [];

  constructor(
    private childrenService: ChildrenService,
    private entityMapper: EntityMapperService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.data.subscribe(
      (config: EntityListConfig) => (this.listConfig = config)
    );
    this.childrenService
      .getChildren()
      .subscribe((children) => (this.childrenList = children));
  }

  routeTo(route: string) {
    const path = "/" + Child.ENTITY_TYPE.toLowerCase();
    this.router.navigate([path, route]);
  }

  private buildPrebuiltFilters() {
    this.listConfig.filters.forEach((filter) => {
      if (filter.type === "prebuilt") {
        switch (filter.id) {
          case "school": {
          }
        }
      }
    });
  }

  private async buildSchoolFilter() {
    const schoolIDs = [...new Set(this.childrenList.map((c) => c.schoolId))];
    const schools = await Promise.all(
      schoolIDs.map((id) => this.entityMapper.load<School>(School, id))
    );
    const filters: FilterSelectionOption<Child>[] = schools.map((school) => {
      return {
        key: school.getId(),
        label: school.name,
        filterFun: (c) => c.schoolId === school.getId(),
      };
    });
    filters.push({ key: "", label: "All", filterFun: () => true });
    return filters;
  }
}
