import {Entity} from '../entity/entity';
import {ProgressDashboardConfig} from '../dashboard/progress-dashboard/progress-dashboard-config';

export class DemoData {

  static getAllDemoEntities(): Entity[] {
    return []
      .concat(this.getConfigEntities());
  }

  static getConfigEntities(): any[] {
    const data = [];

    const dashboardProgressWidget = new ProgressDashboardConfig('1');
    dashboardProgressWidget.title = 'Annual Surveys completed';
    dashboardProgressWidget.parts.push({
      label: 'Delhi',
      currentValue: 7,
      targetValue: 51,
    });
    dashboardProgressWidget.parts.push({
      label: 'Kolkata',
      currentValue: 16,
      targetValue: 28,
    });
    dashboardProgressWidget.parts.push({
      label: 'Other',
      currentValue: 2,
      targetValue: 10,
    });
    data.push(dashboardProgressWidget);

    return data;
  }
}
