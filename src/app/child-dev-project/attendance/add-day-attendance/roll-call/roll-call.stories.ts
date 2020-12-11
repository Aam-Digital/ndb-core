import { Story, Meta } from "@storybook/angular/types-6-0";
import { RollCallComponent } from "./roll-call.component";
import { DemoChildGenerator } from "../../../children/demo-data-generators/demo-child-generator.service";
import { addDefaultChildPhoto } from "../../../../../../.storybook/utils/addDefaultChildPhoto";
import { moduleMetadata } from "@storybook/angular";
import { CommonModule } from "@angular/common";
import { ChildBlockComponent } from "../../../children/child-block/child-block.component";
import { MatButtonModule } from "@angular/material/button";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Note } from "../../../notes/model/note";

export default {
  title: "Child Dev Project/Views/RollCall",
  component: RollCallComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, BrowserAnimationsModule, MatButtonModule],
      declarations: [ChildBlockComponent],
    }),
  ],
} as Meta;

const demoEvent = Note.create(new Date(), "coaching");
const demoChildren = [
  DemoChildGenerator.generateEntity("1"),
  DemoChildGenerator.generateEntity("2"),
  DemoChildGenerator.generateEntity("3"),
];
demoChildren.forEach((c) => addDefaultChildPhoto(c));
demoChildren.forEach((c) => demoEvent.addChild(c.getId()));

const Template: Story<RollCallComponent> = (args: RollCallComponent) => ({
  component: RollCallComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  eventEntity: demoEvent,
  children: demoChildren,
};
