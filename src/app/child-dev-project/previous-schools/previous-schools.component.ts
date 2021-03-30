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
import { SchoolsService } from "../schools/schools.service";
import moment from "moment";
import { Child } from "../children/model/child";
import { OnInitDynamicComponent } from "../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ColumnDescriptionInputType } from "../../core/entity-components/entity-subrecord/column-description-input-type.enum";
import { ColumnDescription } from "../../core/entity-components/entity-subrecord/column-description";
import { PanelConfig } from "../../core/entity-components/entity-details/EntityDetailsConfig";

@Component({
  selector: "app-previous-schools",
  templateUrl: "./previous-schools.component.html",
})
export class PreviousSchoolsComponent
  implements OnInit, OnChanges, OnInitDynamicComponent {
  /**
   * returns a css-compatible color value from green to red using the given
   * input value
   * @param percent The percentage from 0-100 (both inclusive). 0 will be completely red, 100 will be completely green
   * Everything between will have suitable colors (orange, yellow,...)
   * If the color is NaN, the color will be a light grey
   */
  private static fromPercent(percent: number): string {
    if (Number.isNaN(percent)) {
      return "rgba(130,130,130,0.4)";
    }
    // the hsv color-value is to be between 0 (red) and 120 (green)
    // percent is between 0-100, so we have to normalize it first
    const color = (percent / 100) * 120;
    return "hsl(" + color + ", 100%, 85%)";
  }

  @Input() child: Child;
  @Output() changedRecordInEntitySubrecord = new EventEmitter<any>();
  records = new Array<ChildSchoolRelation>();
  columns = new Array<ColumnDescription>();

  constructor(
    private childrenService: ChildrenService,
    private schoolsService: SchoolsService
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
    if (config?.config?.displayedColumns) {
      this.columns = this.columns.filter((c) =>
        config.config.displayedColumns.includes(c.name)
      );
    }

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
    const schools = await this.schoolsService.getSchools().toPromise();
    const schoolMap = {};
    schools.forEach((s) => (schoolMap[s.getId()] = s.name));

    this.columns = [
      {
        name: "schoolId",
        label: $localize`School`,
        inputType: ColumnDescriptionInputType.SELECT,
        selectValues: schools.map((t) => {
          return { value: t.getId(), label: t.name };
        }),
        valueFunction: (entity: ChildSchoolRelation) =>
          schoolMap[entity["schoolId"]],
      },

      {
        name: "schoolClass",
        label: $localize`Class`,
        inputType: ColumnDescriptionInputType.TEXT,
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
      {
        name: "result",
        label: $localize`:How good a student performed at a school:Result`,
        inputType: ColumnDescriptionInputType.NUMBER,
        valueFunction: (entity: ChildSchoolRelation) =>
          entity.result >= 0 && !Number.isNaN(entity.result)
            ? entity.result + "%"
            : $localize`:Not applicable:N/A`,
        styleBuilder: this.resultColorStyleBuilder,
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
      newPreviousSchool.result = Number.NaN; // NaN represents no data available
      return newPreviousSchool;
    };
  }

  formValidation = (record) => {
    const validationResult = {
      hasPassedValidation: false,
      validationMessage: "",
    };
    if (!record.schoolId) {
      validationResult.validationMessage = $localize`"Name" is empty. Please select a school.`;
    } else if (moment(record.start).isAfter(record.end, "days")) {
      validationResult.validationMessage = $localize`"To"-date lies before "From"-date. Please enter correct dates.`;
    } else if (record.result > 100) {
      validationResult.validationMessage = $localize`Result cannot be greater than 100`;
    } else if (record.result < 0) {
      validationResult.validationMessage = $localize`Result cannot be smaller than 0`;
    } else {
      validationResult.hasPassedValidation = true;
    }
    return validationResult;
  };

  resultColorStyleBuilder(value: number) {
    return {
      "background-color": PreviousSchoolsComponent.fromPercent(value),
      "border-radius": "5%",
      padding: "5px",
      width: "min-content",
    };
  }
}
