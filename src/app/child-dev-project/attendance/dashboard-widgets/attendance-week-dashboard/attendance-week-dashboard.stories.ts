import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { AttendanceWeekDashboardComponent } from "./attendance-week-dashboard.component";
import { RecurringActivity } from "../../model/recurring-activity";
import { Child } from "../../../children/model/child";
import { generateEventWithAttendance } from "../../model/activity-attendance";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { Note } from "../../../notes/model/note";
import moment from "moment";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { LoginState } from "../../../../core/session/session-states/login-state.enum";
import { DatabaseIndexingService } from "../../../../core/entity/database-indexing/database-indexing.service";

const child1 = Child.create("Jack");
const child2 = Child.create("Jane");

const act1 = RecurringActivity.create("Demo Activity");
act1.participants.push(child1.getId());
act1.participants.push(child2.getId());
const act2 = RecurringActivity.create("Other Activity");
act1.participants.push(child1.getId());

const events: Note[] = [
  generateEventWithAttendance(
    [
      [child1.getId(), AttendanceLogicalStatus.PRESENT],
      [child2.getId(), AttendanceLogicalStatus.ABSENT],
    ],
    new Date(),
    act1
  ),
  generateEventWithAttendance(
    [
      [child1.getId(), AttendanceLogicalStatus.ABSENT],
      [child2.getId(), AttendanceLogicalStatus.ABSENT],
    ],
    moment().subtract(1, "day").toDate(),
    act1
  ),
  generateEventWithAttendance(
    [
      [child1.getId(), AttendanceLogicalStatus.ABSENT, "Remark 123"],
      [child2.getId(), AttendanceLogicalStatus.ABSENT],
    ],
    moment().subtract(2, "day").toDate(),
    act1
  ),
];

export default {
  title: "Features/Attendance/Dashboards/AttendanceWeekDashboard",
  component: AttendanceWeekDashboardComponent,
  decorators: [
    moduleMetadata({
      imports: [
        AttendanceWeekDashboardComponent,
        StorybookBaseModule,
        MockedTestingModule.withState(LoginState.LOGGED_IN, [
          act1,
          act2,
          child1,
          child2,
          ...events,
          act1,
        ]),
      ],
      providers: [
        {
          provide: DatabaseIndexingService,
          useValue: {
            queryIndexDocsRange: () => Promise.resolve(events),
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

const Template: Story<AttendanceWeekDashboardComponent> = (
  args: AttendanceWeekDashboardComponent
) => ({
  component: AttendanceWeekDashboardComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  daysOffset: 7,
  periodLabel: "since last week",
};
