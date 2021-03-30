import { Component, OnInit } from "@angular/core";
import { Child } from "../model/child";
import { ActivatedRoute, Router } from "@angular/router";
import { UntilDestroy } from "@ngneat/until-destroy";
import { ChildrenService } from "../children.service";
import { FilterSelectionOption } from "../../../core/filter/filter-selection/filter-selection";
import {
  EntityListConfig,
  PrebuiltFilterConfig,
} from "../../../core/entity-components/entity-list/EntityListConfig";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { School } from "../../schools/model/school";
import { LoggingService } from "../../../core/logging/logging.service";

@UntilDestroy()
@Component({
  selector: "app-children-list",
  template: `
    <app-entity-list
      [entityList]="childrenList"
      [listConfig]="listConfig"
      [entityConstructor]="childConstructor"
      (elementClick)="routeTo($event.getId())"
      (addNewClick)="routeTo('new')"
    ></app-entity-list>
  `,
})
export class ChildrenListComponent implements OnInit {
  childrenList: Child[] = [];
  listConfig: EntityListConfig;
  childConstructor = Child;

  schoolFS: FilterSelectionOption<Child>[] = [];

  constructor(
    private childrenService: ChildrenService,
    private entityMapper: EntityMapperService,
    private route: ActivatedRoute,
    private router: Router,
    private log: LoggingService
  ) {}

  ngOnInit() {
    this.route.data.subscribe(
      (config: EntityListConfig) => (this.listConfig = config)
    );
    this.childrenService.getChildren().subscribe((children) => {
      this.childrenList = children;
      this.addPrebuiltFilters();
    });
  }

  routeTo(route: string) {
    const path = "/" + Child.ENTITY_TYPE.toLowerCase();
    this.router.navigate([path, route]);
  }

  private addPrebuiltFilters() {
    this.listConfig.filters
      .filter((filter) => filter.type === "prebuilt")
      .forEach(async (filter) => {
        switch (filter.id) {
          case "school": {
            (filter as PrebuiltFilterConfig<Child>).options = await this.buildSchoolFilter();
            (filter as PrebuiltFilterConfig<Child>).default = "";
            return;
          }
          default: {
            this.log.warn(
              "[ChildrenListComponent] No filter options available for prebuilt filter: " +
                filter.id
            );
            (filter as PrebuiltFilterConfig<Child>).options = [];
          }
        }
      });
  }

  private async buildSchoolFilter(): Promise<FilterSelectionOption<Child>[]> {
    const schoolIDs = [...new Set(this.childrenList.map((c) => c.schoolId))];
    const schools: School[] = await Promise.all(
      schoolIDs.map((id) =>
        this.entityMapper.load<School>(School, id).catch(() => null)
      )
    );
    const filters: FilterSelectionOption<Child>[] = schools
      .filter((school) => !!school) // remove schools which are null or undefined
      .map((school) => {
        return {
          key: school.getId(),
          label: school.name,
          filterFun: (c) => c.schoolId === school.getId(),
        };
      });
    filters.push({
      key: "",
      label: $localize`All`,
      filterFun: () => true,
    });
    return filters;
  }
}
