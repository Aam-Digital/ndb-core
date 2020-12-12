import { Story, Meta } from "@storybook/angular/types-6-0";
import { ChildBlockComponent } from "./child-block.component";
import { Child } from "../model/child";
import { BehaviorSubject } from "rxjs";
import { SafeUrl } from "@angular/platform-browser";

export default {
  title: "Child Dev Project/ChildBlock",
  component: ChildBlockComponent,
  argTypes: {},
} as Meta;

const demoChild = new Child("1");
demoChild.name = "John Doe";
demoChild.photo = new BehaviorSubject<SafeUrl>("assets/child.png");
demoChild.projectNumber = "99";
demoChild.phone = "+49 199 1234567";
demoChild.schoolClass = "5";

const Template: Story<ChildBlockComponent> = (args: ChildBlockComponent) => ({
  component: ChildBlockComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: demoChild,
};
