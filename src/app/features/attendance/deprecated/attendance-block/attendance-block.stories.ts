import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { ActivityAttendance } from "../../model/activity-attendance";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { AttendanceBlockComponent } from "./attendance-block.component";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { ConfigService } from "#src/app/core/config/config.service";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type";

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
  TestEventEntity.generateEventWithAttendance([
    ["1", AttendanceLogicalStatus.ABSENT],
    ["2", AttendanceLogicalStatus.ABSENT],
  ]),
  TestEventEntity.generateEventWithAttendance([
    ["1", AttendanceLogicalStatus.PRESENT],
    ["2", AttendanceLogicalStatus.ABSENT],
  ]),
  TestEventEntity.generateEventWithAttendance([
    ["1", AttendanceLogicalStatus.IGNORE],
    ["2", AttendanceLogicalStatus.PRESENT],
  ]),
]);
attendanceRecord.activity = Object.assign(
  createEntityOfType("RecurringActivity"),
  { title: "Demo Activity" },
);

export const CriticalAttendance = {
  render: Template,

  args: {
    attendanceData: attendanceRecord,
    forChild: "1",
  },
};

const attendanceRecord2 = ActivityAttendance.create(new Date("2021-01-01"), [
  TestEventEntity.generateEventWithAttendance([
    ["1", AttendanceLogicalStatus.PRESENT],
  ]),
  TestEventEntity.generateEventWithAttendance([
    ["1", AttendanceLogicalStatus.PRESENT],
  ]),
  TestEventEntity.generateEventWithAttendance([
    ["1", AttendanceLogicalStatus.ABSENT],
  ]),
]);
attendanceRecord2.activity = Object.assign(
  createEntityOfType("RecurringActivity"),
  { title: "Demo Activity" },
);

export const MediocreAttendance = {
  render: Template,

  args: {
    attendanceData: attendanceRecord2,
    forChild: "1",
  },
};

const attendanceRecord3 = ActivityAttendance.create(new Date("2021-01-01"), [
  TestEventEntity.generateEventWithAttendance([
    ["1", AttendanceLogicalStatus.PRESENT],
  ]),
]);
attendanceRecord3.activity = Object.assign(
  createEntityOfType("RecurringActivity"),
  { title: "Demo Activity" },
);

export const GoodAttendance = {
  render: Template,

  args: {
    attendanceData: attendanceRecord3,
    forChild: "1",
  },
};

const attendanceRecordEmpty = ActivityAttendance.create(
  new Date("2021-01-01"),
  [],
);
attendanceRecordEmpty.activity = Object.assign(
  createEntityOfType("RecurringActivity"),
  { title: "Demo Activity" },
);

export const PeriodWithoutEvents = {
  render: Template,

  args: {
    attendanceData: attendanceRecordEmpty,
    forChild: "1",
  },
};
