import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from "@angular/core";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";
import { ChildrenService } from "../children/children.service";
import { Child } from "../children/model/child";
import { OnInitDynamicComponent } from "../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../core/entity-components/entity-form/entity-form/FormConfig";
import moment from "moment";
import _ from "lodash";
import { EntityConstructor } from "app/core/entity/model/entity";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntityMapperService } from "app/core/entity/entity-mapper.service";
import { EntitySubrecordComponent } from "app/core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";

@Component({
  selector: "app-previous-schools",
  templateUrl: "./previous-schools.component.html",
})
@UntilDestroy()
export class PreviousSchoolsComponent
  implements OnChanges, OnInitDynamicComponent {
  @Input() child: Child;
  records = new Array<ChildSchoolRelation>();
  readonly isActiveIndicator = {
    id: "isActive",
    label: $localize`:Label for form field, Indicatind whether currenty active:Currently active`,
    view: "ColoredReadonlyFunction",
    hideFromTable: true,
    tooltip: $localize`:Tooltip for the status of currently active or not:Change the start or end date to modify this status`,
    additional: (csr: ChildSchoolRelation) =>
      csr.isActive
        ? $localize`:Indication for the currently active status of an entry:Currently active`
        : $localize`:Indication for the currently inactive status of an entry:Not active`,
  };
  columns: FormFieldConfig[] = [
    { id: "schoolId" },
    { id: "schoolClass" },
    { id: "start" },
    { id: "end" },
    { id: "result" },
    this.isActiveIndicator,
  ];
  hasCurrentlyActiveEntry: boolean;
  @ViewChild(EntitySubrecordComponent)
  entitySubrecord : EntitySubrecordComponent<ChildSchoolRelation>;

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
      this.columns = panelConfig.config.columns;
      this.columns.push(this.isActiveIndicator);
    }
    this.child = panelConfig.entity as Child;
    this.loadData(this.child.getId());
    this.subscribeEntityUpdates(ChildSchoolRelation);
  }

  async loadData(id: string) {
    if (!this.child.getId() || this.child.getId() === "") {
      return;
    }

    this.records = await this.childrenService.getSchoolRelationsFor(id);
    this.hasCurrentlyActiveEntry = _.some(this.records, ['isActive', true]);
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

  private subscribeEntityUpdates(
    entityType: EntityConstructor<ChildSchoolRelation>
  ) {
    this.entityMapperService
      .receiveUpdates<ChildSchoolRelation>(entityType)
      .pipe(untilDestroyed(this))
      .subscribe(async (updatedEntry) => {
        this.loadData(this.child.getId());
      });
  }
}
