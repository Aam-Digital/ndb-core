import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type";
import { ActivityAttendanceSectionComponent } from "./activity-attendance-section.component";
import { ActivityAttendance } from "../../model/activity-attendance";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { StorybookBaseModule } from "#src/app/utils/storybook-base.module";
import moment from "moment";
import { AttendanceService } from "../../attendance.service";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { of } from "rxjs";
import { importProvidersFrom } from "@angular/core";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

const demoActivity = Object.assign(createEntityOfType("RecurringActivity"), {
  title: "Coaching Batch C",
});
const attendanceRecords = [
  ActivityAttendance.create(
    moment().subtract(1, "month").startOf("month").toDate(),
    [
      TestEventEntity.generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ]),
      TestEventEntity.generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ]),
    ],
  ),

  ActivityAttendance.create(moment().startOf("month").toDate(), [
    TestEventEntity.generateEventWithAttendance(
      [
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.PRESENT],
        ["3", AttendanceLogicalStatus.ABSENT],
      ],
      moment().subtract(5, "days").toDate(),
    ),
    TestEventEntity.generateEventWithAttendance(
      [
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ],
      moment().subtract(4, "days").toDate(),
    ),
    TestEventEntity.generateEventWithAttendance(
      [
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ],
      moment().subtract(3, "days").toDate(),
    ),
    TestEventEntity.generateEventWithAttendance(
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
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
    moduleMetadata({
      providers: [
        {
          provide: AttendanceService,
          useValue: {
            getActivityAttendances: () => Promise.resolve(attendanceRecords),
          },
        },
        {
          provide: ChildrenService,
          useValue: {
            getChild: () => of(TestEntity.create({ name: "John Doe" })),
          },
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

export const Primary = {
  render: Template,

  args: {
    activity: demoActivity,
  },
};

export const ForIndividualChild = {
  render: Template,

  args: {
    activity: demoActivity,
    forChild: "1",
  },
};
