import { RollCallComponent } from "./roll-call.component";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { StorybookBaseModule } from "#src/app/utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";

const demoEvent = Note.create(new Date(), "coaching");
const demoChildren = [generateChild(), generateChild(), generateChild()];
demoChildren.forEach((c) => demoEvent.addChild(c));

export default {
  title: "Features/Attendance/Views/RollCall",
  component: RollCallComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule.withData(demoChildren)),
      ],
    }),
  ],
} as Meta;

export const Primary: StoryObj<RollCallComponent> = {
  args: {
    eventEntity: demoEvent,
    children: demoChildren,
  },
};

export const Finished: StoryObj<RollCallComponent> = {
  args: {
    eventEntity: new Note(),
    children: [],
  },
};
