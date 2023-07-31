import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { generateEventWithAttendance } from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { AttendanceCalendarComponent } from "./attendance-calendar.component";
import { Note } from "../../notes/model/note";
import moment from "moment";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

const demoEvents: Note[] = [
  generateEventWithAttendance(
    [
      ["1", AttendanceLogicalStatus.ABSENT],
      ["2", AttendanceLogicalStatus.PRESENT],
      ["3", AttendanceLogicalStatus.ABSENT],
    ],
    new Date(),
  ),
  generateEventWithAttendance(
    [
      ["1", AttendanceLogicalStatus.PRESENT],
      ["2", AttendanceLogicalStatus.ABSENT],
      ["3", AttendanceLogicalStatus.IGNORE],
    ],
    moment().subtract(1, "day").toDate(),
  ),
  generateEventWithAttendance(
    [
      ["1", AttendanceLogicalStatus.IGNORE],
      ["2", AttendanceLogicalStatus.ABSENT],
    ],
    moment().subtract(2, "day").toDate(),
  ),
  generateEventWithAttendance(
    [
      ["1", AttendanceLogicalStatus.IGNORE],
      ["2", AttendanceLogicalStatus.ABSENT],
    ],
    moment().subtract(3, "day").toDate(),
  ),
];

demoEvents[0].getAttendance("1").remarks = "cough and cold";

export default {
  title: "Features/Attendance/Components/AttendanceCalendar",
  component: AttendanceCalendarComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const Template: StoryFn<AttendanceCalendarComponent> = (
  args: AttendanceCalendarComponent,
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
