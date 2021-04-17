import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";
import { ChildrenService } from "../children/children.service";
import moment from "moment";
import { Child } from "../children/model/child";
import { OnInitDynamicComponent } from "../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ColumnDescriptionInputType } from "../../core/entity-components/entity-subrecord/column-description-input-type.enum";
import { ColumnDescription } from "../../core/entity-components/entity-subrecord/column-description";
import { PanelConfig } from "../../core/entity-components/entity-details/EntityDetailsConfig";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { School } from "../schools/model/school";

/**
 * @deprecated Use PreviousSchoolsComponent with its configuration options instead
 */
@Component({
  selector: "app-previous-schools",
  templateUrl: "./previous-teams.component.html",
})
export class PreviousTeamsComponent
  implements OnInit, OnChanges, OnInitDynamicComponent {
  @Input() child: Child;
  @Output() changedRecordInEntitySubrecord = new EventEmitter<any>();
  records = new Array<ChildSchoolRelation>();
  columns = new Array<ColumnDescription>();

  constructor(
    private childrenService: ChildrenService,
    private entityMapper: EntityMapperService
  ) {}

  ngOnInit() {
    this.initColumnDefinitions();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("child")) {
      this.loadData(this.child.getId());
    }
  }

  onInitFromDynamicConfig(config: PanelConfig) {
    this.child = config.entity as Child;
    this.loadData(this.child.getId());
  }

  async loadData(id: string) {
    if (!this.child.getId() || this.child.getId() === "") {
      return;
    }

    this.records = await this.childrenService.getSchoolsWithRelations(id);
  }

  private async initColumnDefinitions() {
    const teams = await this.entityMapper.loadType(School);
    const teamsMap = {};
    teams.forEach((s) => (teamsMap[s.getId()] = s.name));

    this.columns = [
      {
        name: "schoolId",
        label: $localize`:School-team:Team`,
        inputType: ColumnDescriptionInputType.SELECT,
        selectValues: teams.map((t) => {
          return { value: t.getId(), label: t.name };
        }),
        valueFunction: (entity: ChildSchoolRelation) =>
          teamsMap[entity["schoolId"]],
      },
      {
        name: "start",
        label: $localize`:Date from:From`,
        inputType: ColumnDescriptionInputType.DATE,
      },
      {
        name: "end",
        label: $localize`:Date to:To`,
        inputType: ColumnDescriptionInputType.DATE,
      },
    ];
  }

  generateNewRecordFactory() {
    const childId = this.child.getId();
    return () => {
      const newPreviousSchool = new ChildSchoolRelation();
      newPreviousSchool.childId = childId;
      // last to-date (of first entry in records); if the first entry doesn't have any to-date, lastToDate is set to yesterday
      const lastToDate =
        this.records.length && this.records[0].end
          ? new Date(this.records[0].end)
          : new Date(new Date().setDate(new Date().getDate() + -1));
      newPreviousSchool.start = new Date(
        lastToDate.setDate(lastToDate.getDate() + 1)
      ); // one day after last to-date
      newPreviousSchool.end = null; // void date
      return newPreviousSchool;
    };
  }

  formValidation = (record) => {
    const validationResult = {
      hasPassedValidation: false,
      validationMessage: "",
    };
    if (!record.schoolId) {
      validationResult.validationMessage = $localize`"Name" is empty. Please select a team.`;
    } else if (moment(record.start).isAfter(record.end, "days")) {
      validationResult.validationMessage = $localize`"To"-date lies before "From"-date. Please enter correct dates.`;
    } else {
      validationResult.hasPassedValidation = true;
    }
    return validationResult;
  };
}
