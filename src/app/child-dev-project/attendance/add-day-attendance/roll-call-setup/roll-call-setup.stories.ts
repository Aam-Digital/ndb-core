import { DemoChildGenerator } from "../../../children/demo-data-generators/demo-child-generator.service";
import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";
import { RollCallSetupComponent } from "./roll-call-setup.component";
import moment from "moment";
import { Note } from "../../../notes/model/note";
import { DemoActivityGeneratorService } from "../../demo-data/demo-activity-generator.service";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { LoginState } from "../../../../core/session/session-states/login-state.enum";

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

const demoChildren = [
  DemoChildGenerator.generateEntity("1"),
  DemoChildGenerator.generateEntity("2"),
  DemoChildGenerator.generateEntity("3"),
];
demoChildren.forEach((c) => demoEvent.addChild(c.getId()));

const demoActivities = [
  DemoActivityGeneratorService.generateActivityForChildren(demoChildren),
  DemoActivityGeneratorService.generateActivityForChildren(demoChildren),
];
demoActivities[0].assignedTo = ["demo"];

export default {
  title: "Features/Attendance/Views/RollCallSetup",
  component: RollCallSetupComponent,
  decorators: [
    moduleMetadata({
      imports: [
        RollCallSetupComponent,
        StorybookBaseModule,
        MockedTestingModule.withState(LoginState.LOGGED_IN, [
          ...demoChildren,
          ...demoEvents,
          ...demoActivities,
        ]),
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<RollCallSetupComponent> = (
  args: RollCallSetupComponent,
) => ({
  component: RollCallSetupComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
