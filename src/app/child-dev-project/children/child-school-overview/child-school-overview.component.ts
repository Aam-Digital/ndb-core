import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { ChildSchoolRelation } from "../model/childSchoolRelation";
import { ChildrenService } from "../children.service";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgIf } from "@angular/common";
import { PillComponent } from "../../../core/common-components/pill/pill.component";
import { RelatedTimePeriodEntitiesComponent } from "../../../core/entity-details/related-time-period-entities/related-time-period-entities.component";
import { EntitiesTableComponent } from "../../../core/common-components/entities-table/entities-table.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { FilterService } from "../../../core/filter/filter.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Sort, MatSort } from "@angular/material/sort";

// TODO: once schema-generated indices are available (#262), remove this component and use its generic super class directly
@DynamicComponent("ChildSchoolOverview")
@DynamicComponent("PreviousSchools")
@DynamicComponent("ChildrenOverview")
@Component({
  selector: "app-child-school-overview",
  templateUrl:
    "../../../core/entity-details/related-time-period-entities/related-time-period-entities.component.html",
  styleUrls: [
    "../../../core/entity-details/related-time-period-entities/related-time-period-entities.component.scss",
  ],
  imports: [
    FontAwesomeModule,
    EntitiesTableComponent,
    MatSlideToggleModule,
    FormsModule,
    MatTooltipModule,
    NgIf,
    PillComponent,
  ],
})
export class ChildSchoolOverviewComponent
  extends RelatedTimePeriodEntitiesComponent<ChildSchoolRelation>
  implements OnInit
{
  mode: "child" | "school" = "child";
  override sortBy?: Sort;
  override entityCtr = ChildSchoolRelation;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private childrenService: ChildrenService,
    private router: Router,
    private route: ActivatedRoute,
    entityMapper: EntityMapperService,
    entityRegistry: EntityRegistry,
    screenWidthObserver: ScreenWidthObserver,
    filterService: FilterService,
  ) {
    super(
      entityMapper,
      entityRegistry,
      screenWidthObserver,
      filterService,
      null,
    );

    this.columns = [
      { id: "childId" }, // schoolId/childId replaced dynamically during init
      { id: "start", visibleFrom: "md" },
      { id: "end", visibleFrom: "md" },
      { id: "schoolClass" },
      { id: "result" },
    ];
  }

  override async ngOnInit(): Promise<void> {
    this.mode = this.entity.getType().toLowerCase() as any;
    this.showInactive = this.mode === "child";
    this.switchRelatedEntityColumnForMode();
  
    const sortBy = this.route.snapshot.queryParams["sortBy"];
    const sortDir = this.route.snapshot.queryParams["sortDir"];
  
    if (sortBy && sortDir) {
      this.sortBy = {
        active: sortBy,
        direction: sortDir as "asc" | "desc",
      };
    }
  
    await super.ngOnInit();
  }

  onSortChange(event: any) {
    if ('active' in event && 'direction' in event) {
      const sort = event as Sort;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          ...this.route.snapshot.queryParams,
          sortBy: sort.active,
          sortDir: sort.direction,
        },
        queryParamsHandling: "merge",
      });
    }
  }

  override getData() {
    return this.childrenService.queryRelations(this.entity.getId(false));
  }

  private switchRelatedEntityColumnForMode() {
    // display the related entity that is *not* the current main entity
    const idColumn = this._columns.find(
      (c) => c.id === "childId" || c.id === "schoolId",
    );
    if (idColumn) {
      idColumn.id = this.mode === "child" ? "schoolId" : "childId";
    }
  }
}
