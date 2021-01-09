import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { AttendanceModule } from "../attendance.module";
import { FontAwesomeIconsModule } from "../../../core/icons/font-awesome-icons.module";
import { RouterTestingModule } from "@angular/router/testing";
import { generateEventWithAttendance } from "../model/activity-attendance";
import { AttendanceStatus } from "../model/attendance-status";
import { AttendanceCalendarComponent } from "./attendance-calendar.component";
import { MatNativeDateModule } from "@angular/material/core";
import { Note } from "../../notes/model/note";
import moment from "moment";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { FormDialogModule } from "../../../core/form-dialog/form-dialog.module";

const demoEvents: Note[] = [
  generateEventWithAttendance(
    {
      "1": AttendanceStatus.ABSENT,
      "2": AttendanceStatus.PRESENT,
      "3": AttendanceStatus.ABSENT,
    },
    new Date()
  ),
  generateEventWithAttendance(
    {
      "1": AttendanceStatus.PRESENT,
      "2": AttendanceStatus.ABSENT,
      "3": AttendanceStatus.UNKNOWN,
    },
    moment().subtract(1, "day").toDate()
  ),
  generateEventWithAttendance(
    {
      "1": AttendanceStatus.LATE,
      "2": AttendanceStatus.ABSENT,
    },
    moment().subtract(2, "day").toDate()
  ),
  generateEventWithAttendance(
    {
      "1": AttendanceStatus.HOLIDAY,
      "2": AttendanceStatus.ABSENT,
    },
    moment().subtract(3, "day").toDate()
  ),
];

demoEvents[0].getAttendance("1").remarks = "cough and cold";

export default {
  title: "Child Dev Project/AttendanceCalendar",
  component: AttendanceCalendarComponent,
  decorators: [
    moduleMetadata({
      imports: [
        AttendanceModule,
        FormDialogModule,
        FontAwesomeIconsModule,
        RouterTestingModule,
        MatNativeDateModule,
      ],
      declarations: [],
      providers: [
        {
          provide: EntityMapperService,
          useValue: { save: () => Promise.resolve() },
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
