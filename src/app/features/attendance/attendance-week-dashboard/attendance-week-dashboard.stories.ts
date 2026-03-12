import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { AttendanceWeekDashboardComponent } from "./attendance-week-dashboard.component";
import { TestEventEntity } from "#src/app/utils/test-utils/TestEventEntity";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import moment from "moment";
import { StorybookBaseModule } from "#src/app/utils/storybook-base.module";
import { DatabaseIndexingService } from "#src/app/core/entity/database-indexing/database-indexing.service";
import { importProvidersFrom } from "@angular/core";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";

const child1 = TestEntity.create("Jack");
const child2 = TestEntity.create("Jane");

const act1 = Object.assign(createEntityOfType("RecurringActivity"), {
  title: "Demo Activity",
  participants: [child1.getId(), child2.getId()],
});
const act2 = Object.assign(createEntityOfType("RecurringActivity"), {
  title: "Other Activity",
});

const events = [
  TestEventEntity.generateEventWithAttendance(
    [
      [child1.getId(), AttendanceLogicalStatus.PRESENT],
      [child2.getId(), AttendanceLogicalStatus.ABSENT],
    ],
    new Date(),
    act1,
  ),
  TestEventEntity.generateEventWithAttendance(
    [
      [child1.getId(), AttendanceLogicalStatus.ABSENT],
      [child2.getId(), AttendanceLogicalStatus.ABSENT],
    ],
    moment().subtract(1, "day").toDate(),
    act1,
  ),
  TestEventEntity.generateEventWithAttendance(
    [
      [child1.getId(), AttendanceLogicalStatus.ABSENT, "Remark 123"],
      [child2.getId(), AttendanceLogicalStatus.ABSENT],
    ],
    moment().subtract(2, "day").toDate(),
    act1,
  ),
];

export default {
  title: "Features/Attendance/Dashboards/AttendanceWeekDashboard",
  component: AttendanceWeekDashboardComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([
            act1,
            act2,
            child1,
            child2,
            ...events.map((e) => e.entity),
          ]),
        ),
        {
          provide: DatabaseIndexingService,
          useValue: {
            queryIndexDocsRange: () =>
              Promise.resolve(events.map((e) => e.entity)),
            createIndex: () => Promise.resolve(),
            queryIndexDocs: () => Promise.resolve([]),
          },
        },
      ],
    }),
  ],
  parameters: {
    controls: {
      exclude: ["tableDataSource"],
    },
  },
} as Meta;

const Template: StoryFn<AttendanceWeekDashboardComponent> = (
  args: AttendanceWeekDashboardComponent,
) => ({
  component: AttendanceWeekDashboardComponent,
  props: args,
});

export const Primary = {
  render: Template,

  args: {
    daysOffset: 7,
    periodLabel: "since last week",
  },
};
