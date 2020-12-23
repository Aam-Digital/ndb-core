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
import { AttendanceStatus } from "../model/attendance-status";

const demoActivity = RecurringActivity.create("Coaching Batch C");
const attendanceRecords = [
  ActivityAttendance.create(new Date("2020-01-01"), [
    generateEventWithAttendance({
      "1": AttendanceStatus.PRESENT,
      "2": AttendanceStatus.PRESENT,
      "3": AttendanceStatus.ABSENT,
    }),
    generateEventWithAttendance({
      "1": AttendanceStatus.PRESENT,
      "2": AttendanceStatus.ABSENT,
    }),
  ]),

  ActivityAttendance.create(new Date("2020-02-01"), [
    generateEventWithAttendance({
      "1": AttendanceStatus.ABSENT,
      "2": AttendanceStatus.ABSENT,
    }),
    generateEventWithAttendance({
      "1": AttendanceStatus.PRESENT,
      "2": AttendanceStatus.ABSENT,
    }),
  ]),
];

export default {
  title: "Child Dev Project/ActivityAttendanceSection",
  component: ActivityAttendanceSectionComponent,
  decorators: [
    moduleMetadata({
      imports: [AttendanceModule, FontAwesomeIconsModule, RouterTestingModule],
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
