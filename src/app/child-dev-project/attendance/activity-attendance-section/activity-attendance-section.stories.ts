import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RecurringActivity } from "../model/recurring-activity";
import { ActivityAttendanceSectionComponent } from "./activity-attendance-section.component";
import { AttendanceModule } from "../attendance.module";
import {
  ActivityAttendance,
  generateEventWithAttendance,
} from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

const demoActivity = RecurringActivity.create("Coaching Batch C");
const attendanceRecords = [
  ActivityAttendance.create(new Date("2020-01-01"), [
    generateEventWithAttendance(
      [
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.PRESENT],
        ["3", AttendanceLogicalStatus.ABSENT],
      ],
      new Date("2020-01-01")
    ),
    generateEventWithAttendance(
      [
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ],
      new Date("2020-01-02")
    ),
    generateEventWithAttendance(
      [
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ],
      new Date("2020-01-03")
    ),
    generateEventWithAttendance(
      [
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ],
      new Date("2020-01-04")
    ),
  ]),

  ActivityAttendance.create(new Date("2020-02-01"), [
    generateEventWithAttendance([
      ["1", AttendanceLogicalStatus.ABSENT],
      ["2", AttendanceLogicalStatus.ABSENT],
    ]),
    generateEventWithAttendance([
      ["1", AttendanceLogicalStatus.PRESENT],
      ["2", AttendanceLogicalStatus.ABSENT],
    ]),
  ]),
];
attendanceRecords.forEach((a) => (a.activity = demoActivity));

export default {
  title: "Attendance/Sections/ActivityAttendanceSection",
  component: ActivityAttendanceSectionComponent,
  decorators: [
    moduleMetadata({
      imports: [
        AttendanceModule,
        StorybookBaseModule,
        MockedTestingModule.withState(),
      ],
    }),
  ],
} as Meta;

const Template: Story<ActivityAttendanceSectionComponent> = (
  args: ActivityAttendanceSectionComponent
) => ({
  component: ActivityAttendanceSectionComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  activity: demoActivity,
};

export const ForIndividualChild = Template.bind({});
ForIndividualChild.args = {
  activity: demoActivity,
  forChild: "1",
};
