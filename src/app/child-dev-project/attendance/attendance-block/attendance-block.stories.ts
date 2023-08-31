import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import {
  ActivityAttendance,
  generateEventWithAttendance,
} from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { AttendanceBlockComponent } from "./attendance-block.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { RecurringActivity } from "../model/recurring-activity";
import { ConfigService } from "../../../core/config/config.service";

export default {
  title: "Features/Attendance/Components/AttendanceBlock",
  component: AttendanceBlockComponent,
  decorators: [
    moduleMetadata({
      providers: [
        { provide: EntityMapperService, useValue: null },
        { provide: ConfigService, useValue: {} },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<AttendanceBlockComponent> = (
  args: AttendanceBlockComponent,
) => ({
  component: AttendanceBlockComponent,
  props: args,
});

const attendanceRecord = ActivityAttendance.create(new Date("2021-01-01"), [
  generateEventWithAttendance([
    ["1", AttendanceLogicalStatus.ABSENT],
    ["2", AttendanceLogicalStatus.ABSENT],
  ]),
  generateEventWithAttendance([
    ["1", AttendanceLogicalStatus.PRESENT],
    ["2", AttendanceLogicalStatus.ABSENT],
  ]),
  generateEventWithAttendance([
    ["1", AttendanceLogicalStatus.IGNORE],
    ["2", AttendanceLogicalStatus.PRESENT],
  ]),
]);
attendanceRecord.activity = RecurringActivity.create("Demo Activity");
export const CriticalAttendance = Template.bind({});
CriticalAttendance.args = {
  attendanceData: attendanceRecord,
  forChild: "1",
};

const attendanceRecord2 = ActivityAttendance.create(new Date("2021-01-01"), [
  generateEventWithAttendance([["1", AttendanceLogicalStatus.PRESENT]]),
  generateEventWithAttendance([["1", AttendanceLogicalStatus.PRESENT]]),
  generateEventWithAttendance([["1", AttendanceLogicalStatus.ABSENT]]),
]);
attendanceRecord2.activity = RecurringActivity.create("Demo Activity");
export const MediocreAttendance = Template.bind({});
MediocreAttendance.args = {
  attendanceData: attendanceRecord2,
  forChild: "1",
};

const attendanceRecord3 = ActivityAttendance.create(new Date("2021-01-01"), [
  generateEventWithAttendance([["1", AttendanceLogicalStatus.PRESENT]]),
]);
attendanceRecord3.activity = RecurringActivity.create("Demo Activity");
export const GoodAttendance = Template.bind({});
GoodAttendance.args = {
  attendanceData: attendanceRecord3,
  forChild: "1",
};

const attendanceRecordEmpty = ActivityAttendance.create(
  new Date("2021-01-01"),
  [],
);
attendanceRecordEmpty.activity = RecurringActivity.create("Demo Activity");
export const PeriodWithoutEvents = Template.bind({});
PeriodWithoutEvents.args = {
  attendanceData: attendanceRecordEmpty,
  forChild: "1",
};
