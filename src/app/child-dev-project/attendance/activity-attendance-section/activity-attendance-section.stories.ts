import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { RecurringActivity } from "../model/recurring-activity";
import { ActivityAttendanceSectionComponent } from "./activity-attendance-section.component";
import {
  ActivityAttendance,
  generateEventWithAttendance,
} from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import moment from "moment";
import { AttendanceService } from "../attendance.service";
import { ChildrenService } from "../../children/children.service";
import { of } from "rxjs";
import { Child } from "../../children/model/child";

const demoActivity = RecurringActivity.create("Coaching Batch C");
const attendanceRecords = [
  ActivityAttendance.create(
    moment().subtract(1, "month").startOf("month").toDate(),
    [
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ]),
    ],
  ),

  ActivityAttendance.create(moment().startOf("month").toDate(), [
    generateEventWithAttendance(
      [
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.PRESENT],
        ["3", AttendanceLogicalStatus.ABSENT],
      ],
      moment().subtract(5, "days").toDate(),
    ),
    generateEventWithAttendance(
      [
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ],
      moment().subtract(4, "days").toDate(),
    ),
    generateEventWithAttendance(
      [
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ],
      moment().subtract(3, "days").toDate(),
    ),
    generateEventWithAttendance(
      [
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ],
      moment().subtract(2, "days").toDate(),
    ),
  ]),
];
attendanceRecords.forEach((a) => {
  a.activity = demoActivity;
  a.periodTo = moment(a.periodFrom).endOf("month").toDate();
});

export default {
  title: "Features/Attendance/Sections/ActivityAttendanceSection",
  component: ActivityAttendanceSectionComponent,
  decorators: [
    moduleMetadata({
      imports: [
        ActivityAttendanceSectionComponent,
        StorybookBaseModule,
        MockedTestingModule.withState(),
      ],
      providers: [
        {
          provide: AttendanceService,
          useValue: {
            getActivityAttendances: () => Promise.resolve(attendanceRecords),
          },
        },
        {
          provide: ChildrenService,
          useValue: { getChild: () => of(Child.create("John Doe")) },
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<ActivityAttendanceSectionComponent> = (
  args: ActivityAttendanceSectionComponent,
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
