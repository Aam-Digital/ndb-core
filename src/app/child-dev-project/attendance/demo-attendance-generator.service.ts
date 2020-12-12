import { DemoChildGenerator } from "../children/demo-data-generators/demo-child-generator.service";
import { DemoDataGenerator } from "../../core/demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { Child } from "../children/model/child";
import { faker } from "../../core/demo-data/faker";
import { AttendanceMonth } from "./model/attendance-month";
import { AttendanceDay, AttendanceStatus } from "./model/attendance-day";
import moment from "moment";

interface AttendanceProfile {
  id: number;
  present: number;
  excused: number;
  late: number;
  absent: number;
}

const ATTENDANCE_PROFILES: AttendanceProfile[] = [
  {
    id: 0,
    present: 94,
    excused: 3,
    late: 1,
    absent: 2,
  },
  {
    id: 1,
    present: 80,
    excused: 5,
    late: 5,
    absent: 10,
  },
  {
    id: 2,
    present: 70,
    excused: 5,
    late: 10,
    absent: 15,
  },
  {
    id: 3,
    present: 50,
    excused: 5,
    late: 5,
    absent: 40,
  },
];

/**
 * Generate AttendanceMonth entities for the last 15 months
 * Builds upon the generated demo Child entities.
 */
@Injectable()
export class DemoAttendanceGenerator extends DemoDataGenerator<
  AttendanceMonth
> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoAttendanceGenerator.provider()]`
   */
  static provider() {
    return [
      { provide: DemoAttendanceGenerator, useClass: DemoAttendanceGenerator },
    ];
  }

  public static isHoliday(date: Date) {
    switch (date.getMonth()) {
      case 0:
        return (
          (date.getDate() >= 1 && date.getDate() <= 6) ||
          date.getDate() === 23 ||
          date.getDate() === 26
        );
      case 2:
        return (
          date.getDate() === 4 || (date.getDate() >= 20 && date.getDate() <= 21)
        );
      case 3:
        return (
          date.getDate() === 15 ||
          (date.getDate() >= 20 && date.getDate() <= 21)
        );
      case 4:
        return date.getDate() === 1 || date.getDate() >= 23;
      case 5:
        return date.getDate() <= 21;
      case 6:
        return date.getDate() === 4;
      case 7:
        return date.getDate() === 15;
      case 8:
        return date.getDate() === 11;
      case 9:
        return date.getDate() >= 5 && date.getDate() <= 16;
      case 10:
        return date.getDate() === 2 || date.getDate() === 10;
      case 11:
        return date.getDate() >= 24;
    }

    return false;
  }

  constructor(private demoChildren: DemoChildGenerator) {
    super();
  }

  generateEntities(): AttendanceMonth[] {
    const data = [];

    for (const child of this.demoChildren.entities) {
      data.push(...this.generateAttendanceRecordsForChild(child as Child));
    }

    return data;
  }

  private generateAttendanceRecordsForChild(child: Child): AttendanceMonth[] {
    const data = [];

    const finalMonth = faker.getEarlierDateOrToday(child.dropoutDate);
    finalMonth.setDate(1);

    const month = new Date();
    month.setDate(1);
    month.setMonth(month.getMonth() - 15);
    if (child.admissionDate > month) {
      month.setMonth(child.admissionDate.getMonth());
      month.setFullYear(child.admissionDate.getFullYear());
    }

    let attendanceProfile = undefined;
    while (month <= finalMonth) {
      attendanceProfile = this.selectNextAttendanceProfile(attendanceProfile);

      data.push(
        this.generateRecord(
          child,
          new Date(month.toISOString()),
          "school",
          attendanceProfile
        )
      );
      data.push(
        this.generateRecord(
          child,
          new Date(month.toISOString()),
          "coaching",
          attendanceProfile
        )
      );

      month.setMonth(month.getMonth() + 1);
    }

    return data;
  }

  private generateRecord(
    child: Child,
    month: Date,
    institution: string,
    attendanceProfile: AttendanceProfile
  ) {
    const attendanceMonth = new AttendanceMonth(faker.random.uuid());
    attendanceMonth.month = month;
    attendanceMonth.student = child.getId();
    attendanceMonth.institution = institution;
    attendanceMonth.dailyRegister.forEach((attendanceDay) =>
      this.setDayAttendance(
        attendanceDay,
        institution !== "school",
        attendanceProfile
      )
    );
    return attendanceMonth;
  }

  private setDayAttendance(
    attendanceDay: AttendanceDay,
    includeSaturday: boolean,
    attendanceProfile: AttendanceProfile
  ) {
    if (!moment(attendanceDay.date).isBefore(moment(), "days")) {
      // don't add records for today or future dates
      return;
    }

    if (
      attendanceDay.date.getDay() === 0 || // Sunday
      (!includeSaturday && attendanceDay.date.getDay() === 6) // Saturday
    ) {
      return;
    }

    if (DemoAttendanceGenerator.isHoliday(attendanceDay.date)) {
      attendanceDay.status = AttendanceStatus.HOLIDAY;
      return;
    }

    const random = faker.random.number(100);
    if (random < attendanceProfile.present) {
      attendanceDay.status = AttendanceStatus.PRESENT;
    } else if (random < attendanceProfile.present + attendanceProfile.excused) {
      attendanceDay.status = AttendanceStatus.EXCUSED;
      attendanceDay.remarks = faker.random.arrayElement([
        "fever",
        "cough",
        "death in family",
        "family out of town",
      ]);
    } else if (
      random <
      attendanceProfile.present +
        attendanceProfile.excused +
        attendanceProfile.late
    ) {
      attendanceDay.status = AttendanceStatus.LATE;
    } else {
      attendanceDay.status = AttendanceStatus.ABSENT;
    }
  }

  /**
   * Select a new attendance profile (likelihood for absences, etc.).
   * It's most likely the profile will remain the same as in previous month.
   * @param previousAttendanceProfile
   */
  private selectNextAttendanceProfile(
    previousAttendanceProfile: AttendanceProfile
  ) {
    if (!previousAttendanceProfile) {
      return faker.random.arrayElement(ATTENDANCE_PROFILES);
    }

    if (faker.random.number(100) < 80) {
      return previousAttendanceProfile;
    } else {
      return faker.random.arrayElement(ATTENDANCE_PROFILES);
    }
  }
}
