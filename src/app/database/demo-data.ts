import {Child} from '../children/child';
import {Gender} from '../children/Gender';
import {AttendanceMonth} from '../children/attendance/attendance-month';
import {Entity} from '../entity/entity';
import {Note} from '../children/notes/note';
import {WarningLevel} from '../children/attendance/warning-level';
import {AttendanceStatus} from '../children/attendance/attendance-day';
import {ChildSchoolRelation} from '../children/childSchoolRelation';
import {School} from '../schools/school';
import {ProgressDashboardConfig} from '../dashboard/progress-dashboard/progress-dashboard-config';

export class DemoData {

  static getAllDemoEntities(): Entity[] {
    return []
      .concat(this.getConfigEntities())
      .concat(DemoData.getChildEntities())
      .concat(this.getSchoolEntities())
      .concat(this.getMonthAttendanceEntities())
      .concat(this.getNoteEntities())
      .concat(this.getChildSchoolRelationEntities());
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

  static getChildEntities(): Child[] {
    const data = [];

    const a1 = new Child('1');
    a1.name = 'Arjun A.';
    a1.projectNumber = '1';
    a1.religion = 'Hindu';
    a1.gender = Gender.MALE;
    a1.dateOfBirth = new Date('2000-03-13');
    a1.motherTongue = 'Hindi';
    a1.center = 'Delhi';
    data.push(a1);

    const a2 = new Child('2');
    a2.name = 'Bandana B.';
    a2.projectNumber = '2';
    a2.religion = 'Hindu';
    a2.gender = Gender.FEMALE;
    a2.dateOfBirth = new Date('2001-01-01');
    a2.motherTongue = 'Bengali';
    a2.center = 'Kolkata';
    data.push(a2);

    const a3 = new Child('3');
    a3.name = 'Chandan C.';
    a3.projectNumber = '3';
    a3.religion = 'Hindu';
    a3.gender = Gender.MALE;
    a3.dateOfBirth = new Date('2002-07-29');
    a3.motherTongue = 'Hindi';
    a3.center = 'Kolkata';
    data.push(a3);

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


  static getSchoolEntities(): School[] {
    const data = [];

    const s1 = new School('1');
    s1.name = 'People\'s Primary';
    s1.medium = 'Hindi';
    data.push(s1);

    const s2 = new School('2');
    s2.name = 'Hope High School';
    s2.medium = 'English';
    data.push(s2);

    return data;
  }

  static getChildSchoolRelationEntities(): ChildSchoolRelation[] {
    const data: ChildSchoolRelation[] = [];
    const rel1: ChildSchoolRelation = new ChildSchoolRelation('1');
    rel1.childId = '1';
    rel1.schoolId = '1';
    rel1.start = '2016-10-01';
    rel1.schoolClass = '2';
    data.push(rel1);

    const rel4: ChildSchoolRelation = new ChildSchoolRelation('2');
    rel4.childId = '3';
    rel4.schoolId = '2';
    rel4.start = '2001-01-01';
    rel4.end = '2002-01-01';
    rel4.schoolClass = '1';
    data.push(rel4);

    const rel2: ChildSchoolRelation = new ChildSchoolRelation('3');
    rel2.childId = '2';
    rel2.schoolId = '2';
    rel2.start = '2018-05-07';
    rel2.schoolClass = '3';
    data.push(rel2);

    const rel3: ChildSchoolRelation = new ChildSchoolRelation('4');
    rel3.childId = '3';
    rel3.schoolId = '1';
    rel3.start = '2010-01-01';
    rel3.schoolClass = '2';
    data.push(rel3);

    return data;
  }
}
