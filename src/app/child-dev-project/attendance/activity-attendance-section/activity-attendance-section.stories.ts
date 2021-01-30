import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RecurringActivity } from "../model/recurring-activity";
import { ActivityAttendanceSectionComponent } from "./activity-attendance-section.component";
import { AttendanceModule } from "../attendance.module";
import { FontAwesomeIconsModule } from "../../../core/icons/font-awesome-icons.module";
import { RouterTestingModule } from "@angular/router/testing";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { AttendanceService } from "../attendance.service";
import {
  ActivityAttendance,
  generateEventWithAttendance,
} from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { MatNativeDateModule } from "@angular/material/core";
import { ChildrenService } from "../../children/children.service";
import { of } from "rxjs";
import { Child } from "../../children/model/child";
import { EntitySubrecordModule } from "../../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { Angulartics2Module } from "angulartics2";

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
  title: "Child Dev Project/ActivityAttendanceSection",
  component: ActivityAttendanceSectionComponent,
  decorators: [
    moduleMetadata({
      imports: [
        AttendanceModule,
        EntitySubrecordModule,
        FontAwesomeIconsModule,
        RouterTestingModule,
        MatNativeDateModule,
        Angulartics2Module.forRoot(),
      ],
      declarations: [],
      providers: [
        {
          provide: EntityMapperService,
          useValue: { save: () => Promise.resolve() },
        },
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
