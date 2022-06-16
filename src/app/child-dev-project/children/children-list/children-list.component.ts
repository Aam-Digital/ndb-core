import { Component, OnInit, ViewChild } from "@angular/core";
import { Child } from "../model/child";
import { ActivatedRoute, Router } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ChildrenService } from "../children.service";
import { FilterSelectionOption } from "../../../core/filter/filter-selection/filter-selection";
import {
  EntityListConfig,
  PrebuiltFilterConfig,
} from "../../../core/entity-components/entity-list/EntityListConfig";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { School } from "../../schools/model/school";
import { LoggingService } from "../../../core/logging/logging.service";
import { EntityListComponent } from "../../../core/entity-components/entity-list/entity-list.component";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";
import { RouteTarget } from "../../../app.routing";

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
})
export class ChildrenListComponent implements OnInit {
  childrenList: Child[] = [];
  listConfig: EntityListConfig;
  childConstructor = Child;
  @ViewChild(EntityListComponent)
  entityListComponent: EntityListComponent<Child>;
  isLoading: boolean = true;

  constructor(
    private childrenService: ChildrenService,
    private entityMapper: EntityMapperService,
    private route: ActivatedRoute,
    private router: Router,
    private log: LoggingService
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
        this.addPrebuiltFilters();
        this.isLoading = false;
      });
  }

  routeTo(route: string) {
    const path = "/" + Child.ENTITY_TYPE.toLowerCase();
    this.router.navigate([path, route]);
  }

  private async addPrebuiltFilters() {
    for (const prebuiltFilter of this.listConfig.filters.filter(
      (filter) => filter.type === "prebuilt"
    )) {
      switch (prebuiltFilter.id) {
        case "school": {
          (prebuiltFilter as PrebuiltFilterConfig<Child>).options = await this.buildSchoolFilter();
          (prebuiltFilter as PrebuiltFilterConfig<Child>).default = "";
          break;
        }
        default: {
          this.log.warn(
            "[ChildrenListComponent] No filter options available for prebuilt filter: " +
              prebuiltFilter.id
          );
          (prebuiltFilter as PrebuiltFilterConfig<Child>).options = [];
        }
      }
    }
    // Triggering the initialization of the filter selections
    this.entityListComponent.ngOnChanges({
      entityList: null,
    });
  }

  private async buildSchoolFilter(): Promise<FilterSelectionOption<Child>[]> {
    const schools: School[] = await this.entityMapper.loadType(School);
    const options: FilterSelectionOption<Child>[] = [
      { key: "", label: $localize`All`, filterFun: () => true },
    ];
    schools.sort((s1, s2) => s1.name.localeCompare(s2.name));
    schools.forEach((school) =>
      options.push({
        key: school.getId(),
        label: school.name,
        filterFun: (c) => c.schoolId === school.getId(),
      })
    );
    return options;
  }
}
