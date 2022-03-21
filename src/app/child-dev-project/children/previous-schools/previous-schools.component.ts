import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { ChildSchoolRelation } from "../model/childSchoolRelation";
import { ChildrenService } from "../children.service";
import { Child } from "../model/child";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
import moment from "moment";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntityMapperService } from "app/core/entity/entity-mapper.service";
import { isActiveIndicator } from "../../schools/children-overview/children-overview.component";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";

@UntilDestroy()
@DynamicComponent("PreviousSchools")
@Component({
  selector: "app-previous-schools",
  templateUrl: "./previous-schools.component.html",
  styleUrls: ["./previous-schools.component.scss"],
})
export class PreviousSchoolsComponent
  implements OnChanges, OnInitDynamicComponent {
  @Input() child: Child;
  records = new Array<ChildSchoolRelation>();
  columns: FormFieldConfig[] = [
    { id: "schoolId" },
    { id: "schoolClass" },
    { id: "start", visibleFrom: "md" },
    { id: "end", visibleFrom: "md" },
    { id: "result" },
    isActiveIndicator,
  ];
  hasCurrentlyActiveEntry: boolean;

  single = true;

  constructor(
    private childrenService: ChildrenService,
    private entityMapperService: EntityMapperService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("child")) {
      this.loadData(this.child.getId());
    }
  }

  onInitFromDynamicConfig(panelConfig: PanelConfig) {
    if (panelConfig.config?.hasOwnProperty("single")) {
      this.single = panelConfig.config.single;
    }
    if (panelConfig.config?.columns) {
      this.columns = panelConfig.config.columns.concat(isActiveIndicator);
    }
    this.child = panelConfig.entity as Child;
    this.loadData(this.child.getId());
    this.subscribeToChildSchoolRelationUpdates();
  }

  async loadData(id: string) {
    if (!this.child.getId() || this.child.getId() === "") {
      return;
    }

    this.records = await this.childrenService.getSchoolRelationsFor(id);
    this.hasCurrentlyActiveEntry = this.records.some(
      (record) => record.isActive
    );
  }

  generateNewRecordFactory() {
    const childId = this.child.getId();
    return () => {
      const newPreviousSchool = new ChildSchoolRelation();
      newPreviousSchool.childId = childId;
      // start is one after the end date of the last relation or today if no other relation exists
      newPreviousSchool.start =
        this.records.length && this.records[0].end
          ? moment(this.records[0].end).add(1, "day").toDate()
          : new Date();
      return newPreviousSchool;
    };
  }

  private subscribeToChildSchoolRelationUpdates() {
    this.entityMapperService
      .receiveUpdates<ChildSchoolRelation>(ChildSchoolRelation)
      .pipe(untilDestroyed(this))
      .subscribe(() => this.loadData(this.child.getId()));
  }
}
