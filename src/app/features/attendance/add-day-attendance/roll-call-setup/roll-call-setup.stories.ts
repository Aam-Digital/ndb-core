import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { RollCallSetupComponent } from "./roll-call-setup.component";
import moment from "moment";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { ACTIVITY_TYPES } from "../../demo-data/demo-activity-generator.service";
import { StorybookBaseModule } from "#src/app/utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { AttendanceItem } from "../../model/attendance-item";
import { Entity } from "#src/app/core/entity/model/entity";
import { RecurringActivity } from "../../model/recurring-activity";
import { faker } from "#src/app/core/demo-data/faker";

const demoEvents: Note[] = [
  Note.create(new Date(), "Class 5a Parents Meeting"),
  Note.create(new Date(), "Class 6b Parents Meeting"),
  Note.create(new Date(), "Class 7c Parents Meeting"),
  Note.create(moment().subtract(1, "days").toDate(), "Discussion on values"),
  Note.create(new Date(), "Other Discussion"),
];
demoEvents[0].category = { id: "G", label: "Guardians", isMeeting: true };
demoEvents[1].category = { id: "G", label: "Guardians", isMeeting: true };
demoEvents[2].category = { id: "G", label: "Guardians", isMeeting: true };
demoEvents[3].category = { id: "LS", label: "Life Skills", isMeeting: true };
demoEvents[4].category = { id: "OTHER", label: "Other", isMeeting: true };

const demoEvent = Note.create(new Date(), "coaching");
demoEvent.category = { id: "COACHING", label: "Coaching", isMeeting: true };

const demoChildren = [generateChild(), generateChild(), generateChild()];
demoChildren.forEach((c) => {
  demoEvent.addChild(c);
  demoEvent.childrenAttendance.push(
    new AttendanceItem(undefined, "", c.getId()),
  );
});

const demoActivities = [
  generateActivity({ participants: demoChildren }),
  generateActivity({ participants: demoChildren }),
];
demoActivities[0]["assignedTo"] = ["demo"];

export default {
  title: "Features/Attendance/Views/RollCallSetup",
  component: RollCallSetupComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          StorybookBaseModule.withData([
            ...demoChildren,
            ...demoEvents,
            ...demoActivities,
          ]),
        ),
      ],
    }),
  ],
} as Meta;

export const Primary: StoryObj<RollCallSetupComponent> = {
  args: {},
};

function generateActivity({
  participants,
  assignedUser,
  title,
}: {
  participants: Entity[];
  assignedUser?: Entity;
  title?: string;
}): RecurringActivity {
  const activity = new RecurringActivity(faker.string.uuid());
  const type = faker.helpers.arrayElement(ACTIVITY_TYPES);

  activity.title =
    title ??
    type.label +
      " " +
      faker.number.int({ min: 1, max: 9 }) +
      faker.string.alphanumeric(1).toUpperCase();
  activity.type = type;
  activity.participants = participants.map((c) => c.getId());
  activity.assignedTo = [assignedUser?.getId()];

  return activity;
}
