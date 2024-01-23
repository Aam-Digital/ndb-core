import { Component, Input, OnInit } from "@angular/core";
import { HealthCheck } from "../model/health-check";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";
import { FormFieldConfig } from "../../../../core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntitiesTableComponent } from "../../../../core/common-components/entities-table/entities-table.component";
import { RelatedEntitiesComponent } from "../../../../core/entity-details/related-entities/related-entities.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../../../core/entity/database-entity.decorator";
import { ScreenWidthObserver } from "../../../../utils/media/screen-size-observer.service";
import { FilterService } from "../../../../core/filter/filter.service";

@DynamicComponent("HealthCheckup")
@Component({
  selector: "app-health-checkup",
  templateUrl:
    "../../../../core/entity-details/related-entities/related-entities.component.html",
  imports: [EntitiesTableComponent],
  standalone: true,
})
export class HealthCheckupComponent
  extends RelatedEntitiesComponent<HealthCheck>
  implements OnInit
{
  @Input() entity: Child;
  entityCtr = HealthCheck;

  /**
   * Column Description
   * The Date-Column needs to be transformed to apply the MathFormCheck in the SubentityRecordComponent
   * BMI is rounded to 2 decimal digits
   */
  override _columns: FormFieldConfig[] = [
    { id: "date" },
    { id: "height" },
    { id: "weight" },
    {
      id: "bmi",
      label: $localize`:Table header, Short for Body Mass Index:BMI`,
      viewComponent: "ReadonlyFunction",
      description: $localize`:Tooltip for BMI info:This is calculated using the height and the weight measure`,
      additional: (entity: HealthCheck) => this.getBMI(entity),
    },
  ];

  constructor(
    private childrenService: ChildrenService,
    entityMapper: EntityMapperService,
    entityRegistry: EntityRegistry,
    screenWidthObserver: ScreenWidthObserver,
    filterService: FilterService,
  ) {
    super(entityMapper, entityRegistry, screenWidthObserver, filterService);
  }

  private getBMI(healthCheck: HealthCheck): string {
    const bmi = healthCheck.bmi;
    if (Number.isNaN(bmi)) {
      return "-";
    } else {
      return bmi.toFixed(2);
    }
  }

  override createNewRecordFactory() {
    return () => {
      const newHC = new HealthCheck();

      newHC.date = new Date();
      newHC.child = this.entity.getId();

      return newHC;
    };
  }

  /**
   * implements the health check loading from the children service and is called in the onInit()
   */
  override getData() {
    return this.childrenService
      .getHealthChecksOfChild(this.entity.getId())
      .then((data) =>
        data.sort(
          (a, b) =>
            (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0),
        ),
      );
  }
}
