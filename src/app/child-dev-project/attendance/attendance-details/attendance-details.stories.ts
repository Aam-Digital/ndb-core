import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { RecurringActivity } from "../model/recurring-activity";
import {
  ActivityAttendance,
  generateEventWithAttendance,
} from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { AttendanceDetailsComponent } from "./attendance-details.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

const demoActivity = RecurringActivity.create("Coaching Batch C");
const activityAttendance = ActivityAttendance.create(new Date("2020-01-01"), [
  generateEventWithAttendance(
    [
      ["1", AttendanceLogicalStatus.PRESENT],
      ["2", AttendanceLogicalStatus.PRESENT],
      ["3", AttendanceLogicalStatus.ABSENT],
    ],
    new Date("2020-01-01"),
  ),
  generateEventWithAttendance(
    [
      ["1", AttendanceLogicalStatus.PRESENT],
      ["2", AttendanceLogicalStatus.ABSENT],
    ],
    new Date("2020-01-02"),
  ),
  generateEventWithAttendance(
    [
      ["1", AttendanceLogicalStatus.ABSENT],
      ["2", AttendanceLogicalStatus.ABSENT],
    ],
    new Date("2020-01-03"),
  ),
  generateEventWithAttendance(
    [
      ["1", AttendanceLogicalStatus.PRESENT],
      ["2", AttendanceLogicalStatus.ABSENT],
    ],
    new Date("2020-01-04"),
  ),
]);
activityAttendance.events.forEach((e) => (e.subject = demoActivity.title));
activityAttendance.periodTo = new Date("2020-01-31");
activityAttendance.activity = demoActivity;

export default {
  title: "Features/Attendance/Views/AttendanceDetails",
  component: AttendanceDetailsComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
    moduleMetadata({
      providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }],
    }),
  ],
} as Meta;

const Template: StoryFn<AttendanceDetailsComponent> = (
  args: AttendanceDetailsComponent,
) => ({
  component: AttendanceDetailsComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: activityAttendance,
};

const activityAttendanceIndividual = Object.assign(
  new ActivityAttendance(),
  activityAttendance,
);
export const ForIndividualChild = Template.bind({});
ForIndividualChild.args = {
  entity: activityAttendanceIndividual,
  focusedChild: "1",
};
