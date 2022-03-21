import { faker } from "../../core/demo-data/faker";
import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../core/demo-data/demo-data-generator";
import { ProgressDashboardConfig } from "./progress-dashboard/progress-dashboard-config";

@Injectable()
export class DemoProgressDashboardWidgetGeneratorService extends DemoDataGenerator<any> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoProgressDashboardWidgetGeneratorService.provider()]`
   */
  static provider() {
    return [
      {
        provide: DemoProgressDashboardWidgetGeneratorService,
        useClass: DemoProgressDashboardWidgetGeneratorService,
      },
    ];
  }

  private readonly DEMO_TASKS = [
    $localize`:Example for demo task in the progress widget:Clubs visited`,
    $localize`:Example for demo task in the progress widget:Schools checked`,
    $localize`:Example for demo task in the progress widget:Government Officials met`,
  ];

  constructor() {
    super();
  }

  generateEntities(): any[] {
    const data = [];

    data.push(this.generateDashboardWidgetSurveyStatus());
    data.push(this.generateDashboardWidgetEvaluation());

    return data;
  }

  private generateDashboardWidgetSurveyStatus(): ProgressDashboardConfig {
    const dashboardProgressWidget = new ProgressDashboardConfig("1");
    dashboardProgressWidget.title = $localize`:Widget title:Annual Survey`;

    for (const task of this.DEMO_TASKS) {
      const targetNumber = faker.datatype.number({ min: 5, max: 50 });
      dashboardProgressWidget.parts.push({
        label: task,
        currentValue: faker.datatype.number(targetNumber),
        targetValue: targetNumber,
      });
    }
    return dashboardProgressWidget;
  }

  private generateDashboardWidgetEvaluation() {
    const dashboardProgressWidget = new ProgressDashboardConfig("2");
    dashboardProgressWidget.title = $localize`:Dashboard widget demo tile:Evaluation targets reached`;
    const evaluationEntries = [
      $localize`:Dashboard widget demo entry:Students graduating`,
      $localize`:Dashboard widget demo entry:Students enrolled in training`,
      $localize`:Dashboard widget demo entry:Students found job`,
    ];

    for (const task of evaluationEntries) {
      const targetNumber = faker.datatype.number({ min: 5, max: 50 });
      dashboardProgressWidget.parts.push({
        label: task,
        currentValue: faker.datatype.number(targetNumber),
        targetValue: targetNumber,
      });
    }
    return dashboardProgressWidget;
  }
}
