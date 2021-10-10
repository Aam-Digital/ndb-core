import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { AttendanceModule } from "../attendance.module";
import { RouterTestingModule } from "@angular/router/testing";
import { generateEventWithAttendance } from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { AttendanceCalendarComponent } from "./attendance-calendar.component";
import { MatNativeDateModule } from "@angular/material/core";
import { Note } from "../../notes/model/note";
import moment from "moment";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { FormDialogModule } from "../../../core/form-dialog/form-dialog.module";
import { AttendanceService } from "../attendance.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";

const demoEvents: Note[] = [
  generateEventWithAttendance(
    [
      ["1", AttendanceLogicalStatus.ABSENT],
      ["2", AttendanceLogicalStatus.PRESENT],
      ["3", AttendanceLogicalStatus.ABSENT],
    ],
    new Date()
  ),
  generateEventWithAttendance(
    [
      ["1", AttendanceLogicalStatus.PRESENT],
      ["2", AttendanceLogicalStatus.ABSENT],
      ["3", AttendanceLogicalStatus.IGNORE],
    ],
    moment().subtract(1, "day").toDate()
  ),
  generateEventWithAttendance(
    [
      ["1", AttendanceLogicalStatus.IGNORE],
      ["2", AttendanceLogicalStatus.ABSENT],
    ],
    moment().subtract(2, "day").toDate()
  ),
  generateEventWithAttendance(
    [
      ["1", AttendanceLogicalStatus.IGNORE],
      ["2", AttendanceLogicalStatus.ABSENT],
    ],
    moment().subtract(3, "day").toDate()
  ),
];

demoEvents[0].getAttendance("1").remarks = "cough and cold";

export default {
  title: "Attendance/Components/AttendanceCalendar",
  component: AttendanceCalendarComponent,
  decorators: [
    moduleMetadata({
      imports: [
        AttendanceModule,
        FormDialogModule,
        RouterTestingModule,
        MatNativeDateModule,
      ],
      declarations: [],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(),
        },
        {
          provide: AttendanceService,
          useValue: null,
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<AttendanceCalendarComponent> = (
  args: AttendanceCalendarComponent
) => ({
  component: AttendanceCalendarComponent,
  props: args,
});

export const ForIndividualChild = Template.bind({});
ForIndividualChild.args = {
  records: demoEvents,
  highlightForChild: "1",
};

export const ForActivityOverall = Template.bind({});
ForActivityOverall.args = {
  records: demoEvents,
};
