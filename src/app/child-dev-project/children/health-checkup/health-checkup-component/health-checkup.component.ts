import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { HealthCheck } from "../model/health-check";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../../../core/entity-components/entity-form/entity-form/FormConfig";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { EntitySubrecordComponent } from "../../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord.component";

@DynamicComponent("HealthCheckup")
@Component({
  selector: "app-health-checkup",
  templateUrl: "./health-checkup.component.html",
  imports: [EntitySubrecordComponent],
  standalone: true,
})
export class HealthCheckupComponent
  implements OnChanges, OnInitDynamicComponent
{
  records = new Array<HealthCheck>();
  /**
   * Column Description for the SubentityRecordComponent
   * The Date-Column needs to be transformed to apply the MathFormCheck in the SubentityRecordComponent
   * BMI is rounded to 2 decimal digits
   */
  columns: FormFieldConfig[] = [
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
  ];
  @Input() child: Child;

  constructor(private childrenService: ChildrenService) {}

  private getBMI(healthCheck: HealthCheck): string {
    const bmi = healthCheck.bmi;
    if (Number.isNaN(bmi)) {
      return "-";
    } else {
      return bmi.toFixed(2);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("child")) {
      this.loadData(this.child.getId());
    }
  }

  onInitFromDynamicConfig(config: PanelConfig) {
    if (config?.config?.columns) {
      this.columns = config.config.columns;
    }

    this.child = config.entity as Child;
    this.loadData(this.child.getId());
  }

  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const childId = this.child.getId();

    return () => {
      const newHC = new HealthCheck(Date.now().toString());

      // use last entered date as default, otherwise today's date
      newHC.date = this.records.length > 0 ? this.records[0].date : new Date();
      newHC.child = childId;

      return newHC;
    };
  }

  /**
   * implements the health check loading from the children service and is called in the onInit()
   */
  async loadData(id: string) {
    this.records = await this.childrenService.getHealthChecksOfChild(id);
    this.records.sort(
      (a, b) =>
        (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0)
    );
  }
}
