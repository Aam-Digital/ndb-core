import { Component, Input, OnInit } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { Child } from "../../children/model/child";
import { School } from "../model/school";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { ChildrenService } from "../../children/children.service";
import { Entity } from "../../../core/entity/model/entity";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgIf } from "@angular/common";
import { EntitySubrecordComponent } from "../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { PillComponent } from "../../../core/common-components/pill/pill.component";
import { RelatedTimePeriodEntitiesComponent } from "../../../core/entity-details/related-time-period-entities/related-time-period-entities.component";

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
    EntitySubrecordComponent,
    MatSlideToggleModule,
    FormsModule,
    MatTooltipModule,
    NgIf,
    PillComponent,
  ],
  standalone: true,
})
export class ChildSchoolOverviewComponent
  extends RelatedTimePeriodEntitiesComponent<ChildSchoolRelation>
  implements OnInit
{
  mode: "child" | "school" = "child";
  @Input() showInactive = false;

  constructor(private childrenService: ChildrenService) {
    super(null, null);

    this.entityCtr = ChildSchoolRelation;
    this.columns = [
      { id: "childId" }, // schoolId/childId replaced dynamically during init
      { id: "start", visibleFrom: "md" },
      { id: "end", visibleFrom: "md" },
      { id: "schoolClass" },
      { id: "result" },
    ];
  }

  async ngOnInit() {
    this.mode = this.inferMode(this.entity);
    this.switchRelatedEntityColumnForMode();

    await this.loadData();
    super.onIsActiveFilterChange(this.showInactive);
  }

  private inferMode(entity: Entity): "child" | "school" {
    switch (entity?.getConstructor()?.ENTITY_TYPE) {
      case Child.ENTITY_TYPE:
        this.property = "childId";
        return "child";
      case School.ENTITY_TYPE:
        this.property = "schoolId";
        return "school";
    }
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

  async loadData() {
    this.isLoading = true;
    this.data = await this.childrenService.queryRelationsOf(
      this.entity.getId(),
    );

    this.isLoading = false;
  }
}
