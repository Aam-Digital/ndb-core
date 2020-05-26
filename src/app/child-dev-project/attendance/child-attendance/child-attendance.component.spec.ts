import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ChildAttendanceComponent } from "./child-attendance.component";
import { ActivatedRoute } from "@angular/router";
import { Child } from "../../children/model/child";
import { ChildrenService } from "../../children/children.service";
import { DatePipe, PercentPipe } from "@angular/common";
import { of } from "rxjs";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { Database } from "../../../core/database/database";
import { MockDatabase } from "../../../core/database/mock-database";
import { AttendanceMonth } from "../model/attendance-month";
import { AttendanceStatus } from "../model/attendance-day";
import { AlertService } from "app/core/alerts/alert.service";
import { ChildrenModule } from "../../children/children.module";

const ATTENDANCE_ENTITIES: AttendanceMonth[] = (() => {
  const data = [];

  const a1 = new AttendanceMonth("1");
  a1.student = "2";
  a1.month = new Date("2018-01-01");
  a1.daysWorking = 20;
  a1.daysAttended = 18;
  a1.institution = "coaching";
  a1.dailyRegister[0].status = AttendanceStatus.PRESENT;
  a1.dailyRegister[1].status = AttendanceStatus.ABSENT;
  data.push(a1);

  const a2 = new AttendanceMonth("2");
  a2.student = "2";
  a2.month = new Date("2018-02-01");
  a2.daysWorking = 22;
  a2.daysAttended = 5;
  a2.institution = "coaching";
  data.push(a2);

  const a3 = new AttendanceMonth("3");
  a3.student = "2";
  a3.month = new Date("2018-03-01");
  a3.daysWorking = 19;
  a3.daysAttended = 11;
  a3.daysExcused = 3;
  a3.institution = "coaching";
  data.push(a3);

  const a4 = new AttendanceMonth("4");
  a4.student = "2";
  a4.month = new Date("2018-03-01");
  a4.daysWorking = 19;
  a4.daysAttended = 11;
  a4.daysExcused = 3;
  a4.institution = "school";
  data.push(a4);

  const last1 = new AttendanceMonth("last1");
  last1.student = "1";
  last1.month = new Date();
  last1.month = new Date(
    last1.month.getFullYear(),
    last1.month.getMonth() - 1,
    1
  );
  last1.daysWorking = 20;
  last1.daysAttended = 19;
  last1.daysExcused = 0;
  last1.institution = "school";
  data.push(last1);

  const last2 = new AttendanceMonth("last2");
  last2.student = "2";
  last2.month = new Date();
  last2.month = new Date(
    last2.month.getFullYear(),
    last2.month.getMonth() - 1,
    1
  );
  last2.daysWorking = 20;
  last2.daysAttended = 11;
  last2.daysExcused = 0;
  last2.institution = "school";
  data.push(last2);

  const current1 = new AttendanceMonth("current1");
  current1.student = "1";
  current1.month = new Date();
  current1.month = new Date(
    current1.month.getFullYear(),
    current1.month.getMonth(),
    current1.month.getDate() - 10
  );
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
  current1.institution = "coaching";
  data.push(current1);

  const current2 = new AttendanceMonth("current2");
  current2.student = "2";
  current2.month = new Date();
  current2.month = new Date(
    current2.month.getFullYear(),
    current2.month.getMonth(),
    current2.month.getDate() - 10
  );
  current2.institution = "coaching";
  current2.dailyRegister[current1.month.getDate() - 1].status =
    AttendanceStatus.ABSENT;
  current2.dailyRegister[current1.month.getDate()].status =
    AttendanceStatus.ABSENT;
  current2.dailyRegister[current1.month.getDate()].remarks = "foo";
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
})();

describe("ChildAttendanceComponent", () => {
  let component: ChildAttendanceComponent;
  let fixture: ComponentFixture<ChildAttendanceComponent>;

  const mockChildrenService = {
    getChild: (id) => of(new Child(id)),
    getAttendances: () => of(ATTENDANCE_ENTITIES),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ChildrenModule],
      providers: [
        DatePipe,
        PercentPipe,
        { provide: ActivatedRoute, useValue: { params: of({ id: "22" }) } },
        { provide: ChildrenService, useValue: mockChildrenService },
        EntityMapperService,
        EntitySchemaService,
        AlertService,
        { provide: Database, useClass: MockDatabase },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildAttendanceComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
