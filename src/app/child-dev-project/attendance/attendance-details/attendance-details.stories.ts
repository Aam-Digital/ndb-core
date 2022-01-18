import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RecurringActivity } from "../model/recurring-activity";
import {
  ActivityAttendance,
  generateEventWithAttendance,
} from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";
import { AttendanceDetailsComponent } from "./attendance-details.component";
import { AttendanceModule } from "../attendance.module";
import { RouterTestingModule } from "@angular/router/testing";
import { FormDialogModule } from "../../../core/form-dialog/form-dialog.module";
import { Angulartics2Module } from "angulartics2";
import { MatNativeDateModule } from "@angular/material/core";
import { EntitySubrecordModule } from "../../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { MatDialogRef } from "@angular/material/dialog";
import { NotesModule } from "../../notes/notes.module";
import { AttendanceService } from "../attendance.service";
import { MockSessionModule } from "../../../core/session/mock-session.module";

const demoActivity = RecurringActivity.create("Coaching Batch C");
const activityAttendance = ActivityAttendance.create(new Date("2020-01-01"), [
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
]);
activityAttendance.events.forEach((e) => (e.subject = demoActivity.title));
activityAttendance.periodTo = new Date("2020-01-31");
activityAttendance.activity = demoActivity;

export default {
  title: "Attendance/Views/AttendanceDetails",
  component: AttendanceDetailsComponent,
  decorators: [
    moduleMetadata({
      imports: [
        AttendanceModule,
        EntitySubrecordModule,
        FormDialogModule,
        RouterTestingModule,
        MatNativeDateModule,
        NotesModule,
        Angulartics2Module.forRoot(),
        MockSessionModule.withState(),
      ],
      declarations: [],
      providers: [
        {
          provide: AttendanceService,
          useValue: null,
        },
        { provide: MatDialogRef, useValue: {} },
      ],
    }),
  ],
} as Meta;

const Template: Story<AttendanceDetailsComponent> = (
  args: AttendanceDetailsComponent
) => ({
  component: AttendanceDetailsComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: activityAttendance,
};

const activityAttendanceIndividual = Object.assign(
  new ActivityAttendance(),
  activityAttendance
);
export const ForIndividualChild = Template.bind({});
ForIndividualChild.args = {
  entity: activityAttendanceIndividual,
  focusedChild: "1",
};
