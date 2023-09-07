import { Component, Input, OnInit } from "@angular/core";
import { HealthCheck } from "../model/health-check";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";
import { FormFieldConfig } from "../../../../core/common-components/entity-form/entity-form/FormConfig";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntitySubrecordComponent } from "../../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord.component";

@DynamicComponent("HealthCheckup")
@Component({
  selector: "app-health-checkup",
  templateUrl: "./health-checkup.component.html",
  imports: [EntitySubrecordComponent],
  standalone: true,
})
export class HealthCheckupComponent implements OnInit {
  records: HealthCheck[] = [];
  /**
   * Column Description for the SubentityRecordComponent
   * The Date-Column needs to be transformed to apply the MathFormCheck in the SubentityRecordComponent
   * BMI is rounded to 2 decimal digits
   */
  @Input() config: { columns: FormFieldConfig[] } = {
    columns: [
      { id: "date" },
      { id: "height" },
      { id: "weight" },
      {
        id: "bmi",
        label: $localize`:Table header, Short for Body Mass Index:BMI`,
        view: "ReadonlyFunction",
        tooltip: $localize`:Tooltip for BMI info:This is calculated using the height and the weight measure`,
        additional: (entity: HealthCheck) => this.getBMI(entity),
      },
      {
        id: "display-percentage",
        label: "display-percentage",
        view: "DisplayDynamicPercentage",
        additional: {
          actual: "weight",
          total: "height",
          decimalPlaces: 0,
        },
      },
    ],
  };
  @Input() entity: Child;

  constructor(private childrenService: ChildrenService) {}

  private getBMI(healthCheck: HealthCheck): string {
    const bmi = healthCheck.bmi;
    if (Number.isNaN(bmi)) {
      return "-";
    } else {
      return bmi.toFixed(2);
    }
  }

  ngOnInit() {
    return this.loadData();
  }

  generateNewRecordFactory() {
    return () => {
      const newHC = new HealthCheck(Date.now().toString());

      // use last entered date as default, otherwise today's date
      newHC.date = this.records.length > 0 ? this.records[0].date : new Date();
      newHC.child = this.entity.getId();

      return newHC;
    };
  }

  /**
   * implements the health check loading from the children service and is called in the onInit()
   */
  async loadData() {
    this.records = await this.childrenService.getHealthChecksOfChild(
      this.entity.getId(),
    );
    this.records.sort(
      (a, b) =>
        (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0),
    );
  }
}
