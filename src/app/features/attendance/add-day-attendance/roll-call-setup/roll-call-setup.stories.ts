import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { applicationConfig, Meta, StoryFn, StoryObj } from "@storybook/angular";
import { RollCallSetupComponent } from "./roll-call-setup.component";
import moment from "moment";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { generateActivity } from "../../demo-data/demo-activity-generator.service";
import { StorybookBaseModule } from "#src/app/utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

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
demoChildren.forEach((c) => demoEvent.addChild(c));

const demoActivities = [
  generateActivity({ participants: demoChildren }),
  generateActivity({ participants: demoChildren }),
];
demoActivities[0].assignedTo = ["demo"];

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
