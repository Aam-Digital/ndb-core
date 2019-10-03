import {AttendanceMonth} from '../children/attendance/attendance-month';
import {Entity} from '../entity/entity';
import {Note} from '../children/notes/note';
import {WarningLevel} from '../children/attendance/warning-level';
import {AttendanceStatus} from '../children/attendance/attendance-day';
import {ProgressDashboardConfig} from '../dashboard/progress-dashboard/progress-dashboard-config';

export class DemoData {

  static getAllDemoEntities(): Entity[] {
    return []
      .concat(this.getConfigEntities())
      .concat(this.getMonthAttendanceEntities())
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

  static getMonthAttendanceEntities(): AttendanceMonth[] {
    const data = [];

    const a1 = new AttendanceMonth('1');
    a1.student = '2';
    a1.month = new Date('2018-01-01');
    a1.daysWorking = 20;
    a1.daysAttended = 18;
    a1.institution = 'coaching';
    a1.dailyRegister[0].status = AttendanceStatus.PRESENT;
    a1.dailyRegister[1].status = AttendanceStatus.ABSENT;
    data.push(a1);

    const a2 = new AttendanceMonth('2');
    a2.student = '2';
    a2.month = new Date('2018-02-01');
    a2.daysWorking = 22;
    a2.daysAttended = 5;
    a2.institution = 'coaching';
    data.push(a2);

    const a3 = new AttendanceMonth('3');
    a3.student = '2';
    a3.month = new Date('2018-03-01');
    a3.daysWorking = 19;
    a3.daysAttended = 11;
    a3.daysExcused = 3;
    a3.institution = 'coaching';
    data.push(a3);

    const a4 = new AttendanceMonth('4');
    a4.student = '2';
    a4.month = new Date('2018-03-01');
    a4.daysWorking = 19;
    a4.daysAttended = 11;
    a4.daysExcused = 3;
    a4.institution = 'school';
    data.push(a4);

    const last1 = new AttendanceMonth('last1');
    last1.student = '1';
    last1.month = new Date();
    last1.month = new Date(last1.month.getFullYear(), last1.month.getMonth() - 1, 1);
    last1.daysWorking = 20;
    last1.daysAttended = 19;
    last1.daysExcused = 0;
    last1.institution = 'school';
    data.push(last1);

    const last2 = new AttendanceMonth('last2');
    last2.student = '2';
    last2.month = new Date();
    last2.month = new Date(last2.month.getFullYear(), last2.month.getMonth() - 1, 1);
    last2.daysWorking = 20;
    last2.daysAttended = 11;
    last2.daysExcused = 0;
    last2.institution = 'school';
    data.push(last2);

    const current1 = new AttendanceMonth('current1');
    current1.student = '1';
    current1.month = new Date();
    current1.month = new Date(current1.month.getFullYear(), current1.month.getMonth(), current1.month.getDate() - 10);
    current1.dailyRegister[0].status = AttendanceStatus.LATE;
    current1.dailyRegister[1].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[2].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[3].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[4].status = AttendanceStatus.HOLIDAY;
    current1.dailyRegister[5].status = AttendanceStatus.EXCUSED;
    current1.dailyRegister[6].status = AttendanceStatus.ABSENT;
    current1.dailyRegister[7].status = AttendanceStatus.ABSENT;
    current1.dailyRegister[8].status = AttendanceStatus.EXCUSED;
    current1.dailyRegister[9].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[10].status = AttendanceStatus.LATE;
    current1.dailyRegister[11].status = AttendanceStatus.LATE;
    current1.dailyRegister[12].status = AttendanceStatus.HOLIDAY;
    current1.dailyRegister[13].status = AttendanceStatus.ABSENT;
    current1.dailyRegister[14].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[15].status = AttendanceStatus.LATE;
    current1.dailyRegister[16].status = AttendanceStatus.ABSENT;
    current1.dailyRegister[17].status = AttendanceStatus.ABSENT;
    current1.dailyRegister[18].status = AttendanceStatus.EXCUSED;
    current1.dailyRegister[19].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[20].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[21].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[22].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[23].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[24].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[25].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[26].status = AttendanceStatus.PRESENT;
    current1.dailyRegister[27].status = AttendanceStatus.LATE;
    current1.institution = 'coaching';
    data.push(current1);

    const current2 = new AttendanceMonth('current2');
    current2.student = '2';
    current2.month = new Date();
    current2.month = new Date(current2.month.getFullYear(), current2.month.getMonth(), current2.month.getDate() - 10);
    current2.institution = 'coaching';
    current2.dailyRegister[current1.month.getDate() - 1].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[current1.month.getDate()].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[current1.month.getDate()].remarks = 'foo';
    current2.dailyRegister[0].status = AttendanceStatus.LATE;
    current2.dailyRegister[1].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[2].status = AttendanceStatus.PRESENT;
    current2.dailyRegister[3].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[4].status = AttendanceStatus.HOLIDAY;
    current2.dailyRegister[5].status = AttendanceStatus.EXCUSED;
    current2.dailyRegister[6].status = AttendanceStatus.EXCUSED;
    current2.dailyRegister[7].status = AttendanceStatus.PRESENT;
    current2.dailyRegister[8].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[9].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[10].status = AttendanceStatus.HOLIDAY;
    current2.dailyRegister[11].status = AttendanceStatus.LATE;
    current2.dailyRegister[12].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[13].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[14].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[15].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[16].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[17].status = AttendanceStatus.HOLIDAY;
    current2.dailyRegister[18].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[19].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[20].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[21].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[22].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[23].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[24].status = AttendanceStatus.HOLIDAY;
    current2.dailyRegister[25].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[26].status = AttendanceStatus.ABSENT;
    current2.dailyRegister[27].status = AttendanceStatus.ABSENT;
    data.push(current2);

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
