import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";
import { ChildrenService } from "../children/children.service";
import { Child } from "../children/model/child";
import { OnInitDynamicComponent } from "../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../core/entity-components/entity-details/EntityDetailsConfig";
import { School } from "../schools/model/school";
import { FormFieldConfig } from "../../core/entity-components/entity-details/form/FormConfig";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import moment from "moment";
import { ColumnDescription } from "../../core/entity-components/entity-subrecord/column-description";
import { ColumnDescriptionInputType } from "../../core/entity-components/entity-subrecord/column-description-input-type.enum";

@Component({
  selector: "app-previous-schools",
  templateUrl: "./previous-schools.component.html",
})
export class PreviousSchoolsComponent
  implements OnChanges, OnInitDynamicComponent {
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

  schoolNaming: string;

  @Input() child: Child;
  @Output() changedRecordInEntitySubrecord = new EventEmitter<any>();
  records = new Array<ChildSchoolRelation>();
  columns: FormFieldConfig[] = [
    { id: "schoolId" },
    { id: "schoolClass" },
    { id: "start" },
    { id: "end" },
    { id: "result" },
  ];
  current: ChildSchoolRelation;

  schoolMap: Map<string, School>;

  single = true;

  constructor(
    private childrenService: ChildrenService,
    private entityMapper: EntityMapperService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("child")) {
      this.loadData(this.child.getId());
    }
  }

  onInitFromDynamicConfig(panelConfig: PanelConfig) {
    if (panelConfig.config?.single) {
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

    const schools = await this.entityMapper.loadType(School);
    this.schoolMap = new Map(schools.map((school) => [school.getId(), school]));
    this.records = await this.childrenService.getSchoolsWithRelations(id);
    this.current = this.records.find((record) => record.isActive);
  }

  private createColumn(
    id: string,
    label: string,
    type: string
  ): ColumnDescription {
    const column: ColumnDescription = {
      name: id,
      label: label,
      inputType: ColumnDescriptionInputType.TEXT,
    };
    switch (type) {
      case "date":
        column.inputType = ColumnDescriptionInputType.DATE;
        break;
      case "school":
        this.schoolNaming = label;
        column.inputType = ColumnDescriptionInputType.SELECT;
        column.selectValues = new Array(...this.schoolMap.values())
          .sort((s1, s2) => s1.name.localeCompare(s2.name))
          .map((t) => {
            return { value: t.getId(), label: t.name };
          });
        column.valueFunction = (entity: ChildSchoolRelation) =>
          this.schoolMap.get(entity["schoolId"]).name;
        break;
      case "percentageResult":
        column.inputType = ColumnDescriptionInputType.NUMBER;
        column.valueFunction = (entity: ChildSchoolRelation) =>
          entity.result >= 0 && !Number.isNaN(entity.result)
            ? entity.result + "%"
            : "N/A";
        column.styleBuilder = this.resultColorStyleBuilder;
        break;
    }
    return column;
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
      validationResult.validationMessage =
        "Please select a " + this.schoolNaming;
    } else if (moment(record.start).isAfter(record.end, "days")) {
      validationResult.validationMessage =
        '"To"-date lies before "From"-date. Please enter correct dates.';
    } else if (
      this.columns.some((col) => col.input === "percentageResult") &&
      (record.result > 100 || record.result < 0)
    ) {
      validationResult.validationMessage =
        "Result cannot be smaller than 0 or greater than 100 (percent)";
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
