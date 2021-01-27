import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { AttendanceModule } from "../attendance.module";
import {
  ActivityAttendance,
  generateEventWithAttendance,
} from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { AttendanceBlockComponent } from "./attendance-block.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MatNativeDateModule } from "@angular/material/core";
import { RecurringActivity } from "../model/recurring-activity";

export default {
  title: "Attendance Module/AttendanceBlock",
  component: AttendanceBlockComponent,
  decorators: [
    moduleMetadata({
      imports: [AttendanceModule, MatNativeDateModule],
      providers: [{ provide: EntityMapperService, useValue: null }],
    }),
  ],
} as Meta;

const Template: Story<AttendanceBlockComponent> = (
  args: AttendanceBlockComponent
) => ({
  component: AttendanceBlockComponent,
  props: args,
});

const attendanceRecord = ActivityAttendance.create(new Date("2021-01-01"), [
  generateEventWithAttendance({
    "1": AttendanceLogicalStatus.ABSENT,
    "2": AttendanceLogicalStatus.ABSENT,
  }),
  generateEventWithAttendance({
    "1": AttendanceLogicalStatus.PRESENT,
    "2": AttendanceLogicalStatus.ABSENT,
  }),
  generateEventWithAttendance({
    "1": AttendanceLogicalStatus.IGNORE,
    "2": AttendanceLogicalStatus.PRESENT,
  }),
]);
attendanceRecord.activity = RecurringActivity.create("Demo Activity");
export const CriticalAttendance = Template.bind({});
CriticalAttendance.args = {
  attendanceData: attendanceRecord,
  forChild: "1",
};

const attendanceRecord2 = ActivityAttendance.create(new Date("2021-01-01"), [
  generateEventWithAttendance({
    "1": AttendanceLogicalStatus.PRESENT,
  }),
  generateEventWithAttendance({
    "1": AttendanceLogicalStatus.ABSENT,
  }),
  generateEventWithAttendance({
    "1": AttendanceLogicalStatus.PRESENT,
  }),
]);
attendanceRecord.activity = RecurringActivity.create("Demo Activity");
export const MediocreAttendance = Template.bind({});
MediocreAttendance.args = {
  attendanceData: attendanceRecord2,
  forChild: "1",
};

const attendanceRecord3 = ActivityAttendance.create(new Date("2021-01-01"), [
  generateEventWithAttendance({
    "1": AttendanceLogicalStatus.PRESENT,
  }),
]);
attendanceRecord.activity = RecurringActivity.create("Demo Activity");
export const GoodAttendance = Template.bind({});
GoodAttendance.args = {
  attendanceData: attendanceRecord3,
  forChild: "1",
};
