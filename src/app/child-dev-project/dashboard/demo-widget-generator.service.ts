import { faker } from "../../core/demo-data/faker";
import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../core/demo-data/demo-data-generator";
import { ProgressDashboardConfig } from "./progress-dashboard/progress-dashboard-config";

@Injectable()
export class DemoWidgetGeneratorService extends DemoDataGenerator<any> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoWidgetGeneratorService.provider()]`
   */
  static provider() {
    return [
      {
        provide: DemoWidgetGeneratorService,
        useClass: DemoWidgetGeneratorService,
      },
    ];
  }

  private readonly DEMO_TASKS = [
    "Clubs visited",
    "Schools checked",
    "Government Officials met",
  ];

  constructor() {
    super();
  }

  generateEntities(): any[] {
    const data = [];

    data.push(this.generateDashboardWidgetSurveyStatus());

    return data;
  }

  private generateDashboardWidgetSurveyStatus(): ProgressDashboardConfig {
    const dashboardProgressWidget = new ProgressDashboardConfig("1");
    dashboardProgressWidget.title = "Annual Survey";

    for (const task of this.DEMO_TASKS) {
      const targetNumber = faker.random.number({ min: 5, max: 50 });
      dashboardProgressWidget.parts.push({
        label: task,
        currentValue: faker.random.number(targetNumber),
        targetValue: targetNumber,
      });
    }
    return dashboardProgressWidget;
  }
}
