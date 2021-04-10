import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { AttendanceWeekDashboardComponent } from "./attendance-week-dashboard.component";
import { AttendanceModule } from "../../attendance.module";
import { RecurringActivity } from "../../model/recurring-activity";
import { FontAwesomeIconsModule } from "../../../../core/icons/font-awesome-icons.module";
import { Child } from "../../../children/model/child";
import { generateEventWithAttendance } from "../../model/activity-attendance";
import { AttendanceLogicalStatus } from "../../model/attendance-status";
import { Note } from "../../../notes/model/note";
import moment from "moment";
import { RouterTestingModule } from "@angular/router/testing";
import { Angulartics2Module } from "angulartics2";
import { Database } from "../../../../core/database/database";
import { MockDatabase } from "../../../../core/database/mock-database";

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
      [child1.getId(), AttendanceLogicalStatus.ABSENT],
      [child2.getId(), AttendanceLogicalStatus.ABSENT],
    ],
    moment().subtract(2, "day").toDate(),
    act1
  ),
];

export default {
  title: "Attendance/Dashboards/AttendanceWeekDashboard",
  component: AttendanceWeekDashboardComponent,
  decorators: [
    moduleMetadata({
      imports: [
        AttendanceModule,
        FontAwesomeIconsModule,
        RouterTestingModule,
        Angulartics2Module.forRoot(),
      ],
      providers: [
        {
          provide: Database,
          useValue: MockDatabase.createWithData([
            act1,
            act2,
            child1,
            child2,
            ...events,
          ]),
        },
      ],
    }),
  ],
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
  periodLabel: "foo",
};
