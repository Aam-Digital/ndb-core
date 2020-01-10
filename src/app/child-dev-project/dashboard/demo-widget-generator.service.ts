import { faker } from '../../core/demo-data/faker';
import { Injectable } from '@angular/core';
import { DemoDataGenerator } from '../../core/demo-data/demo-data-generator';
import { ProgressDashboardConfig } from './progress-dashboard/progress-dashboard-config';
import { DemoChildGenerator } from '../children/demo-data-generators/demo-child-generator.service';
import { centersUnique } from '../children/demo-data-generators/fixtures/centers';


@Injectable()
export class DemoWidgetGeneratorService extends DemoDataGenerator<any> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoWidgetGeneratorService.provider()]`
   */
  static provider() {
    return [
      { provide: DemoWidgetGeneratorService, useClass: DemoWidgetGeneratorService },
    ];
  }


  constructor(private demoChildren: DemoChildGenerator) {
    super();
  }

  generateEntities(): any[] {
    const data = [];

    data.push(this.generateDashboardWidgetSurveyStatus());

    return data;
  }

  private generateDashboardWidgetSurveyStatus(): ProgressDashboardConfig {
    const dashboardProgressWidget = new ProgressDashboardConfig('1');
    dashboardProgressWidget.title = 'Annual Surveys completed';

    for (const center of centersUnique) {
      const childrenInCenter = this.demoChildren.entities.filter(c => c.center === center).length;
      dashboardProgressWidget.parts.push({
        label: center,
        currentValue: faker.random.number(childrenInCenter),
        targetValue: childrenInCenter,
      });
    }
    return dashboardProgressWidget;
  }
}
