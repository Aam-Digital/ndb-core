import {Entity} from '../entity/entity';
import {Note} from '../children/notes/note';
import {WarningLevel} from '../children/attendance/warning-level';
import {ProgressDashboardConfig} from '../dashboard/progress-dashboard/progress-dashboard-config';

export class DemoData {

  static getAllDemoEntities(): Entity[] {
    return []
      .concat(this.getConfigEntities())
      .concat(this.getNoteEntities());
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


  static getNoteEntities(): Note[] {
    const data = [];
    let autoincrement = 0;

    const n1 = new Note((autoincrement++).toString());
    n1.children = ['1'];
    n1.date = new Date('2018-01-11');
    n1.subject = 'Mother lost job';
    n1.text = 'The mother has recently lost her job and the family is facing difficulties to meet their daily expenses.' +
      'We should check on the family situation again.';
    n1.category = 'Incident';
    n1.warningLevel = WarningLevel.WARNING;
    data.push(n1);

    const n2 = new Note((autoincrement++).toString());
    n2.children = ['1', '2'];
    n2.date = new Date('2018-01-25');
    n2.subject = 'Guardians Meeting';
    n2.text = 'The mother has recently lost her job and the family is facing difficulties to meet their daily expenses.';
    n2.category = 'Guardians\' Meeting';
    n2.warningLevel = WarningLevel.OK;
    data.push(n2);

    const n3 = new Note((autoincrement++).toString());
    n3.children = ['2'];
    n3.date = new Date();
    n3.subject = 'Skipping School';
    n3.text = 'The child has not been to school during the last days and we have not received any information.' +
      'During the homevisit the mother was not at home. Another visit is needed as soon as possible.';
    n3.category = 'Homevisit';
    n3.warningLevel = WarningLevel.URGENT;
    data.push(n3);

    return data;
  }
}
