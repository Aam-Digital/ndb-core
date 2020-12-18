import { Story, Meta } from "@storybook/angular/types-6-0";
import { ChildBlockComponent } from "./child-block.component";
import { Child } from "../model/child";
import { BehaviorSubject } from "rxjs";
import { SafeUrl } from "@angular/platform-browser";
import { moduleMetadata } from "@storybook/angular";
import { FlexLayoutModule } from "@angular/flex-layout";
import { CommonModule } from "@angular/common";

export default {
  title: "Child Dev Project/ChildBlock",
  component: ChildBlockComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, FlexLayoutModule],
    }),
  ],
} as Meta;

const demoChild = new Child("1");
demoChild.name = "John Doe";
demoChild.photo = new BehaviorSubject<SafeUrl>("assets/child.png");
demoChild.projectNumber = "99";
// @ts-ignore
demoChild.phone = "+49 199 1234567"; // @ts-ignore
demoChild.schoolClass = "5";

const Template: Story<ChildBlockComponent> = (args: ChildBlockComponent) => ({
  component: ChildBlockComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  entity: demoChild,
};
