import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { HealthCheck } from "../model/health-check";
import { ChildrenService } from "../../children/children.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Child } from "../../children/model/child";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";

@UntilDestroy()
@Component({
  selector: "app-health-checkup",
  templateUrl: "./health-checkup.component.html",
  styleUrls: ["./health-checkup.component.scss"],
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
      label: "BMI",
      view: "ReadonlyFunction",
      additional: (entity: HealthCheck) => entity.bmi.toFixed(2),
    },
  ];
  @Input() child: Child;
  constructor(private childrenService: ChildrenService) {}

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
  loadData(id: string) {
    this.childrenService
      .getHealthChecksOfChild(id)
      .pipe(untilDestroyed(this))
      .subscribe((results) => {
        this.records = results.sort(
          (a, b) =>
            (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0)
        );
      });
  }
}
