import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";
import { ChildrenService } from "../children/children.service";
import { Child } from "../children/model/child";
import { OnInitDynamicComponent } from "../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../core/entity-components/entity-form/entity-form/FormConfig";
import moment from "moment";

@Component({
  selector: "app-previous-schools",
  templateUrl: "./previous-schools.component.html",
})
export class PreviousSchoolsComponent
  implements OnChanges, OnInitDynamicComponent
{
  @Input() child: Child;
  records = new Array<ChildSchoolRelation>();
  columns: FormFieldConfig[] = [
    { id: "schoolId" },
    { id: "schoolClass" },
    { id: "start" },
    { id: "end" },
    { id: "result" },
  ];
  current: ChildSchoolRelation;

  single = true;

  constructor(private childrenService: ChildrenService) {}

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
    }
    this.child = panelConfig.entity as Child;
    this.loadData(this.child.getId());
  }

  async loadData(id: string) {
    if (!this.child.getId() || this.child.getId() === "") {
      return;
    }

    this.records = await this.childrenService.getSchoolRelationsFor(id);
    this.current = this.records.find((record) => record.isActive);
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
}
